const http = require('http');
const WebSocket = require('ws');

// Create an HTTP server for local testing
const server = http.createServer();

// Create WebSocket server using the HTTP server
const wss = new WebSocket.Server({ server });

// Track users and rooms
const users = new Map();
const rooms = new Map(['general', 'games', 'random', 'tech'].map(room => [room, new Set()]));

function broadcastToRoom(room, message, excludeWs = null) {
    const roomUsers = rooms.get(room);
    if (roomUsers) {
        roomUsers.forEach(ws => {
            if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
}

function broadcastUserList(room) {
    const roomUsers = rooms.get(room);
    if (roomUsers) {
        const userList = Array.from(roomUsers).map(ws => ({
            username: ws.username,
            status: ws.userStatus || 'online',
            room: room
        }));
        
        roomUsers.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'userList', users: userList }));
            }
        });
    }
}

function broadcastRoomCounts() {
    const roomCounts = {};
    rooms.forEach((users, roomName) => {
        roomCounts[roomName] = users.size;
    });
    
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            Object.entries(roomCounts).forEach(([room, count]) => {
                client.send(JSON.stringify({ type: 'roomUsers', room, count }));
            });
        }
    });
}

wss.on('connection', function connection(ws) {
    let username = "Guest";
    let currentRoom = 'general';
    
    console.log('New client connected');

    // Set username for each client
    ws.on('message', function incoming(message) {
        let msg;
        try {
            msg = JSON.parse(message);
        } catch (e) {
            console.error('Invalid JSON received:', message);
            return;
        }

        if (msg.type === 'username') {
            username = msg.username;
            console.log(`${username} has set their username`);
            ws.username = username;
            ws.send(JSON.stringify({ username: 'System', message: `Welcome, ${username}!` }));
            
        } else if (msg.type === 'joinRoom') {
            const room = msg.room || 'general';
            currentRoom = room;
            ws.currentRoom = room;
            
            // Add user to room
            if (!rooms.has(room)) {
                rooms.set(room, new Set());
            }
            rooms.get(room).add(ws);
            
            console.log(`${username} joined room: ${room}`);
            
            // Notify room users
            broadcastToRoom(room, { type: 'userJoined', username: username }, ws);
            broadcastUserList(room);
            broadcastRoomCounts();
            
        } else if (msg.type === 'leaveRoom') {
            const room = msg.room || currentRoom;
            if (rooms.has(room)) {
                rooms.get(room).delete(ws);
                broadcastToRoom(room, { type: 'userLeft', username: username });
                broadcastUserList(room);
                broadcastRoomCounts();
            }
            
        } else if (msg.type === 'message') {
            const room = msg.room || currentRoom;
            console.log(`${username} in ${room}: ${msg.message}`);
            broadcastToRoom(room, { username: username, message: msg.message }, ws);
            
        } else if (msg.type === 'whisper') {
            const { from, to, message } = msg;
            let recipientFound = false;

            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN && client.username === to) {
                    recipientFound = true;
                    client.send(JSON.stringify({ username: from, message: `[Whisper] ${message}` }));
                }
            });

            if (recipientFound) {
                ws.send(JSON.stringify({ username: 'System', message: `You whispered to ${to}: ${message}` }));
            } else {
                ws.send(JSON.stringify({ username: 'System', message: `User ${to} not found.` }));
            }
            
        } else if (msg.type === 'typing') {
            ws.userStatus = 'typing';
            broadcastToRoom(currentRoom, { type: 'typing', username: username }, ws);
            broadcastUserList(currentRoom);
            
        } else if (msg.type === 'stoppedTyping') {
            ws.userStatus = 'online';
            broadcastToRoom(currentRoom, { type: 'stoppedTyping', username: username }, ws);
            broadcastUserList(currentRoom);
        }
    });

    ws.on('close', function() {
        console.log(`${username} disconnected`);
        // Remove from all rooms
        rooms.forEach((roomUsers, roomName) => {
            if (roomUsers.has(ws)) {
                roomUsers.delete(ws);
                broadcastToRoom(roomName, { type: 'userLeft', username: username });
                broadcastUserList(roomName);
            }
        });
        broadcastRoomCounts();
    });

    ws.on('error', function(error) {
        console.error('WebSocket error:', error);
    });

    // Welcome message
    ws.send(JSON.stringify({ username: 'System', message: 'Welcome to the MUD! Type /help for commands. Click rooms to switch!' }));
});

// Start the server on port 3000 for local testing (listen on all interfaces for mobile access)
server.listen(3000, '0.0.0.0', function() {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    
    console.log('Local MUD server running on port 3000');
    console.log('Server accessible at:');
    console.log('  - http://localhost:3000 (local)');
    console.log('  - ws://localhost:3000 (WebSocket)');
    
    // Show all available IP addresses for mobile access
    Object.keys(networkInterfaces).forEach(ifname => {
        networkInterfaces[ifname].forEach(iface => {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`  - http://${iface.address}:3000 (network)`);
                console.log(`  - ws://${iface.address}:3000 (WebSocket)`);
            }
        });
    });
    
    console.log('For mobile access: Use your computer\'s IP address from the network list above');
});