package com.pinote.chat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("conversations")
public class Conversation {

    @Id
    private UUID id;
    private String title;
    private Instant createdAt;
    private Instant updatedAt;
    private int messageCount;

    public Conversation() {}

    public static Conversation create(String title) {
        Conversation c = new Conversation();
        c.title = (title != null && !title.isBlank()) ? title : "New Conversation";
        c.createdAt = Instant.now();
        c.updatedAt = Instant.now();
        c.messageCount = 0;
        return c;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public int getMessageCount() { return messageCount; }
    public void setMessageCount(int messageCount) { this.messageCount = messageCount; }
}
