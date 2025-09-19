const http = require('http');
const WebSocket = require('ws');

// Create an HTTP server for local testing
const server = http.createServer();

// Create WebSocket server using the HTTP server
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
    let username = "Guest"; // Default username

    console.log('New client connected');

    // Set username for each client
    ws.on('message', function incoming(message) {
        let msg;
        try {
            msg = JSON.parse(message); // Parse incoming JSON message
        } catch (e) {
            console.error('Invalid JSON received:', message);
            return;
        }

        if (msg.type === 'username') {
            // Set the username for the connected client
            username = msg.username;
            console.log(`${username} has joined the game`);
            ws.username = username; // Store the username on the WebSocket object
            ws.send(JSON.stringify({ username: 'System', message: `Welcome, ${username}!` }));
        } else if (msg.type === 'message') {
            // Broadcast regular messages to all clients
            console.log(`${username}: ${msg.message}`);
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ username: username, message: msg.message }));
                }
            });
        } else if (msg.type === 'whisper') {
            // Handle whisper command
            const { from, to, message } = msg;
            let recipientFound = false;

            wss.clients.forEach(function each(client) {
                // Check if the recipient client matches the "to" user and is connected
                if (client !== ws && client.readyState === WebSocket.OPEN && client.username === to) {
                    recipientFound = true;
                    // Send the private message to the target user (whisper)
                    client.send(JSON.stringify({ username: from, message: `[Whisper] ${message}` }));
                }
            });

            // If recipient not found, notify the sender
            if (recipientFound) {
                ws.send(JSON.stringify({ username: 'System', message: `You whispered to ${to}: ${message}` }));
            } else {
                ws.send(JSON.stringify({ username: 'System', message: `User ${to} not found.` }));
            }
        } else if (msg.type === 'typing') {
            // Notify other clients that the user is typing
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'typing', username: username }));
                }
            });
        } else if (msg.type === 'stoppedTyping') {
            // Notify other clients that the user stopped typing
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'stoppedTyping', username: username }));
                }
            });
        }
    });

    ws.on('close', function() {
        console.log(`${username} has left the game`);
    });

    ws.on('error', function(error) {
        console.error('WebSocket error:', error);
    });

    // Welcome message
    ws.send(JSON.stringify({ username: 'System', message: 'Welcome to the MUD! Type /help for a list of commands.' }));
});

// Start the server on port 3000 for local testing
server.listen(3000, function() {
    console.log('Local MUD server running at http://localhost:3000');
    console.log('WebSocket available at ws://localhost:3000');
});