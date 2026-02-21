package com.pinote.chat.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pinote.chat.model.OllamaChatChunk;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Component
public class OllamaClient {

    private static final Logger log = LoggerFactory.getLogger(OllamaClient.class);

    private final WebClient ollamaWebClient;
    private final ObjectMapper objectMapper;
    private volatile String model;

    public OllamaClient(WebClient ollamaWebClient,
                         ObjectMapper objectMapper,
                         @Value("${app.ollama.model}") String model) {
        this.ollamaWebClient = ollamaWebClient;
        this.objectMapper = objectMapper;
        this.model = model;
    }

    public void setCurrentModel(String model) {
        this.model = model;
        log.info("Active model switched to: {}", model);
    }

    /**
     * Streaming chat: returns NDJSON chunks parsed into OllamaChatChunk.
     */
    public Flux<OllamaChatChunk> chatStream(List<Map<String, String>> messages) {
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", messages,
                "stream", true
        );

        return ollamaWebClient.post()
                .uri("/api/chat")
                .bodyValue(body)
                .retrieve()
                .bodyToFlux(DataBuffer.class)
                .map(buffer -> {
                    String text = buffer.toString(StandardCharsets.UTF_8);
                    DataBufferUtils.release(buffer);
                    return text;
                })
                .flatMap(this::parseNdjsonLines);
    }

    /**
     * Non-streaming call for title generation.
     */
    public Mono<String> generate(String prompt) {
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "stream", false
        );

        return ollamaWebClient.post()
                .uri("/api/chat")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .map(resp -> {
                    @SuppressWarnings("unchecked")
                    Map<String, String> msg = (Map<String, String>) resp.get("message");
                    return msg != null ? msg.getOrDefault("content", "") : "";
                })
                .onErrorResume(e -> {
                    log.warn("Title generation failed: {}", e.getMessage());
                    return Mono.just("");
                });
    }

    public Mono<Boolean> isReachable() {
        return ollamaWebClient.get()
                .uri("/")
                .retrieve()
                .toBodilessEntity()
                .map(resp -> true)
                .onErrorResume(e -> Mono.just(false));
    }

    @SuppressWarnings("rawtypes")
    public Mono<Map> listModels() {
        return ollamaWebClient.get()
                .uri("/api/tags")
                .retrieve()
                .bodyToMono(Map.class)
                .onErrorResume(e -> {
                    log.warn("Failed to list models: {}", e.getMessage());
                    return Mono.just(Map.of("models", List.of()));
                });
    }

    @SuppressWarnings("rawtypes")
    public Mono<Map> listRunningModels() {
        return ollamaWebClient.get()
                .uri("/api/ps")
                .retrieve()
                .bodyToMono(Map.class)
                .onErrorResume(e -> {
                    log.warn("Failed to list running models: {}", e.getMessage());
                    return Mono.just(Map.of("models", List.of()));
                });
    }

    public Flux<String> pullModel(String modelName) {
        return ollamaWebClient.post()
                .uri("/api/pull")
                .bodyValue(Map.of("model", modelName, "stream", true))
                .retrieve()
                .bodyToFlux(DataBuffer.class)
                .map(buffer -> {
                    String t = buffer.toString(StandardCharsets.UTF_8);
                    DataBufferUtils.release(buffer);
                    return t;
                });
    }

    public Mono<Boolean> deleteModel(String modelName) {
        return ollamaWebClient.method(org.springframework.http.HttpMethod.DELETE)
                .uri("/api/delete")
                .bodyValue(Map.of("model", modelName))
                .retrieve()
                .toBodilessEntity()
                .map(resp -> true)
                .onErrorResume(e -> {
                    log.warn("Failed to delete model {}: {}", modelName, e.getMessage());
                    return Mono.just(false);
                });
    }

    public String getCurrentModel() {
        return model;
    }

    private Flux<OllamaChatChunk> parseNdjsonLines(String text) {
        return Flux.fromArray(text.split("\n"))
                .filter(line -> !line.isBlank())
                .flatMap(line -> {
                    try {
                        return Flux.just(objectMapper.readValue(line, OllamaChatChunk.class));
                    } catch (Exception e) {
                        log.debug("Skip unparseable NDJSON line: {}", line);
                        return Flux.empty();
                    }
                });
    }
}
