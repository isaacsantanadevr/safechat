package com.safechat.safechat.controller;

import com.safechat.safechat.model.ChatMessage;
import com.safechat.safechat.model.ModeratedChatMessage;
import com.safechat.safechat.service.ModerationApiClient;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    private final ModerationApiClient moderationApiClient;

    public ChatController(
            ModerationApiClient moderationApiClient
    ) {
        this.moderationApiClient = moderationApiClient;
    }

    @MessageMapping("/chat.send")
    @SendTo("/topic/public")
    public ModeratedChatMessage enviarMensagem(
            ChatMessage mensagem
    ) {
        /*
         * Mensagens de entrada no chat não precisam
         * ser enviadas para o serviço de moderação.
         */
        if ("JOIN".equals(mensagem.type())) {
            return new ModeratedChatMessage(
                    mensagem.sender(),
                    mensagem.content(),
                    mensagem.type(),
                    false,
                    false
            );
        }

        ModerationApiClient.ModerationResult resultado =
                moderationApiClient.moderar(
                        mensagem.content()
                );

        return new ModeratedChatMessage(
                mensagem.sender(),
                resultado.content(),
                mensagem.type(),
                resultado.moderated(),
                resultado.moderationUnavailable()
        );
    }
}