package com.safechat.safechat.model;

public record ModeratedChatMessage(
        String sender,
        String content,
        String type,
        boolean moderated,
        boolean moderationUnavailable
) {
}