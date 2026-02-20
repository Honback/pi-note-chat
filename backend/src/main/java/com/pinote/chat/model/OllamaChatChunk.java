package com.pinote.chat.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OllamaChatChunk(
        OllamaMessage message,
        boolean done
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OllamaMessage(String role, String content) {}
}
