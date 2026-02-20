package com.pinote.chat.repository;

import com.pinote.chat.model.Conversation;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface ConversationRepository extends ReactiveCrudRepository<Conversation, UUID> {

    @Query("SELECT * FROM conversations ORDER BY updated_at DESC LIMIT :size OFFSET :offset")
    Flux<Conversation> findAllPaged(int size, long offset);

    @Query("""
        SELECT DISTINCT c.* FROM conversations c
        JOIN messages m ON m.conversation_id = c.id
        WHERE to_tsvector('simple', m.content) @@ plainto_tsquery('simple', :query)
           OR c.title ILIKE '%' || :query || '%'
        ORDER BY c.updated_at DESC
        LIMIT :limit
    """)
    Flux<Conversation> searchByContent(String query, int limit);
}
