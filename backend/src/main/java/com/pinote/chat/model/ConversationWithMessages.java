package com.pinote.chat.model;

import java.util.List;

public record ConversationWithMessages(Conversation conversation, List<Message> messages) {}
