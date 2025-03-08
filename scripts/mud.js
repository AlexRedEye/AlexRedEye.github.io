const outputDiv = document.getElementById("game-output");
const commandInput = document.getElementById("command-input");

let username = localStorage.getItem('username') || "Guest"; // Load username from localStorage or use default

const socket = new WebSocket('wss://mud.pocketfriends.org:5000'); // Connect to WebSocket server

let typingTimeout; // To handle user stop typing after a delay

// Notify server when the user is typing
commandInput.addEventListener("input", function() {
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }
    socket.send(JSON.stringify({ type: 'typing', username: username }));

    typingTimeout = setTimeout(function() {
        socket.send(JSON.stringify({ type: 'stoppedTyping', username: username }));
    }, 1000); // User is considered to have stopped typing after 1 second
});

socket.onopen = function () {
    console.log('Connected to the server');
};

socket.onmessage = function (event) {
    const message = JSON.parse(event.data);
    if (message.type === 'typing') {
        showTyping(message.username);
    } else if (message.type === 'stoppedTyping') {
        stopTyping(message.username);
    } else {
        appendOutput(`<span class="game-line"><strong>${message.username}:</strong> ${message.message}</span>`);
    }
};

commandInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendCommand();
    }
});

function sendCommand() {
    const command = commandInput.value.trim();
    if (command) {
        if (command.startsWith("/")) {
            handleCommand(command);
        } else {
            // Handle regular messages
            socket.send(JSON.stringify({ type: 'message', username: username, message: command }));
            appendOutput(`<span class="game-line"><strong>You:</strong> ${command}</span>`);
        }
    }
    commandInput.value = ""; // Clear input field
}

function handleCommand(command) {
    const [cmd, ...args] = command.split(" ");
    switch (cmd) {
        case "/username":
            changeUsername(args);
            break;
        case "/help":
            showHelp();
            break;
        case "/whisper":
            sendWhisper(args);
            break;
        default:
            appendOutput(`<span class="game-line"><strong>System:</strong> Unknown command: ${cmd}. Type /help for a list of commands.</span>`);
            break;
    }
}

function changeUsername(args) {
    const newUsername = args.join(" ").trim();
    if (newUsername) {
        username = newUsername;
        localStorage.setItem('username', username); // Save the username to localStorage
        appendOutput(`<span class="game-line"><strong>System:</strong> Your username has been set to: ${username}</span>`);
        socket.send(JSON.stringify({ type: 'username', username: username }));
    } else {
        appendOutput(`<span class="game-line"><strong>System:</strong> Please provide a username after /username.</span>`);
    }
}

function showHelp() {
    appendOutput(`<span class="game-line"><strong>System:</strong> Available commands:
        <ul>
            <li>/username <name> - Set your username</li>
            <li>/help - Show this help message</li>
            <li>/whisper <user> <message> - Send a private message to another user</li>
        </ul>
    </span>`);
}

function sendWhisper(args) {
    const [targetUser, ...messageParts] = args;
    const message = messageParts.join(" ").trim();
    if (targetUser && message) {
        socket.send(JSON.stringify({ type: 'whisper', from: username, to: targetUser, message: message }));
        appendOutput(`<span class="game-line"><strong>You whispered to ${targetUser}:</strong> ${message}</span>`);
    } else {
        appendOutput(`<span class="game-line"><strong>System:</strong> Please provide a username and message for whisper.</span>`);
    }
}

function appendOutput(text) {
    outputDiv.innerHTML += text + "<br>";
    outputDiv.scrollTop = outputDiv.scrollHeight; // Auto-scroll to the bottom
}

// Show typing indicator for a user
function showTyping(username) {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.innerHTML = `${username} is typing...`;
}

// Stop typing indicator for a user
function stopTyping(username) {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.innerHTML = '';
}
