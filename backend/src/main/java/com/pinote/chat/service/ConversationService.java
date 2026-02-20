package com.pinote.chat.service;

import com.pinote.chat.model.Conversation;
import com.pinote.chat.model.ConversationWithMessages;
import com.pinote.chat.model.Message;
import com.pinote.chat.repository.ConversationRepository;
import com.pinote.chat.repository.MessageRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepo;
    private final MessageRepository messageRepo;

    public ConversationService(ConversationRepository conversationRepo,
                               MessageRepository messageRepo) {
        this.conversationRepo = conversationRepo;
        this.messageRepo = messageRepo;
    }

    public Flux<Conversation> listConversations(int page, int size) {
        return conversationRepo.findAllPaged(size, (long) page * size);
    }

    public Mono<Conversation> createConversation(String title) {
        return conversationRepo.save(Conversation.create(title));
    }

    public Mono<ConversationWithMessages> getConversation(UUID id) {
        return conversationRepo.findById(id)
                .flatMap(conv ->
                    messageRepo.findByConversationIdOrderByCreatedAtAsc(id)
                            .collectList()
                            .map(msgs -> new ConversationWithMessages(conv, msgs))
                );
    }

    public Mono<Conversation> updateTitle(UUID id, String title) {
        return conversationRepo.findById(id)
                .flatMap(conv -> {
                    conv.setTitle(title);
                    conv.setUpdatedAt(Instant.now());
                    return conversationRepo.save(conv);
                });
    }

    public Mono<Void> deleteConversation(UUID id) {
        return conversationRepo.deleteById(id);
    }

    public Flux<Conversation> search(String query) {
        return conversationRepo.searchByContent(query, 20);
    }

    public Mono<Conversation> incrementMessageCount(UUID id) {
        return conversationRepo.findById(id)
                .flatMap(conv -> {
                    conv.setMessageCount(conv.getMessageCount() + 1);
                    conv.setUpdatedAt(Instant.now());
                    return conversationRepo.save(conv);
                });
    }

    public Flux<Message> getMessages(UUID conversationId, int page, int size) {
        return messageRepo.findByConversationIdPaged(conversationId, size, (long) page * size);
    }
}
