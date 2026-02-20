package com.pinote.chat.service;

import com.pinote.chat.repository.ConversationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Instant;
import java.util.UUID;

@Service
public class TitleGenerationService {

    private static final Logger log = LoggerFactory.getLogger(TitleGenerationService.class);

    private final OllamaClient ollamaClient;
    private final ConversationRepository conversationRepo;

    public TitleGenerationService(OllamaClient ollamaClient,
                                   ConversationRepository conversationRepo) {
        this.ollamaClient = ollamaClient;
        this.conversationRepo = conversationRepo;
    }

    /**
     * Asynchronously generate a title from the first user message and assistant reply.
     * Returns the generated title (or null if skipped/failed).
     */
    public Mono<String> generateTitleAsync(UUID conversationId, String userMessage, String assistantReply) {
        String prompt = String.format(
                "Generate a concise title (3-6 words, no quotes) for this conversation:\n" +
                "User: %s\nAssistant: %s\nTitle:",
                truncate(userMessage, 200),
                truncate(assistantReply, 200)
        );

        return ollamaClient.generate(prompt)
                .map(title -> title.strip().replaceAll("^\"|\"$", ""))
                .filter(title -> !title.isBlank())
                .flatMap(title -> conversationRepo.findById(conversationId)
                        .flatMap(conv -> {
                            conv.setTitle(title);
                            conv.setUpdatedAt(Instant.now());
                            return conversationRepo.save(conv);
                        })
                        .thenReturn(title))
                .subscribeOn(Schedulers.boundedElastic())
                .doOnError(e -> log.warn("Title generation failed for {}: {}", conversationId, e.getMessage()))
                .onErrorResume(e -> Mono.empty());
    }

    private String truncate(String text, int maxLen) {
        return text.length() <= maxLen ? text : text.substring(0, maxLen) + "...";
    }
}
