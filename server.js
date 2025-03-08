const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');

// Read SSL certificate and key
const serverOptions = {
    cert: fs.readFileSync('pfcert.cer'),
    key: fs.readFileSync('pfkey.key')
};

// Create an HTTPS server
const server = https.createServer(serverOptions);

// Create WebSocket server using the HTTPS server
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
    let username = "Guest"; // Default username

    // Listen for messages from the client
    ws.on('message', function incoming(message) {
        let msg = JSON.parse(message); // Parse incoming JSON message

        if (msg.type === 'username') {
            // Set the username
            username = msg.username;
            console.log(`${username} has joined the game`);
            ws.send(JSON.stringify({ username: 'System', message: `Welcome, ${username}!` }));
        } else if (msg.type === 'message') {
            // Broadcast the message to all other clients
            console.log(`${username}: ${msg.message}`);
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ username: username, message: msg.message }));
                }
            });
        } else if (msg.type === 'whisper') {
            // Send a private message (whisper)
            const { from, to, message } = msg;
            let recipientFound = false;

            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    if (client.username === to) {
                        recipientFound = true;
                        client.send(JSON.stringify({ username: from, message: `[Whisper] ${message}` }));
                    }
                }
            });

            if (recipientFound) {
                ws.send(JSON.stringify({ username: 'System', message: `You whispered to ${to}: ${message}` }));
            } else {
                ws.send(JSON.stringify({ username: 'System', message: `User ${to} not found.` }));
            }
        }
    });

    // Optional: Notify new clients when they connect
    ws.send(JSON.stringify({ username: 'System', message: 'Welcome to the chat! Type /help for a list of commands.' }));
});

// Start the server on port 5000
server.listen(5000, function() {
    console.log('Server running at https://localhost:5000');
});