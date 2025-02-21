// Wait for the DOM to fully load
document.addEventListener("DOMContentLoaded", function() {
    const userInput = document.getElementById("user-input");
    const consoleOutput = document.querySelector(".console");

    // Function to process commands
    function processCommand(command) {
        // Simple example: respond to commands
        let response = '';
        
        if (command === 'look') {
            response = 'You look around and see a vast empty room with dark corners.';
        } else if (command === 'inventory') {
            response = 'You have a rusty sword and a small bag of coins.';
        } else if (command === 'help') {
            response = 'Commands available: look, inventory, help';
        } else {
            response = `Unknown command: ${command}. Type "help" for a list of commands.`;
        }
        
        // Append the command and its response to the console
        const userLine = document.createElement('p');
        userLine.textContent = `> ${command}`;
        consoleOutput.appendChild(userLine);

        const responseLine = document.createElement('p');
        responseLine.textContent = response;
        consoleOutput.appendChild(responseLine);

        // Scroll to the bottom of the console
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    // Event listener for when the user presses "Enter"
    userInput.addEventListener("keydown", function(event) {
        if (event.key === 'Enter' && userInput.value.trim() !== '') {
            const command = userInput.value.trim();
            processCommand(command);
            userInput.value = ''; // Clear input field after processing
        }
    });
});
