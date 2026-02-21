package com.pinote.chat.service;

import com.pinote.chat.model.ChatEvent;
import com.pinote.chat.model.Message;
import com.pinote.chat.repository.MessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final OllamaClient ollamaClient;
    private final MessageRepository messageRepo;
    private final ConversationService conversationService;
    private final TitleGenerationService titleService;

    public ChatService(OllamaClient ollamaClient,
                       MessageRepository messageRepo,
                       ConversationService conversationService,
                       TitleGenerationService titleService) {
        this.ollamaClient = ollamaClient;
        this.messageRepo = messageRepo;
        this.conversationService = conversationService;
        this.titleService = titleService;
    }

    public Flux<ChatEvent> chat(UUID conversationId, String userContent) {
        // Save user message first
        Message userMsg = Message.create(conversationId, "user", userContent);

        return messageRepo.save(userMsg)
                .flatMap(saved -> conversationService.incrementMessageCount(conversationId).thenReturn(saved))
                .flatMapMany(savedUserMsg -> {
                    // Build message history for Ollama
                    return messageRepo.findByConversationIdOrderByCreatedAtAsc(conversationId)
                            .collectList()
                            .flatMapMany(history -> streamFromOllama(conversationId, history, userContent));
                });
    }

    private Flux<ChatEvent> streamFromOllama(UUID conversationId,
                                              List<Message> history,
                                              String userContent) {
        // Convert to Ollama message format
        List<Map<String, String>> ollamaMessages = new ArrayList<>();
        for (Message msg : history) {
            ollamaMessages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
        }

        UUID assistantMsgId = UUID.randomUUID();
        AtomicReference<StringBuilder> contentBuffer = new AtomicReference<>(new StringBuilder());

        // Start event
        Flux<ChatEvent> startEvent = Flux.just(
                new ChatEvent.MessageStart(assistantMsgId, conversationId)
        );

        // Stream tokens from Ollama
        Flux<ChatEvent> tokenStream = ollamaClient.chatStream(ollamaMessages)
                .filter(chunk -> chunk.message() != null && chunk.message().content() != null)
                .map(chunk -> {
                    String token = chunk.message().content();
                    contentBuffer.get().append(token);
                    return (ChatEvent) new ChatEvent.Token(token);
                });

        // On complete: save assistant message, generate title if first exchange
        // Use explicit INSERT to avoid Spring Data treating pre-set ID as UPDATE
        Flux<ChatEvent> endEvent = Mono.defer(() -> {
            String fullContent = contentBuffer.get().toString();

            return messageRepo.insertMessage(assistantMsgId, conversationId, "assistant", fullContent, java.time.Instant.now())
                    .then(conversationService.incrementMessageCount(conversationId))
                    .then(conversationService.getConversation(conversationId))
                    .flatMap(convWithMsgs -> {
                        if (convWithMsgs.conversation().getMessageCount() <= 2
                                && "New Conversation".equals(convWithMsgs.conversation().getTitle())) {
                            return titleService.generateTitleAsync(conversationId, userContent, fullContent)
                                    .map(title -> (ChatEvent) new ChatEvent.MessageEnd(assistantMsgId, title))
                                    .defaultIfEmpty(new ChatEvent.MessageEnd(assistantMsgId, null));
                        }
                        return Mono.just((ChatEvent) new ChatEvent.MessageEnd(assistantMsgId, null));
                    });
        }).flux();

        return Flux.concat(startEvent, tokenStream, endEvent)
                .onErrorResume(e -> {
                    log.error("Chat stream error: {}", e.getMessage());
                    return Flux.just(new ChatEvent.Error("STREAM_ERROR", e.getMessage()));
                });
    }
}
