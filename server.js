const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');

// Version information
const SERVER_VERSION = "0.4.1-beta";
const VERSION_DATE = "2025-09-19";
const CHANGELOG = {
    "0.4.1-beta": [
        "Mobile optimization update",
        "Responsive CSS for mobile devices",
        "Touch-friendly interface with 44px minimum touch targets",
        "Mobile keyboard handling and viewport optimization",
        "Horizontal scrollable sidebar on mobile",
        "iOS Safari specific fixes and zoom prevention",
        "Hardware-accelerated scrolling for better performance",
        "Room system with 4 rooms (general, games, random, tech)",
        "User management with online status tracking",
        "Real-time messaging with timestamps",
        "Emote system with predefined actions",
        "Private whisper messaging",
        "Typing indicators",
        "Sound notifications",
        "Connection status monitoring",
        "Room user count tracking",
        "Graceful error handling and reconnection",
        "Interactive version command (/version)"
    ]
};

console.log(`=== MUD Server v${SERVER_VERSION} (${VERSION_DATE}) ===`);
console.log("Changelog for this version:");
CHANGELOG[SERVER_VERSION].forEach(change => console.log(`  • ${change}`));
console.log("=".repeat(50));

// Read SSL certificate and key
const serverOptions = {
    cert: fs.readFileSync('pfcert.cer'),
    key: fs.readFileSync('pfkey.key')
};

// Create an HTTPS server
const server = https.createServer(serverOptions);

// Create WebSocket server using the HTTPS server
const wss = new WebSocket.Server({ server });

// Room and user management
const rooms = new Map([
    ['general', new Set()],
    ['games', new Set()],
    ['random', new Set()],
    ['tech', new Set()]
]);

const users = new Map(); // username -> { ws, room, status }

// Helper functions
function broadcastToRoom(room, message, excludeUser = null) {
    if (rooms.has(room)) {
        rooms.get(room).forEach(username => {
            if (username !== excludeUser && users.has(username)) {
                const userWs = users.get(username).ws;
                if (userWs.readyState === WebSocket.OPEN) {
                    userWs.send(JSON.stringify(message));
                }
            }
        });
    }
}

function broadcastUserList() {
    const userList = Array.from(users.entries()).map(([username, data]) => ({
        username,
        room: data.room,
        status: data.status || 'online'
    }));
    
    // Send user list to all connected clients
    users.forEach((userData, username) => {
        if (userData.ws.readyState === WebSocket.OPEN) {
            userData.ws.send(JSON.stringify({
                type: 'userList',
                users: userList
            }));
        }
    });
}

function broadcastRoomCounts() {
    // Send room counts to all clients
    rooms.forEach((userSet, roomName) => {
        const count = userSet.size;
        users.forEach((userData, username) => {
            if (userData.ws.readyState === WebSocket.OPEN) {
                userData.ws.send(JSON.stringify({
                    type: 'roomUsers',
                    room: roomName,
                    count: count
                }));
            }
        });
    });
}

function removeUserFromAllRooms(username) {
    if (!username || username === "Guest") return; // Prevent undefined errors
    
    rooms.forEach((userSet, roomName) => {
        if (userSet.has(username)) {
            userSet.delete(username);
            broadcastToRoom(roomName, {
                type: 'userLeft',
                username: username,
                room: roomName
            });
        }
    });
    users.delete(username);
    broadcastUserList();
    broadcastRoomCounts(); // Update room counts after user leaves
}

wss.on('connection', function connection(ws) {
    let username = "Guest"; // Default username
    let currentRoom = 'general'; // Default room

    console.log('New client connected');

    // Set username for each client
    ws.on('message', function incoming(message) {
        try {
            let msg = JSON.parse(message); // Parse incoming JSON message

            switch (msg.type) {
                case 'username':
                    // Handle username changes
                    if (users.has(username) && username !== msg.username) {
                        removeUserFromAllRooms(username);
                    }
                    
                    username = msg.username;
                    console.log(`${username} has joined the game`);
                    
                    // Store user data
                    users.set(username, { ws, room: currentRoom, status: 'online' });
                    ws.username = username;
                    
                    // Add to default room
                    if (!rooms.get(currentRoom).has(username)) {
                        rooms.get(currentRoom).add(username);
                        broadcastToRoom(currentRoom, {
                            type: 'userJoined',
                            username: username,
                            room: currentRoom
                        }, username);
                    }
                    
                    // Send welcome message
                    ws.send(JSON.stringify({ 
                        type: 'message',
                        username: 'System', 
                        message: `Welcome, ${username}! You're in the ${currentRoom} room.`,
                        room: currentRoom
                    }));
                    
                    broadcastUserList();
                    broadcastRoomCounts(); // Send room counts to all clients
                    break;

                case 'joinRoom':
                    const newRoom = msg.room || 'general';
                    const oldRoom = msg.oldRoom || currentRoom;
                    
                    // Remove from old room
                    if (rooms.has(oldRoom) && rooms.get(oldRoom).has(username)) {
                        rooms.get(oldRoom).delete(username);
                        broadcastToRoom(oldRoom, {
                            type: 'userLeft',
                            username: username,
                            room: oldRoom
                        });
                    }
                    
                    // Add to new room
                    currentRoom = newRoom;
                    if (users.has(username)) {
                        users.get(username).room = currentRoom;
                    }
                    
                    if (rooms.has(currentRoom)) {
                        rooms.get(currentRoom).add(username);
                        broadcastToRoom(currentRoom, {
                            type: 'userJoined',
                            username: username,
                            room: currentRoom
                        }, username);
                    }
                    
                    // Notify about room change
                    if (oldRoom !== currentRoom) {
                        broadcastToRoom(oldRoom, {
                            type: 'roomChanged',
                            username: username,
                            oldRoom: oldRoom,
                            newRoom: currentRoom
                        });
                        broadcastToRoom(currentRoom, {
                            type: 'roomChanged',
                            username: username,
                            oldRoom: oldRoom,
                            newRoom: currentRoom
                        });
                    }
                    
                    broadcastUserList();
                    broadcastRoomCounts(); // Update room counts after room change
                    break;

                case 'leaveRoom':
                    // Handle explicit leave room requests
                    const roomToLeave = msg.room || currentRoom;
                    if (rooms.has(roomToLeave) && rooms.get(roomToLeave).has(username)) {
                        rooms.get(roomToLeave).delete(username);
                        broadcastToRoom(roomToLeave, {
                            type: 'userLeft',
                            username: username,
                            room: roomToLeave
                        });
                        broadcastRoomCounts();
                    }
                    break;

                case 'message':
                    // Broadcast regular messages to room
                    console.log(`[${msg.room || currentRoom}] ${username}: ${msg.message}`);
                    broadcastToRoom(msg.room || currentRoom, {
                        type: 'message',
                        username: username,
                        message: msg.message,
                        room: msg.room || currentRoom
                    }, username);
                    break;

                case 'emote':
                    // Broadcast emote actions to room
                    console.log(`[${msg.room || currentRoom}] * ${username} ${msg.action}`);
                    broadcastToRoom(msg.room || currentRoom, {
                        type: 'emote',
                        username: username,
                        action: msg.action,
                        room: msg.room || currentRoom
                    }, username);
                    break;

                case 'whisper':
                    // Handle whisper command
                    const { from, to, message: whisperMsg } = msg;
                    let recipientFound = false;

                    if (users.has(to)) {
                        const recipientWs = users.get(to).ws;
                        if (recipientWs.readyState === WebSocket.OPEN) {
                            recipientFound = true;
                            recipientWs.send(JSON.stringify({
                                type: 'whisper',
                                from: from,
                                message: whisperMsg
                            }));
                        }
                    }

                    // Send confirmation to sender
                    if (recipientFound) {
                        ws.send(JSON.stringify({
                            type: 'message',
                            username: 'System',
                            message: `Whisper sent to ${to}`,
                            room: currentRoom
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: `User ${to} not found or offline.`
                        }));
                    }
                    break;

                case 'typing':
                    // Notify room that user is typing
                    if (users.has(username)) {
                        users.get(username).status = 'typing';
                    }
                    broadcastToRoom(msg.room || currentRoom, {
                        type: 'typing',
                        username: username,
                        room: msg.room || currentRoom
                    }, username);
                    break;

                case 'stoppedTyping':
                    // Notify room that user stopped typing
                    if (users.has(username)) {
                        users.get(username).status = 'online';
                    }
                    broadcastToRoom(msg.room || currentRoom, {
                        type: 'stoppedTyping',
                        username: username,
                        room: msg.room || currentRoom
                    }, username);
                    break;

                case 'version':
                    // Send version information to client
                    ws.send(JSON.stringify({
                        type: 'version',
                        serverVersion: SERVER_VERSION,
                        versionDate: VERSION_DATE,
                        changelog: CHANGELOG[SERVER_VERSION]
                    }));
                    break;

                default:
                    console.log(`Unknown message type: ${msg.type} from user: ${username}`);
                    console.log('Full message:', msg);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: `Unknown message type: ${msg.type}`
                    }));
            }
        } catch (error) {
            console.error('Error parsing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });

    // Handle client disconnect
    ws.on('close', function() {
        if (username && username !== "Guest") {
            console.log(`${username} disconnected`);
            removeUserFromAllRooms(username);
        } else {
            console.log('Anonymous client disconnected');
        }
    });

    ws.on('error', function(error) {
        console.error('WebSocket error for user:', username || 'unknown', error);
    });

    // Send initial welcome message
    ws.send(JSON.stringify({
        type: 'message',
        username: 'System',
        message: 'Welcome to the MUD! Type /help for commands.',
        room: currentRoom
    }));
});


// Start the server on port 5000 (changed from 5000 to match client expectations)
server.listen(5000, function() {
    console.log(`HTTPS MUD Server v${SERVER_VERSION} running at https://localhost:5000`);
    console.log('Supported rooms:', Array.from(rooms.keys()).join(', '));
    console.log(`Server started on ${new Date().toISOString()}`);
    console.log('Ready for connections!');
    
    // Initialize room counts
    setInterval(() => {
        if (users.size > 0) {
            broadcastRoomCounts();
        }
    }, 30000); // Broadcast room counts every 30 seconds
});
