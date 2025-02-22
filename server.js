const WebSocket = require('ws');

// Create a WebSocket server that listens on port 8080
const wss = new WebSocket.Server({ port: 5000 });

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
        }
    });

    // Optional: Notify new clients when they connect
    ws.send(JSON.stringify({ username: 'System', message: 'Welcome to the chat! Type /username <your_name> to set your username.' }));
});
