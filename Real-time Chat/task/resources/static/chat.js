let stompClient = null;

const msgInput = document.getElementById('input-msg')
const messages = document.getElementById('messages');
const publicChatBtn = document.getElementById('public-chat-btn');
const chatWith = document.getElementById('chat-with');
let privateChatBtn = undefined

const currentUsername = sessionStorage.getItem('username');

function switchToPrivateChat(username) {
    if (privateChatBtn) {
        privateChatBtn.classList.remove('selected-chat');
    }
    publicChatBtn.classList.remove('selected-chat');
    const userElement = document.getElementById(username);
    const counterElement = userElement.nextElementSibling;
    counterElement.hidden = true;
    counterElement.innerText = '';
    privateChatBtn = userElement.parentElement;
    privateChatBtn.classList.add('selected-chat');
    chatWith.textContent = username;
    messages.innerHTML = '';
    fetch(`/chat/history/${username}`, {
        method: 'GET'
    })
        .then(response => response.json())
        .then(handleHistoryReceived);
}

function switchToPublicChat() {
    if (!privateChatBtn) {
        return
    }
    chatWith.textContent = "Public chat"
    privateChatBtn.classList.remove('selected-chat');
    publicChatBtn.classList.add('selected-chat');
    messages.innerHTML = '';
    fetch('/chat/history', {
        method: 'GET'
    })
        .then(response => response.json())
        .then(handleHistoryReceived);
    privateChatBtn = undefined;
}

function connectWebSocket() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, onWebSocketConnected, onWebSocketError);
}

function onWebSocketConnected() {
    stompClient.subscribe('/topic/public', handleMessageReceived);
    stompClient.subscribe(`/user/${currentUsername}/private`, handleMessageReceived)
    if (currentUsername) {
        stompClient.send("/app/chat.addUser", {}, JSON.stringify({sender: currentUsername, type: 'JOIN'}));
        fetch('/chat/history', {
            method: 'GET'
        })
            .then(response => response.json())
            .then(handleHistoryReceived);
        fetch('/user/getOnlineUsers', {
            method: 'GET'
        })
            .then(response => response.json())
            .then(handleOnlineUsersReceived)
    }
}

function handleOnlineUsersReceived(payload) {
    payload.forEach(user => {
        addUser(user.username);
    })
}

function addUser(user) {
    const userContainerElement = document.createElement('div');
    userContainerElement.classList.add('user-container');
    userContainerElement.onclick = () => switchToPrivateChat(user);

    const userElement = document.createElement('div');
    userElement.classList.add('user');
    userElement.id = user;
    userElement.innerText = user;

    const messageCounterElement = document.createElement('div');
    messageCounterElement.classList.add('new-message-counter');
    messageCounterElement.hidden = true;

    userContainerElement.appendChild(userElement);
    userContainerElement.appendChild(messageCounterElement);
    document.getElementsByClassName('public-chat-container')[0].before(userContainerElement);
}

function removeUser(user) {
    const userElement = document.getElementById(user);
    userElement.remove();
}

function handleHistoryReceived(payload) {
    payload.forEach(message => {
        addMessage(message);
    });
}

function sendMessage() {
    const messageContent = msgInput.value.trim();
    if (chatWith.textContent === "Public chat") {
        if (messageContent && stompClient && currentUsername) {
            const chatMessage = {
                sender: currentUsername,
                content: messageContent,
                type: 'CHAT'
            };
            stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
            msgInput.value = '';
        }
    } else {
        if (messageContent && stompClient && currentUsername) {
            const chatMessage = {
                sender: currentUsername,
                receiver: chatWith.textContent,
                content: messageContent,
                type: 'PRIVATE_CHAT'
            };
            stompClient.send("/app/chat.sendPrivateMessage", {}, JSON.stringify(chatMessage));
            msgInput.value = '';
        }
    }
}

function handleMessageReceived(payload) {
    const message = JSON.parse(payload.body);
    if (message.type === 'JOIN' && currentUsername !== message.sender) {
        addUser(message.sender)
    } else if (message.type === 'LEAVE') {
        removeUser(message.sender)
    } else if (message.type === 'CHAT' && chatWith.textContent === "Public chat") {
        addMessage(message);
    } else if (message.type === 'PRIVATE_CHAT') {
        if (chatWith.textContent === message.sender || message.sender === currentUsername) {
            addMessage(message);
        } else {
            addCounter(message.sender);
        }
    }
}

function addCounter(username) {
    const messageCounterElement = document.getElementById(username).nextElementSibling;
    messageCounterElement.hidden = false;
    if (messageCounterElement.innerText === '') {
        messageCounterElement.innerText = 1;
    } else {
        messageCounterElement.innerText = parseInt(messageCounterElement.innerText) + 1;
    }
}

function addMessage(message) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container');
    const messageElement = document.createElement('div');

    messageElement.classList.add('message');

    const headerElement = document.createElement('div');
    headerElement.classList.add('message-header');

    const senderElement = document.createElement('div');
    senderElement.classList.add('sender');
    senderElement.innerText = message.sender;

    const dateElement = document.createElement('div');
    dateElement.classList.add('date');
    dateElement.innerText = getCurrentDate();

    const content = document.createElement('div');
    content.innerText = message.content;

    headerElement.appendChild(senderElement);
    headerElement.appendChild(dateElement);
    messageElement.appendChild(content);
    messageContainer.appendChild(headerElement);

    messageContainer.appendChild(messageElement);
    messages.appendChild(messageContainer);
    messageContainer.scrollIntoView()
}

function getCurrentDate() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const month = now.getMonth()
    const day = now.getDate()
    return `${hours}:${minutes} | ${month}.${day}`;
}

function onWebSocketError(error) {
    console.error('WebSocket connection error:', error);
}

window.onload = connectWebSocket;