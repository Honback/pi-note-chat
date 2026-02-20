package com.pinote.chat.controller;

import com.pinote.chat.service.OllamaClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/device")
public class DeviceController {

    private static final Logger log = LoggerFactory.getLogger(DeviceController.class);

    private final OllamaClient ollamaClient;
    private final WebClient deviceWebClient;

    public DeviceController(OllamaClient ollamaClient,
                            @Value("${app.ollama.base-url}") String ollamaBaseUrl) {
        this.ollamaClient = ollamaClient;
        // Monitoring agent runs on the same host as Ollama, port 8085
        String deviceHost = ollamaBaseUrl.replaceAll(":\\d+$", ":8085");
        this.deviceWebClient = WebClient.builder()
                .baseUrl(deviceHost)
                .build();
    }

    @GetMapping("/stats")
    public Mono<Map<String, Object>> getStats() {
        Mono<Map> deviceStats = deviceWebClient.get()
                .uri("/stats")
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(3))
                .onErrorResume(e -> {
                    log.debug("Device monitoring agent not available: {}", e.getMessage());
                    return Mono.just(Map.of());
                });

        Mono<Boolean> ollamaReachable = ollamaClient.isReachable();

        return Mono.zip(deviceStats, ollamaReachable)
                .map(tuple -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> stats = tuple.getT1();
                    boolean connected = tuple.getT2();

                    boolean hasDeviceStats = !stats.isEmpty();
                    return Map.of(
                            "online", connected,
                            "hasDeviceStats", hasDeviceStats,
                            "cpu", stats.getOrDefault("cpu", -1),
                            "temperature", stats.getOrDefault("temperature", -1),
                            "memoryUsed", stats.getOrDefault("memoryUsed", -1),
                            "memoryTotal", stats.getOrDefault("memoryTotal", -1)
                    );
                });
    }
}
