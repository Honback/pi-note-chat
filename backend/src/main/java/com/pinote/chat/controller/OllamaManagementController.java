package com.pinote.chat.controller;

import com.pinote.chat.service.OllamaClient;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

@RestController
@RequestMapping("/ollama")
public class OllamaManagementController {

    private final OllamaClient ollamaClient;

    public OllamaManagementController(OllamaClient ollamaClient) {
        this.ollamaClient = ollamaClient;
    }

    @PostMapping("/test")
    public Mono<Map<String, Object>> testConnection(@RequestBody(required = false) Map<String, String> body) {
        String prompt = (body != null && body.containsKey("prompt"))
                ? body.get("prompt")
                : "Say hello in one short sentence.";

        long startTime = System.currentTimeMillis();

        return ollamaClient.isReachable()
                .flatMap(connected -> {
                    if (!connected) {
                        return Mono.just(Map.<String, Object>of(
                                "success", false,
                                "error", "Cannot reach Ollama server",
                                "model", ollamaClient.getCurrentModel()
                        ));
                    }
                    AtomicReference<StringBuilder> buffer = new AtomicReference<>(new StringBuilder());
                    return ollamaClient.chatStream(java.util.List.of(
                                    Map.of("role", "user", "content", prompt)
                            ))
                            .filter(chunk -> chunk.message() != null && chunk.message().content() != null)
                            .doOnNext(chunk -> buffer.get().append(chunk.message().content()))
                            .then(Mono.fromSupplier(() -> {
                                long elapsed = System.currentTimeMillis() - startTime;
                                return Map.<String, Object>of(
                                        "success", true,
                                        "model", ollamaClient.getCurrentModel(),
                                        "response", buffer.get().toString(),
                                        "elapsed_ms", elapsed
                                );
                            }));
                })
                .onErrorResume(e -> Mono.just(Map.<String, Object>of(
                        "success", false,
                        "error", e.getMessage() != null ? e.getMessage() : "Unknown error",
                        "model", ollamaClient.getCurrentModel()
                )));
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
