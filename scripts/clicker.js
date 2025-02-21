let chips = 0;
let cps = 0;
let cpc = 1;

let slotMachines = 0;
let slotMachinePrice = 15;
let slotMachineModifier = 0.1;

// Load data from localStorage (if available)
function loadGame() {
    if (localStorage.getItem('chips')) {
        chips = parseFloat(localStorage.getItem('chips'));
    }
    if (localStorage.getItem('cps')) {
        cps = parseFloat(localStorage.getItem('cps'));
    }
    if (localStorage.getItem('slotMachines')) {
        slotMachines = parseFloat(localStorage.getItem('slotMachines'));
    }
    if (localStorage.getItem('slotMachinePrice')) {
        slotMachinePrice = parseFloat(localStorage.getItem('slotMachinePrice'));
    }

    refreshDisplays();  // Refresh the display to reflect the loaded values
}

// Save game state to localStorage
function saveGame() {
    localStorage.setItem('chips', chips);
    localStorage.setItem('cps', cps);
    localStorage.setItem('slotMachines', slotMachines);
    localStorage.setItem('slotMachinePrice', slotMachinePrice);
}

// Function to save the game each time the state changes
function updateGameState() {
    saveGame();
    refreshDisplays();
}

function spin() {
    chips += cpc;
    updateGameState(); // Save the state after the spin
}

function buyUnit() {
    if (chips >= slotMachinePrice) {
        chips -= slotMachinePrice;
        slotMachines += 1;
        cps += slotMachineModifier;

        // Exponential increase: Price grows by 1.15 for each slot machine purchase
        const priceMultiplier = 1.15;  // Price increases by 15% each time
        slotMachinePrice = Math.ceil(slotMachinePrice * priceMultiplier);

        updateGameState(); // Save the state after purchasing
    } else {
        console.log('Not Enough Chips!');
    }
}

function refreshDisplays() {
    document.getElementById("chips").textContent = Math.floor(chips);
    
    // Round cps to the nearest tenth
    document.getElementById("cps").textContent = cps.toFixed(1);
    
    document.getElementById("cpc").textContent = cpc;

    document.getElementById("slotMachinePrice").textContent = slotMachinePrice;
    document.getElementById("slotMachineCount").textContent = 'x' + slotMachines;
}

function deleteSave() {
    localStorage.clear();
}

// Add auto-collecting CPS
setInterval(() => {
    chips += cps;
    updateGameState();  // Save the state every second
}, 1000);

// Event listeners for buttons
document.getElementById("spinButton").addEventListener("click", () => {
    spin();
});

document.getElementById("buySlotMachineButton").addEventListener("click", () => {
    buyUnit();
});

document.getElementById("deleteSave").addEventListener("click", () => {
    deleteSave();
    location.reload();
});

// Load saved data when the page loads
loadGame();