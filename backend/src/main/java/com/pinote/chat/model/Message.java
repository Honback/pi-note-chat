package com.pinote.chat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("messages")
public class Message {

    @Id
    private UUID id;
    private UUID conversationId;
    private String role;
    private String content;
    private Instant createdAt;

    public Message() {}

    public static Message create(UUID conversationId, String role, String content) {
        Message m = new Message();
        m.conversationId = conversationId;
        m.role = role;
        m.content = content;
        m.createdAt = Instant.now();
        return m;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getConversationId() { return conversationId; }
    public void setConversationId(UUID conversationId) { this.conversationId = conversationId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
