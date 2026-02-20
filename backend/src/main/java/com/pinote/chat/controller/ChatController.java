package com.pinote.chat.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pinote.chat.model.ChatEvent;
import com.pinote.chat.model.ChatRequest;
import com.pinote.chat.service.ChatService;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.UUID;

@RestController
@RequestMapping("/conversations/{conversationId}/chat")
public class ChatController {

    private final ChatService chatService;
    private final ObjectMapper objectMapper;

    public ChatController(ChatService chatService, ObjectMapper objectMapper) {
        this.chatService = chatService;
        this.objectMapper = objectMapper;
    }

    @PostMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> chat(
            @PathVariable UUID conversationId,
            @RequestBody ChatRequest request) {

        return chatService.chat(conversationId, request.content())
                .map(this::toSse);
    }

    private ServerSentEvent<String> toSse(ChatEvent event) {
        try {
            String eventType;
            if (event instanceof ChatEvent.MessageStart) {
                eventType = "message-start";
            } else if (event instanceof ChatEvent.Token) {
                eventType = "token";
            } else if (event instanceof ChatEvent.MessageEnd) {
                eventType = "message-end";
            } else {
                eventType = "error";
            }
            String data = objectMapper.writeValueAsString(event);
            return ServerSentEvent.<String>builder()
                    .event(eventType)
                    .data(data)
                    .build();
        } catch (Exception e) {
            return ServerSentEvent.<String>builder()
                    .event("error")
                    .data("{\"code\":\"SERIALIZE_ERROR\",\"message\":\"" + e.getMessage() + "\"}")
                    .build();
        }
    }
}
