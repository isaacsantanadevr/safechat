package com.safechat.safechat.model;

public record ChatMessage(
        String sender,
        String content,
        String type
) {
}