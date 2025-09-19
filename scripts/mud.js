const outputDiv = document.getElementById("game-output");
const commandInput = document.getElementById("command-input");

let username = localStorage.getItem('username') || "Guest"; // Load username from localStorage or use default

// Add connection status indicator
function updateConnectionStatus(status, message) {
    const statusDiv = document.getElementById('connection-status') || createStatusDiv();
    statusDiv.innerHTML = `<strong>Connection:</strong> ${status} - ${message}`;
    statusDiv.className = `connection-status ${status.toLowerCase()}`;
}

function createStatusDiv() {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'connection-status';
    statusDiv.className = 'connection-status';
    document.getElementById('mud-container').insertBefore(statusDiv, outputDiv);
    return statusDiv;
}

// Try to connect to WebSocket server with better error handling
let socket;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// Try local server first, then fallback to remote
const servers = [
    'ws://localhost:3000',
    'wss://mud.pocketfriends.org:5000'
];
let currentServerIndex = 0;

function connectToServer() {
    try {
        const serverUrl = servers[currentServerIndex];
        updateConnectionStatus('Connecting', `Attempting to connect to ${serverUrl}...`);
        socket = new WebSocket(serverUrl);
        
        socket.onopen = function () {
            console.log('Connected to the server');
            updateConnectionStatus('Connected', 'Successfully connected to MUD server');
            reconnectAttempts = 0;
            socket.send(JSON.stringify({ type: 'username', username: username }));
            appendOutput(`<span class="game-line"><strong>System:</strong> Connected to MUD server!</span>`);
        };

        socket.onclose = function(event) {
            console.log('Disconnected from server', event);
            updateConnectionStatus('Disconnected', `Connection closed (Code: ${event.code})`);
            appendOutput(`<span class="game-line"><strong>System:</strong> Disconnected from server. Reason: ${event.reason || 'Unknown'}</span>`);
            
            // Try next server or reconnect
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                
                // Try next server if available
                if (currentServerIndex < servers.length - 1) {
                    currentServerIndex++;
                    appendOutput(`<span class="game-line"><strong>System:</strong> Trying next server...</span>`);
                } else {
                    currentServerIndex = 0; // Reset to first server
                }
                
                updateConnectionStatus('Reconnecting', `Attempt ${reconnectAttempts}/${maxReconnectAttempts} in 3 seconds...`);
                setTimeout(connectToServer, 3000);
            } else {
                updateConnectionStatus('Failed', 'Max reconnection attempts reached');
                appendOutput(`<span class="game-line"><strong>System:</strong> Failed to reconnect after ${maxReconnectAttempts} attempts.</span>`);
            }
        };

        socket.onerror = function(error) {
            console.error('WebSocket error:', error);
            updateConnectionStatus('Error', 'Connection error occurred');
            appendOutput(`<span class="game-line"><strong>System:</strong> Connection error. Check console for details.</span>`);
        };

        socket.onmessage = function (event) {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'typing') {
                    showTyping(message.username);
                } else if (message.type === 'stoppedTyping') {
                    stopTyping(message.username);
                } else {
                    appendOutput(`<span class="game-line"><strong>${message.username}:</strong> ${message.message}</span>`);
                }
            } catch (e) {
                console.error('Error parsing message:', e);
                appendOutput(`<span class="game-line"><strong>System:</strong> Error parsing server message.</span>`);
            }
        };

    } catch (error) {
        console.error('Error creating WebSocket:', error);
        updateConnectionStatus('Error', 'Failed to create connection');
        appendOutput(`<span class="game-line"><strong>System:</strong> Failed to create WebSocket connection.</span>`);
    }
}

// Start connection
connectToServer();

let typingTimeout; // To handle user stop typing after a delay

// Notify server when the user is typing
commandInput.addEventListener("input", function() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }
        socket.send(JSON.stringify({ type: 'typing', username: username }));

        typingTimeout = setTimeout(function() {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'stoppedTyping', username: username }));
            }
        }, 1000); // User is considered to have stopped typing after 1 second
    }
});

socket.onopen = function () {
    console.log('Connected to the server');
    socket.send(JSON.stringify({ type: 'username', username: username }));
};

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
            // Check if socket is connected before sending
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'message', username: username, message: command }));
                appendOutput(`<span class="game-line"><strong>You:</strong> ${command}</span>`);
            } else {
                appendOutput(`<span class="game-line"><strong>System:</strong> Not connected to server. Cannot send message.</span>`);
            }
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
        case "/reconnect":
            appendOutput(`<span class="game-line"><strong>System:</strong> Attempting to reconnect...</span>`);
            reconnectAttempts = 0;
            connectToServer();
            break;
        case "/status":
            const status = socket ? 
                (socket.readyState === WebSocket.OPEN ? 'Connected' : 
                 socket.readyState === WebSocket.CONNECTING ? 'Connecting' : 
                 socket.readyState === WebSocket.CLOSING ? 'Closing' : 'Disconnected') 
                : 'No connection';
            appendOutput(`<span class="game-line"><strong>System:</strong> Connection status: ${status}</span>`);
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
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'username', username: username }));
        }
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
            <li>/reconnect - Attempt to reconnect to server</li>
            <li>/status - Show connection status</li>
        </ul>
    </span>`);
}

function sendWhisper(args) {
    const [targetUser, ...messageParts] = args;
    const message = messageParts.join(" ").trim();
    if (targetUser && message) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'whisper', from: username, to: targetUser, message: message }));
            appendOutput(`<span class="game-line"><strong>You whispered to ${targetUser}:</strong> ${message}</span>`);
        } else {
            appendOutput(`<span class="game-line"><strong>System:</strong> Not connected to server. Cannot send whisper.</span>`);
        }
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
