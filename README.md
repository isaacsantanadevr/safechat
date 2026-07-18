<div align="center">

# 🛡️ SafeChat

**Chat web em tempo real com moderação automática de linguagem ofensiva**

![Java](https://img.shields.io/badge/Java-25-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.0-6DB33F?logo=springboot&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-STOMP%20%2F%20SockJS-informational)
![Maven](https://img.shields.io/badge/build-Maven%20Wrapper-C71A36?logo=apachemaven&logoColor=white)
![Docker](https://img.shields.io/badge/container-Docker-2496ED?logo=docker&logoColor=white)

### 🔗 [**Acesse o chat publicado**](https://projeto-pln-safechat.up.railway.app/)

</div>

---

Este repositório contém o **back-end e o front-end do chat**. A moderação
em si (o que decide o que é ofensivo) roda num serviço separado, consumido
via HTTP: [`safechat-moderacao-api`](https://github.com/isaacsantanadevr/safechat-moderacao-api).

## 📖 Visão geral

- Vários usuários entram na mesma sala de chat só digitando um nome (sem
  cadastro, sem senha) e conversam em tempo real via WebSocket.
- Toda mensagem enviada passa por uma chamada HTTP para a API de moderação
  antes de ser distribuída aos outros usuários. Se a mensagem for
  sinalizada como ofensiva, ela chega mascarada/bloqueada para todo mundo,
  incluindo quem a enviou.
- Se a API de moderação estiver fora do ar ou demorar demais, o chat **não
  trava**: a mensagem é entregue sem moderação, e todos os clientes exibem
  um aviso de "serviço de moderação indisponível" naquela mensagem.

## 🏗️ Arquitetura

```
Navegador (HTML/CSS/JS)
      │  WebSocket (SockJS + STOMP)
      ▼
Spring Boot (Java 25)
      │  HTTP (RestClient)
      ▼
API de moderação (FastAPI, repositório separado)
```

- **Back-end**: Java 25 + Spring Boot 4.1.0, com WebSocket/STOMP para
  comunicação em tempo real entre os clientes conectados.
- **Front-end**: HTML, CSS e JavaScript puros (sem framework), servidos
  diretamente pelo Spring como recursos estáticos.
- **Moderação**: delegada por completo a um serviço HTTP externo. Este
  repositório não implementa nenhuma lógica de detecção de ofensa — só
  envia o texto e aplica o resultado que a API de moderação devolve.

## 🔄 Fluxo de uma mensagem, passo a passo

1. O usuário digita o nome e entra no chat. O front-end (`chat.js`) abre uma
   conexão WebSocket em `/ws` (via SockJS) e se inscreve no tópico
   `/topic/public`.
2. Ao enviar uma mensagem, o front-end publica um frame STOMP em
   `/app/chat.send`.
3. `ChatController` recebe a mensagem e chama `ModerationApiClient`, que faz
   um `POST /moderate` para a API de moderação (URL definida por
   `MODERATION_API_URL`).
4. A API de moderação devolve o texto (censurado ou não) e uma flag
   `moderated`. Se a chamada falhar por qualquer motivo (serviço fora do
   ar, timeout, erro HTTP), `ModerationApiClient` **não propaga o erro** —
   devolve o texto original com a flag `moderationUnavailable = true`.
5. `ChatController` transmite o resultado para `/topic/public`.
6. Todos os clientes inscritos recebem a mensagem e o front-end renderiza:
   mensagens próprias à direita, de outras pessoas à esquerda (estilo
   WhatsApp), com o selo de "moderada automaticamente" ou "moderação
   indisponível" quando aplicável.

Mensagens do tipo `JOIN` (entrada de um usuário na sala) **não** passam
pela moderação — não faz sentido moderar "Fulano entrou no chat.".

## ✅ Requisitos

- **Java 25** (JDK). O projeto usa `<java.version>25</java.version>` no
  `pom.xml` e a imagem `eclipse-temurin:25-jdk` no Docker.
- Não é necessário instalar o Maven — o projeto já inclui o Maven Wrapper
  (`mvnw` / `mvnw.cmd`), que baixa a versão certa automaticamente.
- Opcionalmente, a [API de moderação](https://github.com/isaacsantanadevr/safechat-moderacao-api)
  rodando localmente (padrão: `http://localhost:8000`) para que as
  mensagens sejam realmente moderadas. **Sem ela rodando, o chat continua
  funcionando normalmente** — as mensagens só chegam com o aviso de
  moderação indisponível, em vez de serem analisadas.

## ▶️ Como rodar localmente

> 💡 Se só quiser ver o chat funcionando sem rodar nada localmente, a
> versão publicada está em
> **https://projeto-pln-safechat.up.railway.app/**.

**Windows (PowerShell):**
```powershell
.\mvnw.cmd spring-boot:run
```

**Linux/macOS:**
```bash
./mvnw spring-boot:run
```

A aplicação sobe em `http://localhost:8080` por padrão. Abra essa URL no
navegador, digite um nome e entre no chat. Abra em duas abas (ou
navegadores) diferentes para simular dois usuários conversando.

Para gerar o `.jar` e rodar separadamente:
```bash
./mvnw clean package -DskipTests
java -jar target/safechat-0.0.1-SNAPSHOT.jar
```

## ⚙️ Configuração (variáveis de ambiente)

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `8080` | Porta em que o servidor Spring Boot sobe. |
| `MODERATION_API_URL` | `http://localhost:8000` | URL base da API de moderação (deve expor `POST /moderate`). |

Exemplo rodando com a API de moderação em outro endereço:
```bash
MODERATION_API_URL=http://localhost:9000 ./mvnw spring-boot:run
```

No Windows (PowerShell):
```powershell
$env:MODERATION_API_URL = "http://localhost:9000"
.\mvnw.cmd spring-boot:run
```

## 📁 Estrutura do projeto

```
src/main/java/com/safechat/safechat/
├── SafechatApplication.java        # ponto de entrada (main) do Spring Boot
├── config/
│   └── WebSocketConfig.java        # habilita STOMP sobre WebSocket, define /ws e /topic
├── controller/
│   └── ChatController.java         # recebe /app/chat.send, chama a moderação, publica em /topic/public
├── model/
│   ├── ChatMessage.java            # payload recebido do cliente (sender, content, type)
│   └── ModeratedChatMessage.java   # payload transmitido aos clientes (com moderated/moderationUnavailable)
└── service/
    └── ModerationApiClient.java    # cliente HTTP para a API de moderação, com tratamento de falha

src/main/resources/
├── application.properties          # porta e URL da API de moderação
└── static/
    ├── index.html                  # telas de login e de chat (SPA simples, sem framework)
    ├── style.css                   # estilo visual (tema roxo/violeta)
    └── chat.js                     # conexão WebSocket/STOMP, envio/recebimento de mensagens

src/test/java/.../SafechatApplicationTests.java   # teste de contexto (a aplicação Spring sobe sem erro)

Dockerfile                          # build multi-stage (compila e empacota em uma imagem enxuta)
mvnw / mvnw.cmd                     # Maven Wrapper (Linux/macOS e Windows)
```

## 🎨 Front-end

`index.html` contém duas telas dentro da mesma página (`#login-screen` e
`#chat-screen`), alternadas via classe CSS `hidden`. Os elementos que o
`chat.js` manipula diretamente por `id`:

| id | Papel |
|---|---|
| `username` | campo de texto com o nome do usuário |
| `enter-button` | botão que inicia a conexão WebSocket |
| `connection-error` | mensagem de erro de conexão |
| `current-user` | exibe o nome do usuário conectado, no cabeçalho do chat |
| `messages` | lista (`<ul>`) onde as mensagens são inseridas |
| `message-form` / `message-input` | formulário de envio de mensagem |

Bibliotecas de terceiros usadas (via CDN, carregadas em `index.html`):
[SockJS](https://github.com/sockjs/sockjs-client) e
[Stomp.js](https://stomp-js.github.io/) para a comunicação em tempo real.

As mensagens do próprio usuário recebem a classe `message--mine`
(alinhadas à direita) e as de outros usuários `message--theirs`
(alinhadas à esquerda), no mesmo estilo do WhatsApp. Os avisos de
moderação usam as classes `moderation-notice` (mensagem moderada) e
`moderation-unavailable` (moderação fora do ar).

## 🐳 Docker

O `Dockerfile` faz um build multi-stage: a primeira etapa compila o
projeto com o Maven Wrapper, a segunda copia só o `.jar` final para uma
imagem enxuta (sem o JDK completo de build).

```bash
docker build -t safechat .
docker run -p 8080:8080 -e MODERATION_API_URL=http://host.docker.internal:8000 safechat
```

`host.docker.internal` permite que o container acesse a API de moderação
rodando na máquina host, fora do Docker. Se a API de moderação também
estiver em um container, use o nome do serviço/rede Docker no lugar.

## 🧪 Testes

```bash
./mvnw test
```

O projeto inclui um teste de contexto (`SafechatApplicationTests`), que
verifica se a aplicação Spring Boot sobe corretamente com todas as
configurações e beans (incluindo `ModerationApiClient`), sem exercitar o
fluxo de chat em si.

## ⚠️ Limitações conhecidas

- **Uma única sala global**: todos os usuários conectados compartilham o
  mesmo tópico `/topic/public`; não há salas separadas.
- **Sem persistência**: mensagens existem só em memória, durante a
  conexão. Reiniciar o servidor ou atualizar a página apaga o histórico.
- **Sem autenticação**: qualquer nome pode ser usado, inclusive repetido
  por várias pessoas ao mesmo tempo.
- **Sem contagem de usuários online**: funcionalidade cogitada durante o
  desenvolvimento, mas não implementada — exigiria rastrear conexão/
  desconexão de sessões WebSocket no back-end, o que está fora do escopo
  atual.

## 🔗 Repositório da API de moderação

A lógica de detecção de linguagem ofensiva (três camadas: correspondência
exata, similaridade textual e classificação semântica) vive em
[`safechat-moderacao-api`](https://github.com/isaacsantanadevr/safechat-moderacao-api),
com seu próprio README explicando como rodá-la, testá-la e avaliá-la.

## 👥 Desenvolvedores

- [@isaacsantanadevr](https://github.com/isaacsantanadevr)
- [@gabrielmarcone](https://github.com/gabrielmarcone)
- [@joaoguilhermedss](https://github.com/joaoguilhermedss)
- [@ccaiomatos](https://github.com/ccaiomatos)

Projeto desenvolvido para a disciplina de Processamento de Linguagem
Natural — UESB.