package com.safechat.safechat.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.util.Map;

@Service
public class ModerationApiClient {

    private final RestClient restClient;

    public ModerationApiClient(
            @Value("${moderation.api.url}") String moderationApiUrl
    ) {
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .build();

        JdkClientHttpRequestFactory requestFactory =
                new JdkClientHttpRequestFactory(httpClient);

        this.restClient = RestClient.builder()
                .baseUrl(moderationApiUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public ModerationResult moderar(String content) {
        if (content == null || content.isBlank()) {
            return new ModerationResult(
                    content,
                    false,
                    false
            );
        }

        try {
            Map<String, String> requestBody = Map.of(
                    "content",
                    content
            );

            ModerationResponse response = restClient
                    .post()
                    .uri("/moderate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(ModerationResponse.class);

            if (response == null || response.content() == null) {
                System.err.println(
                        "A API de moderação retornou uma resposta vazia."
                );

                return new ModerationResult(
                        content,
                        false,
                        true
                );
            }

            return new ModerationResult(
                    response.content(),
                    response.moderated(),
                    false
            );

        } catch (RestClientResponseException exception) {
            System.err.println(
                    "Erro HTTP da API de moderação: "
                            + exception.getStatusCode()
            );

            System.err.println(
                    "Resposta recebida do FastAPI: "
                            + exception.getResponseBodyAsString()
            );

            return new ModerationResult(
                    content,
                    false,
                    true
            );

        } catch (RestClientException exception) {
            System.err.println(
                    "Falha ao acessar a API de moderação: "
                            + exception.getMessage()
            );

            return new ModerationResult(
                    content,
                    false,
                    true
            );
        }
    }

    private record ModerationResponse(
            @JsonProperty("original_content")
            String originalContent,

            String content,

            boolean moderated
    ) {
    }

    public record ModerationResult(
            String content,
            boolean moderated,
            boolean moderationUnavailable
    ) {
    }
}