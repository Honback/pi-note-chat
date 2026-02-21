package com.pinote.chat.repository;

import com.pinote.chat.model.Message;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

public interface MessageRepository extends ReactiveCrudRepository<Message, UUID> {

    @Modifying
    @Query("INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (:id, :conversationId, :role, :content, :createdAt)")
    Mono<Void> insertMessage(UUID id, UUID conversationId, String role, String content, Instant createdAt);

    @Query("SELECT * FROM messages WHERE conversation_id = :conversationId ORDER BY created_at ASC")
    Flux<Message> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    @Query("""
        SELECT * FROM messages WHERE conversation_id = :conversationId
        ORDER BY created_at ASC
        LIMIT :size OFFSET :offset
    """)
    Flux<Message> findByConversationIdPaged(UUID conversationId, int size, long offset);

    @Query("SELECT COUNT(*) FROM messages WHERE conversation_id = :conversationId")
    Mono<Long> countByConversationId(UUID conversationId);

    Mono<Void> deleteByConversationId(UUID conversationId);
}
