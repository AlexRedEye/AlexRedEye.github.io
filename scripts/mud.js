const outputDiv = document.getElementById("game-output");
const commandInput = document.getElementById("command-input");
const sendBtn = document.getElementById("send-btn");

// Version information
const CLIENT_VERSION = "0.4.1-beta";
const VERSION_DATE = "2025-09-19";
let serverVersion = null;

console.log(`MUD Client v${CLIENT_VERSION} (${VERSION_DATE}) initialized`);

let username = localStorage.getItem('username') || "Guest";
let currentRoom = 'general'; // Default room
let userList = new Map(); // Track users and their status

// Add connection status indicator
function updateConnectionStatus(status, message) {
    const statusDiv = document.getElementById('connection-status');
    if (statusDiv) {
        statusDiv.innerHTML = `<strong>Connection:</strong> ${status} - ${message}`;
        statusDiv.className = `connection-status ${status.toLowerCase()}`;
    }
}

// Try to connect to WebSocket server with better error handling
let socket;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// Smart server selection based on how the page was accessed
function getServerList() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const port = '5000';
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Local development - try localhost first, then fallback
        return [
            `ws://localhost:${port}`,
            `wss://mud.pocketfriends.org:${port}`
        ];
    } else {
        // Accessed via IP address or domain - use the same host
        return [
            `${protocol}//${hostname}:${port}`,
            `wss://mud.pocketfriends.org:${port}`
        ];
    }
}

const servers = getServerList();
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
            socket.send(JSON.stringify({ type: 'joinRoom', room: currentRoom, username: username }));
            appendOutput(`<span class="game-line"><strong>System:</strong> Connected to MUD server!</span>`);
            appendOutput(`<span class="game-line room-message"><strong>System:</strong> Joined room: ${currentRoom}</span>`);
        };

        socket.onclose = function(event) {
            console.log('Disconnected from server', event);
            updateConnectionStatus('Disconnected', `Connection closed (Code: ${event.code})`);
            appendOutput(`<span class="game-line"><strong>System:</strong> Disconnected from server. Reason: ${event.reason || 'Connection lost'}</span>`);
            
            // Try next server or reconnect
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                
                // Try next server if available
                if (currentServerIndex < servers.length - 1) {
                    currentServerIndex++;
                    appendOutput(`<span class="game-line"><strong>System:</strong> Trying server ${currentServerIndex + 1}/${servers.length}: ${servers[currentServerIndex]}</span>`);
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
            console.error('Current server:', servers[currentServerIndex]);
            console.error('Available servers:', servers);
            updateConnectionStatus('Error', 'Connection error occurred');
            
            // Provide mobile-specific error guidance
            if (/Mobi|Android/i.test(navigator.userAgent)) {
                appendOutput(`<span class="game-line error"><strong>Mobile Connection Error:</strong> Cannot reach server ${servers[currentServerIndex]}</span>`);
                appendOutput(`<span class="game-line"><strong>Troubleshooting:</strong> Make sure you're on the same WiFi network and try the /servers command to see available servers.</span>`);
            } else {
                appendOutput(`<span class="game-line error"><strong>System:</strong> Connection error to ${servers[currentServerIndex]}. Check console for details.</span>`);
            }
        };

        socket.onmessage = function (event) {
            try {
                // First check if event.data exists and is valid
                if (!event.data) {
                    console.warn('Received empty message from server');
                    return;
                }
                
                const message = JSON.parse(event.data);
                const timestamp = new Date().toLocaleTimeString();
                
                // Validate message structure
                if (!message || typeof message !== 'object') {
                    console.warn('Received invalid message structure:', message);
                    return;
                }
                
                if (message.type === 'typing') {
                    showTyping(message.username);
                    updateUserStatus(message.username, 'typing');
                } else if (message.type === 'stoppedTyping') {
                    stopTyping(message.username);
                    updateUserStatus(message.username, 'online');
                } else if (message.type === 'emote') {
                    if (message.room === currentRoom) {
                        appendOutput(`<span class="game-line emote"><span class="timestamp">[${timestamp}]</span> <em>* ${message.username} ${message.action}</em></span>`);
                    }
                } else if (message.type === 'whisper') {
                    appendOutput(`<span class="game-line whisper"><span class="timestamp">[${timestamp}]</span> <strong>${message.from} whispered:</strong> ${message.message}</span>`);
                    playNotificationSound();
                } else if (message.type === 'userList') {
                    if (message.users && Array.isArray(message.users)) {
                        updateUserList(message.users);
                    } else {
                        console.warn('Received userList message without valid users array:', message);
                    }
                } else if (message.type === 'userJoined') {
                    if (message.username) {
                        addUser(message.username);
                        appendOutput(`<span class="game-line user-join"><strong>System:</strong> ${message.username} joined the room</span>`);
                    }
                } else if (message.type === 'userLeft') {
                    if (message.username) {
                        removeUser(message.username);
                        appendOutput(`<span class="game-line user-leave"><strong>System:</strong> ${message.username} left the room</span>`);
                    }
                } else if (message.type === 'roomChanged') {
                    if (message.username && message.oldRoom && message.newRoom) {
                        // Handle room change notifications
                        if (message.oldRoom === currentRoom && message.newRoom !== currentRoom) {
                            appendOutput(`<span class="game-line system"><strong>System:</strong> ${message.username} moved to ${message.newRoom}</span>`);
                        } else if (message.newRoom === currentRoom && message.oldRoom !== currentRoom) {
                            appendOutput(`<span class="game-line system"><strong>System:</strong> ${message.username} joined from ${message.oldRoom}</span>`);
                        }
                        // Only update user list if users array is provided
                        if (message.users && Array.isArray(message.users)) {
                            updateUserList(message.users);
                        }
                    }
                } else if (message.type === 'roomUsers') {
                    updateRoomCount(message.room, message.count);
                } else if (message.type === 'message') {
                    if (message.room === currentRoom) {
                        appendOutput(`<span class="game-line"><span class="timestamp">[${timestamp}]</span> <strong>${message.username}:</strong> ${message.message}</span>`);
                        playMessageSound();
                    }
                } else if (message.type === 'error') {
                    appendOutput(`<span class="game-line error"><strong>Error:</strong> ${message.message}</span>`);
                } else if (message.type === 'version') {
                    // Handle version information from server
                    serverVersion = message.serverVersion;
                    appendOutput(`<span class="game-line system"><strong>Server Version:</strong> v${message.serverVersion} (${message.versionDate})</span>`);
                    if (message.changelog && message.changelog.length > 0) {
                        appendOutput(`<span class="game-line system"><strong>Server Features:</strong></span>`);
                        message.changelog.forEach(feature => {
                            appendOutput(`<span class="game-line system">  • ${feature}</span>`);
                        });
                    }
                } else {
                    // Handle unknown message types with safety checks
                    if (message.username && message.message) {
                        appendOutput(`<span class="game-line"><span class="timestamp">[${timestamp}]</span> <strong>${message.username}:</strong> ${message.message}</span>`);
                    } else {
                        console.log('Unknown message type or incomplete data:', message);
                    }
                }
            } catch (e) {
                console.error('Error parsing message:', e);
                console.error('Raw message data:', event.data);
                console.error('Message length:', event.data ? event.data.length : 'undefined');
                appendOutput(`<span class="game-line error"><strong>System:</strong> Error parsing server message: ${e.message}</span>`);
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

// User list management
function updateUserList(users) {
    if (!users || !Array.isArray(users)) {
        console.warn('updateUserList called with invalid data:', users);
        return;
    }
    
    userList.clear();
    users.forEach(user => {
        if (user && user.username) {
            userList.set(user.username, { status: user.status || 'online', room: user.room || 'general' });
        }
    });
    renderUserList();
}

function addUser(username) {
    if (username && username.trim()) {
        userList.set(username, { status: 'online', room: currentRoom });
        renderUserList();
    }
}

function removeUser(username) {
    if (username && username.trim()) {
        userList.delete(username);
        renderUserList();
    }
}

function updateUserStatus(username, status) {
    if (username && username.trim() && userList.has(username)) {
        userList.get(username).status = status;
        renderUserList();
    }
}

function renderUserList() {
    const usersContainer = document.getElementById('users-list');
    const userCount = document.getElementById('user-count');
    
    const roomUsers = Array.from(userList.entries()).filter(([name, data]) => data.room === currentRoom);
    userCount.textContent = roomUsers.length;
    
    usersContainer.innerHTML = '';
    roomUsers.forEach(([name, data]) => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.innerHTML = `
            <span class="user-name">${name}</span>
            <span class="user-status ${data.status}"></span>
        `;
        usersContainer.appendChild(userDiv);
    });
}

// Room management
function updateRoomCount(roomName, count) {
    const roomItem = document.querySelector(`[data-room="${roomName}"] .room-count`);
    if (roomItem) {
        roomItem.textContent = count;
    }
}

function switchRoom(roomName) {
    if (roomName === currentRoom) return;
    
    // Leave current room
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'leaveRoom', room: currentRoom, username: username }));
        socket.send(JSON.stringify({ type: 'joinRoom', room: roomName, username: username }));
    }
    
    // Update UI
    document.querySelector('.room-item.active').classList.remove('active');
    document.querySelector(`[data-room="${roomName}"]`).classList.add('active');
    
    currentRoom = roomName;
    outputDiv.innerHTML = ''; // Clear chat
    appendOutput(`<span class="game-line room-message"><strong>System:</strong> Switched to room: ${roomName}</span>`);
    
    renderUserList();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Room switching
    document.querySelectorAll('.room-item').forEach(item => {
        item.addEventListener('click', () => {
            const roomName = item.dataset.room;
            switchRoom(roomName);
        });
    });
    
    // Send button
    if (sendBtn) {
        sendBtn.addEventListener('click', sendCommand);
    }
});

// Set up input event listeners
commandInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendCommand();
    }
});

let typingTimeout; // To handle user stop typing after a delay

// Notify server when the user is typing
commandInput.addEventListener("input", function() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }
        socket.send(JSON.stringify({ 
            type: 'typing', 
            username: username, 
            room: currentRoom 
        }));

        typingTimeout = setTimeout(function() {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ 
                    type: 'stoppedTyping', 
                    username: username, 
                    room: currentRoom 
                }));
            }
        }, 1000); // User is considered to have stopped typing after 1 second
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
                socket.send(JSON.stringify({ 
                    type: 'message', 
                    username: username, 
                    message: command,
                    room: currentRoom 
                }));
                const timestamp = new Date().toLocaleTimeString();
                appendOutput(`<span class="game-line"><span class="timestamp">[${timestamp}]</span> <strong>You:</strong> ${command}</span>`);
                playMessageSound();
            } else {
                appendOutput(`<span class="game-line error"><strong>System:</strong> Not connected to server. Cannot send message.</span>`);
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
        case "/w":
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
            appendOutput(`<span class="game-line"><strong>System:</strong> Current room: ${currentRoom}</span>`);
            break;
        case "/room":
            if (args.length > 0) {
                const roomName = args[0].toLowerCase();
                const validRooms = ['general', 'games', 'random', 'tech'];
                if (validRooms.includes(roomName)) {
                    switchRoom(roomName);
                } else {
                    appendOutput(`<span class="game-line"><strong>System:</strong> Invalid room. Available rooms: ${validRooms.join(', ')}</span>`);
                }
            } else {
                appendOutput(`<span class="game-line"><strong>System:</strong> Please specify a room name.</span>`);
            }
            break;
        case "/users":
            const roomUsers = Array.from(userList.entries()).filter(([name, data]) => data.room === currentRoom);
            appendOutput(`<span class="game-line"><strong>System:</strong> Users in ${currentRoom}: ${roomUsers.map(([name]) => name).join(', ')}</span>`);
            break;
        case "/me":
            sendEmote(args.join(" "));
            break;
        case "/dance":
            sendEmote("dances energetically! 💃🕺");
            break;
        case "/wave":
            sendEmote("waves hello! 👋");
            break;
        case "/laugh":
            sendEmote("laughs out loud! 😂");
            break;
        case "/shrug":
            sendEmote("shrugs 🤷");
            break;
        case "/clap":
            sendEmote("claps enthusiastically! 👏");
            break;
        case "/think":
            sendEmote("thinks deeply... 🤔");
            break;
        case "/hug":
            if (args.length > 0) {
                sendEmote(`gives ${args[0]} a warm hug! 🤗`);
            } else {
                sendEmote("gives everyone a group hug! 🤗");
            }
            break;
        case "/clear":
            outputDiv.innerHTML = '';
            appendOutput(`<span class="game-line"><strong>System:</strong> Chat cleared</span>`);
            break;
        case "/version":
            appendOutput(`<span class="game-line system"><strong>Client Version:</strong> v${CLIENT_VERSION} (${VERSION_DATE})</span>`);
            if (serverVersion) {
                appendOutput(`<span class="game-line system"><strong>Server Version:</strong> v${serverVersion}</span>`);
            } else {
                appendOutput(`<span class="game-line system"><strong>Server Version:</strong> Requesting...</span>`);
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'version' }));
                }
            }
            break;
        case "/servers":
            appendOutput(`<span class="game-line system"><strong>Available Servers:</strong></span>`);
            servers.forEach((server, index) => {
                const status = index === currentServerIndex ? ' (current)' : '';
                appendOutput(`<span class="game-line system">  ${index + 1}. ${server}${status}</span>`);
            });
            break;
        case "/diagnostics":
            appendOutput(`<span class="game-line system"><strong>Connection Diagnostics:</strong></span>`);
            appendOutput(`<span class="game-line system">Current URL: ${window.location.href}</span>`);
            appendOutput(`<span class="game-line system">Host: ${window.location.hostname}</span>`);
            appendOutput(`<span class="game-line system">Protocol: ${window.location.protocol}</span>`);
            appendOutput(`<span class="game-line system">User Agent: ${navigator.userAgent}</span>`);
            appendOutput(`<span class="game-line system">Current Server: ${servers[currentServerIndex]} (${currentServerIndex + 1}/${servers.length})</span>`);
            appendOutput(`<span class="game-line system">Connection State: ${socket ? socket.readyState : 'No socket'}</span>`);
            appendOutput(`<span class="game-line system">Reconnect Attempts: ${reconnectAttempts}/${maxReconnectAttempts}</span>`);
            
            // Mobile-specific info
            if (/Mobi|Android/i.test(navigator.userAgent)) {
                appendOutput(`<span class="game-line system"><strong>Mobile Device Detected:</strong></span>`);
                appendOutput(`<span class="game-line system">To connect from mobile, access via your computer's IP address</span>`);
                appendOutput(`<span class="game-line system">Find your computer's IP in network settings, then use: https://YOUR_IP:5000/mud.html</span>`);
            }
            break;
        default:
            appendOutput(`<span class="game-line"><strong>System:</strong> Unknown command: ${cmd}. Type /help for a list of commands.</span>`);
            break;
    }
}

function sendEmote(action) {
    if (!action.trim()) {
        appendOutput(`<span class="game-line"><strong>System:</strong> Please provide an action for the emote.</span>`);
        return;
    }
    
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
            type: 'emote', 
            username: username, 
            action: action,
            room: currentRoom 
        }));
        const timestamp = new Date().toLocaleTimeString();
        appendOutput(`<span class="game-line emote"><span class="timestamp">[${timestamp}]</span> <em>* You ${action}</em></span>`);
    } else {
        appendOutput(`<span class="game-line"><strong>System:</strong> Not connected to server. Cannot send emote.</span>`);
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
        <div class="help-commands">
            <div><strong>Basic Commands:</strong></div>
            <div>/username &lt;name&gt; - Set your username</div>
            <div>/help - Show this help message</div>
            <div>/status - Show connection status</div>
            <div>/version - Show client and server version information</div>
            <div>/servers - List available servers</div>
            <div>/diagnostics - Show connection diagnostics (useful for mobile troubleshooting)</div>
            <div>/clear - Clear chat history</div>
            <div>/reconnect - Attempt to reconnect to server</div>
            
            <div><strong>Chat Commands:</strong></div>
            <div>/whisper &lt;user&gt; &lt;message&gt; - Send a private message</div>
            <div>/w &lt;user&gt; &lt;message&gt; - Send a private message (short)</div>
            <div>/room &lt;name&gt; - Switch to a different room</div>
            <div>/users - List users in current room</div>
            
            <div><strong>Emote Commands:</strong></div>
            <div>/me &lt;action&gt; - Perform a custom action</div>
            <div>/dance - Dance enthusiastically</div>
            <div>/wave - Wave hello</div>
            <div>/laugh - Laugh out loud</div>
            <div>/shrug - Shrug</div>
            <div>/clap - Clap enthusiastically</div>
            <div>/think - Think deeply</div>
            <div>/hug [user] - Give someone a hug</div>
        </div>
    </span>`);
}

function sendWhisper(args) {
    const [targetUser, ...messageParts] = args;
    const message = messageParts.join(" ").trim();
    if (targetUser && message) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ 
                type: 'whisper', 
                from: username, 
                to: targetUser, 
                message: message,
                room: currentRoom 
            }));
            const timestamp = new Date().toLocaleTimeString();
            appendOutput(`<span class="game-line whisper"><span class="timestamp">[${timestamp}]</span> <strong>You whispered to ${targetUser}:</strong> ${message}</span>`);
        } else {
            appendOutput(`<span class="game-line error"><strong>System:</strong> Not connected to server. Cannot send whisper.</span>`);
        }
    } else {
        appendOutput(`<span class="game-line error"><strong>System:</strong> Please provide a username and message for whisper.</span>`);
    }
}


function appendOutput(text) {
    outputDiv.innerHTML += text + "<br>";
    outputDiv.scrollTop = outputDiv.scrollHeight; // Auto-scroll to the bottom
}

// Show typing indicator for a user
function showTyping(username) {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.innerHTML = `${username} is typing...`;
    }
}

// Stop typing indicator for a user
function stopTyping(username) {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.innerHTML = '';
    }
}

// Sound notification functions
function playMessageSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('Message sound failed:', error);
    }
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        console.log('Notification sound failed:', error);
    }
}

// Mobile keyboard handling for better UX
(function() {
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        const mudLayout = document.querySelector('.mud-layout');
        const commandInput = document.getElementById('command-input');
        
        if (commandInput && mudLayout) {
            // Handle virtual keyboard on mobile
            commandInput.addEventListener('focus', function() {
                mudLayout.classList.add('keyboard-open');
                // Scroll input into view on mobile
                setTimeout(() => {
                    this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
            
            commandInput.addEventListener('blur', function() {
                mudLayout.classList.remove('keyboard-open');
            });
            
            // Prevent zoom on iOS when focusing input
            if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                const viewport = document.querySelector('meta[name=viewport]');
                if (viewport) {
                    commandInput.addEventListener('focus', function() {
                        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                    });
                    
                    commandInput.addEventListener('blur', function() {
                        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
                    });
                }
            }
        }
        
        // Add touch-friendly scrolling for output
        const gameOutput = document.getElementById('game-output');
        if (gameOutput) {
            gameOutput.style.webkitOverflowScrolling = 'touch';
        }
        
        // Improve touch responsiveness
        document.body.style.touchAction = 'manipulation';
    }
})();
