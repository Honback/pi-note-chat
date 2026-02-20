package com.pinote.chat.model;

import java.util.UUID;

public sealed interface ChatEvent {

    record MessageStart(UUID messageId, UUID conversationId) implements ChatEvent {}

    record Token(String content) implements ChatEvent {}

    record MessageEnd(UUID messageId, String title) implements ChatEvent {}

    record Error(String code, String message) implements ChatEvent {}
}
