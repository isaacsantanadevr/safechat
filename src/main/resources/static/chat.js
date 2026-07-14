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
        return;
    }

    connectionError.textContent = "";

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

    messageInput.focus();
}


function erroNaConexao() {
    connectionError.textContent =
        "Não foi possível conectar ao servidor.";
}


function enviarMensagem(event) {
    event.preventDefault();

    const content = messageInput.value.trim();

    if (!content || !stompClient) {
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
    const message = JSON.parse(payload.body);

    const item = document.createElement("li");

    if (message.type === "JOIN") {
        item.classList.add("system-message");
        item.textContent = message.content;
    } else {
        item.classList.add("message");

        const sender = document.createElement("strong");
        sender.textContent = message.sender;

        const content = document.createElement("span");
        content.textContent = message.content;

        item.appendChild(sender);
        item.appendChild(content);
    }

    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
}


enterButton.addEventListener("click", conectar);

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