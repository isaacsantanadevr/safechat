package com.safechat.safechat.controller;

import com.safechat.safechat.model.ChatMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    @MessageMapping("/chat.send")
    @SendTo("/topic/public")
    public ChatMessage enviarMensagem(ChatMessage mensagem) {
        return mensagem;
    }
}