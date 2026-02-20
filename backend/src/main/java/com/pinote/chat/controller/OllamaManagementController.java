package com.pinote.chat.controller;

import com.pinote.chat.service.OllamaClient;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/ollama")
public class OllamaManagementController {

    private final OllamaClient ollamaClient;

    public OllamaManagementController(OllamaClient ollamaClient) {
        this.ollamaClient = ollamaClient;
    }

    @GetMapping("/status")
    public Mono<Map<String, Object>> getStatus() {
        return ollamaClient.isReachable()
                .zipWith(ollamaClient.listRunningModels())
                .map(tuple -> {
                    boolean connected = tuple.getT1();
                    @SuppressWarnings("unchecked")
                    Map<String, Object> running = tuple.getT2();
                    return Map.of(
                            "connected", connected,
                            "currentModel", ollamaClient.getCurrentModel(),
                            "runningModels", running.getOrDefault("models", java.util.List.of())
                    );
                });
    }

    @GetMapping("/models")
    public Mono<Map> getModels() {
        return ollamaClient.listModels();
    }

    @PostMapping(value = "/models/pull", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> pullModel(@RequestBody Map<String, String> body) {
        String modelName = body.get("model");
        if (modelName == null || modelName.isBlank()) {
            return Flux.just(ServerSentEvent.<String>builder()
                    .event("error")
                    .data("{\"error\":\"model name is required\"}")
                    .build());
        }
        return ollamaClient.pullModel(modelName)
                .map(data -> ServerSentEvent.<String>builder()
                        .event("progress")
                        .data(data)
                        .build())
                .concatWith(Flux.just(ServerSentEvent.<String>builder()
                        .event("done")
                        .data("{\"status\":\"completed\"}")
                        .build()))
                .onErrorResume(e -> Flux.just(ServerSentEvent.<String>builder()
                        .event("error")
                        .data("{\"error\":\"" + e.getMessage() + "\"}")
                        .build()));
    }

    @DeleteMapping("/models/{name}")
    public Mono<Map<String, Object>> deleteModel(@PathVariable String name) {
        return ollamaClient.deleteModel(name)
                .map(success -> Map.<String, Object>of("success", success, "model", name));
    }
}
