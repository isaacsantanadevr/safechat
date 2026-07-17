let stompClient = null;
let username = null;

const loginScreen = document.getElementById("login-screen");
const chatScreen = document.getElementById("chat-screen");

const usernameInput = document.getElementById("username");
const messageInput = document.getElementById("message-input");

const enterButton = document.getElementById("enter-button");
const messageForm = document.getElementById("message-form");

const messages = document.getElementById("messages");
const currentUser = document.getElementById("current-user");
const connectionError = document.getElementById("connection-error");


function conectar() {
    username = usernameInput.value.trim();

    if (!username) {
        connectionError.textContent = "Digite um nome.";
        usernameInput.focus();
        return;
    }

    connectionError.textContent = "";
    enterButton.disabled = true;
    enterButton.textContent = "Conectando...";

    const socket = new SockJS("/ws");

    stompClient = Stomp.over(socket);
    stompClient.debug = null;

    stompClient.connect(
        {},
        conectadoComSucesso,
        erroNaConexao
    );
}


function conectadoComSucesso() {
    stompClient.subscribe(
        "/topic/public",
        receberMensagem
    );

    stompClient.send(
        "/app/chat.send",
        {},
        JSON.stringify({
            sender: username,
            content: `${username} entrou no chat.`,
            type: "JOIN"
        })
    );

    currentUser.textContent = username;

    loginScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");

    enterButton.disabled = false;
    enterButton.textContent = "Entrar no chat";

    messageInput.focus();
}


function erroNaConexao(error) {
    console.error("Erro na conexão WebSocket:", error);

    connectionError.textContent =
        "Não foi possível conectar ao servidor.";

    enterButton.disabled = false;
    enterButton.textContent = "Entrar no chat";
}


function enviarMensagem(event) {
    event.preventDefault();

    const content = messageInput.value.trim();

    if (!content) {
        return;
    }

    if (!stompClient || !stompClient.connected) {
        alert("Você não está conectado ao servidor.");
        return;
    }

    stompClient.send(
        "/app/chat.send",
        {},
        JSON.stringify({
            sender: username,
            content: content,
            type: "CHAT"
        })
    );

    messageInput.value = "";
    messageInput.focus();
}


function receberMensagem(payload) {
    let message;

    try {
        message = JSON.parse(payload.body);
    } catch (error) {
        console.error("Mensagem inválida recebida:", error);
        return;
    }

    const item = document.createElement("li");

    if (message.type === "JOIN") {
        item.classList.add("system-message");
        item.textContent = message.content;
    } else {
        item.classList.add("message");
        item.classList.add(
            message.sender === username ? "message--mine" : "message--theirs"
        );

        const sender = document.createElement("strong");
        sender.textContent = message.sender;

        const content = document.createElement("span");
        content.textContent = message.content;

        item.appendChild(sender);
        item.appendChild(content);

        if (message.moderated) {
            const moderationNotice = document.createElement("small");

            moderationNotice.classList.add("moderation-notice");
            moderationNotice.textContent =
                "Mensagem moderada automaticamente";

            item.appendChild(moderationNotice);
        }

        if (message.moderationUnavailable) {
            const unavailableNotice = document.createElement("small");

            unavailableNotice.classList.add(
                "moderation-unavailable"
            );

            unavailableNotice.textContent =
                "Serviço de moderação indisponível";

            item.appendChild(unavailableNotice);
        }
    }

    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
}


enterButton.addEventListener(
    "click",
    conectar
);

messageForm.addEventListener(
    "submit",
    enviarMensagem
);

usernameInput.addEventListener(
    "keydown",
    function (event) {
        if (event.key === "Enter") {
            conectar();
        }
    }
);