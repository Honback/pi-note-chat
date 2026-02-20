package com.pinote.chat.controller;

import com.pinote.chat.model.Conversation;
import com.pinote.chat.model.ConversationRequest;
import com.pinote.chat.model.ConversationWithMessages;
import com.pinote.chat.model.Message;
import com.pinote.chat.service.ConversationService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/conversations")
public class ConversationController {

    private final ConversationService service;

    public ConversationController(ConversationService service) {
        this.service = service;
    }

    @GetMapping
    public Flux<Conversation> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.listConversations(page, size);
    }

    @PostMapping
    public Mono<Conversation> create(@RequestBody(required = false) ConversationRequest request) {
        String title = (request != null) ? request.title() : null;
        return service.createConversation(title);
    }

    @GetMapping("/{id}")
    public Mono<ConversationWithMessages> get(@PathVariable UUID id) {
        return service.getConversation(id);
    }

    @PatchMapping("/{id}")
    public Mono<Conversation> updateTitle(@PathVariable UUID id,
                                          @RequestBody ConversationRequest request) {
        return service.updateTitle(id, request.title());
    }

    @DeleteMapping("/{id}")
    public Mono<Void> delete(@PathVariable UUID id) {
        return service.deleteConversation(id);
    }

    @GetMapping("/search")
    public Flux<Conversation> search(@RequestParam String q) {
        return service.search(q);
    }

    @GetMapping("/{id}/messages")
    public Flux<Message> messages(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return service.getMessages(id, page, size);
    }
}
