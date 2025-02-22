const outputDiv = document.getElementById("game-output");
const commandInput = document.getElementById("command-input");

let username = localStorage.getItem('username') || "Guest"; // Load username from localStorage or use default

const socket = new WebSocket('wss://mud.pocketfriends.org:5000'); // Connect to WebSocket server

socket.onopen = function () {
    console.log('Connected to the server');
};

socket.onmessage = function (event) {
    const message = JSON.parse(event.data);
    appendOutput(`<span class="game-line"><strong>${message.username}:</strong> ${message.message}</span>`);
};

// Display a welcome message
appendOutput(`<span class="game-line"><strong>System:</strong> Hello, ${username}! Use /username <name> to set your username.</span>`);

commandInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendCommand();
    }
});

function sendCommand() {
    const command = commandInput.value.trim();
    if (command) {
        if (command.startsWith("/username ")) {
            // Extract the new username and send it to the server
            const newUsername = command.slice(10).trim();
            if (newUsername) {
                username = newUsername;
                localStorage.setItem('username', username); // Save the username to localStorage
                appendOutput(`<span class="game-line"><strong>System:</strong> Your username has been set to: ${username}</span>`);
                socket.send(JSON.stringify({ type: 'username', username: username }));
            } else {
                appendOutput(`<span class="game-line"><strong>System:</strong> Please provide a username after /username.</span>`);
            }
        } else {
            // Handle regular messages
            socket.send(JSON.stringify({ type: 'message', username: username, message: command }));
            appendOutput(`<span class="game-line"><strong>You:</strong> ${command}</span>`);
        }
    }
    commandInput.value = ""; // Clear input field
}

function appendOutput(text) {
    outputDiv.innerHTML += text + "<br>";
    outputDiv.scrollTop = outputDiv.scrollHeight; // Auto-scroll to the bottom
}
