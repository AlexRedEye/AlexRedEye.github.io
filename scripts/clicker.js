import * as Blackjack from './blackjack.js';

// Ensure game is loaded after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    loadGame();
});

let chips = 0;
let cps = 0;
let cpc = 1;

let slotMachines = 0;
let slotMachinePrice = 15;
let slotMachineModifier = 0.1;

let achievement = 100;
let reached100 = false;
let bjUnlocked = false;

let game = Blackjack.resetGame(); // Start a new game
let deck = game.deck;
let playerHand = game.playerHand;
let dealerHand = game.dealerHand;

// Save game state to localStorage
function saveGame() {
    localStorage.setItem('chips', chips);
    localStorage.setItem('cps', cps);
    localStorage.setItem('cpc', cpc);
    localStorage.setItem('reached100', JSON.stringify(reached100));

    // Save each unit's count, price, and modifier
    Object.keys(units).forEach(unit => {
        localStorage.setItem(`${unit}_count`, units[unit].count);
        localStorage.setItem(`${unit}_price`, units[unit].price);
        localStorage.setItem(`${unit}_modifier`, units[unit].modifier);  // Save modifier
    });

    // Save unlocked upgrades and their effects
    upgrades.forEach((upgrade, index) => {
        localStorage.setItem(`upgrade_${index}_unlocked`, upgrade.unlocked);
    });
}

// Auto-save every 10 seconds
setInterval(() => {
    saveGame();
}, 10000);

// Load data from localStorage (if available)
function loadGame() {
    if (localStorage.getItem('chips')) chips = parseFloat(localStorage.getItem('chips'));
    if (localStorage.getItem('cps')) cps = parseFloat(localStorage.getItem('cps'));
    if (localStorage.getItem('cpc')) cpc = parseFloat(localStorage.getItem('cpc'));
    if (localStorage.getItem('reached100')) reached100 = JSON.parse(localStorage.getItem('reached100'));

    // Load each unit's count, price, and modifier
    Object.keys(units).forEach(unit => {
        if (localStorage.getItem(`${unit}_count`)) {
            units[unit].count = parseInt(localStorage.getItem(`${unit}_count`));
        }
        if (localStorage.getItem(`${unit}_price`)) {
            units[unit].price = parseInt(localStorage.getItem(`${unit}_price`));
        }
        if (localStorage.getItem(`${unit}_modifier`)) {
            units[unit].modifier = parseFloat(localStorage.getItem(`${unit}_modifier`));  // Load modifier
        }
    });

    // Load unlocked upgrades
    upgrades.forEach((upgrade, index) => {
        if (localStorage.getItem(`upgrade_${index}_unlocked`)) {
            upgrade.unlocked = JSON.parse(localStorage.getItem(`upgrade_${index}_unlocked`));
        }
    });

    refreshDisplays();
    populateUpgrades();
}

// Delete Save from localStorage
function deleteSave() {
    localStorage.clear();
}

// Update HTML
function refreshDisplays() {
    document.getElementById("chips").textContent = Math.floor(chips);
    
    // Round cps to the nearest tenth
    document.getElementById("cps").textContent = cps.toFixed(1);
    
    document.getElementById("cpc").textContent = cpc;

    document.getElementById("slotMachinePrice").textContent = units.slotMachine.price;
    document.getElementById("slotMachineCount").textContent = 'x' + units.slotMachine.count;
    document.getElementById("roulletePrice").textContent = units.roullete.price;
    document.getElementById("roulleteCount").textContent = 'x' + units.roullete.count;

    // ✅ Blackjack Display Updates
    if (document.getElementById("blackjackPrice")) {
        document.getElementById("blackjackPrice").textContent = units.blackjack.price;
        document.getElementById("blackjackCount").textContent = 'x' + units.blackjack.count;
    }
}

// Function to save the game each time the state changes
function updateGameState() {
    saveGame();
    refreshDisplays();
    populateUpgrades();  

    // Check if Blackjack should be unlocked
    if (chips >= 1100 && !localStorage.getItem('blackjackUnlocked')) {
        localStorage.setItem('blackjackUnlocked', 'true'); // Store as a string
        addBlackjackSection(); // Add it immediately after unlocking
    }

    if (localStorage.getItem('blackjackUnlocked') === 'true') {
        addBlackjackSection(); // Ensure it stays after refresh
    }

        // Check if Blackjack should be unlocked
        if (localStorage.getItem(`blackjack_count`) >= 1 && !localStorage.getItem('bjUnlocked')) {
            localStorage.setItem('bjUnlocked', 'true'); // Store as a string
            unlockBlackjackGame(); // Add it immediately after unlocking
        }
    
        if (localStorage.getItem('bjUnlocked') === 'true') {
            unlockBlackjackGame(); // Ensure it stays after refresh
        }
}

function updatePlayerHand() {
    const playerHandElement = document.getElementById('playerHand');
    const playerHandText = playerHand.map(card => {
        console.log(card);  // Check the structure of the card
        return `${card.rank} of ${card.suit}`;  // Accessing the right properties
    }).join(', ');

    playerHandElement.textContent = `Player's Hand: ${playerHandText} (Score: ${Blackjack.calculateHandValue(playerHand)})`;
}

function updateDealerHand(reveal = false) {
    const dealerHandElement = document.getElementById('dealerHand');
    if (reveal) {
        const dealerHandText = dealerHand.map(card => {
            console.log(card);  // Check the structure of the card
            return `${card.rank} of ${card.suit}`;  // Accessing the right properties
        }).join(', ');
        dealerHandElement.textContent = `Dealer's Hand: ${dealerHandText} (Score: ${Blackjack.calculateHandValue(dealerHand)})`;
    } else {
        dealerHandElement.textContent = `Dealer's Hand: ${dealerHand[0].rank} of ${dealerHand[0].suit} and a hidden card.`;
    }
}

function showGameResult(result) {
    const gameStatus = document.getElementById('gameStatus');
    gameStatus.textContent = result;  // Update the existing element with the result

    // Hide game buttons
    document.getElementById('hitButton').style.display = 'none';
    document.getElementById('standButton').style.display = 'none';

    console.log(`Chips after result: ${chips}`);
}


// Add Blackjack unit if requirements are met
function addBlackjackSection() {
    const gamesSection = document.querySelector(".games");

    // Ensure the games section exists before appending
    if (!gamesSection) {
        console.error("Games section not found!");
        return;
    }

    // Prevent duplicate sections
    if (!document.getElementById("blackjackSection")) {
        const blackjackDiv = document.createElement("div");
        blackjackDiv.id = "blackjackSection"; 
        blackjackDiv.classList.add("game");
        blackjackDiv.innerHTML = `
            <p>Buy Blackjack ($<span id="blackjackPrice">1100</span>) <span id="blackjackCount">x0</span></p>
            <button id="buyBlackjackButton">Buy</button>
        `;
        gamesSection.appendChild(blackjackDiv);

        document.getElementById("buyBlackjackButton").addEventListener("click", () => {
            buyUnit(units.blackjack); // Continue allowing Blackjack purchases
        });
    }
}

function checkAchievements() {
    if (!reached100 && chips >= achievement) {
        reached100 = true;
        alert("Achievement Unlocked: 100 Chips!");
    }
}

// Units
const units = {
    slotMachine: {
      name: "Slot Machine",
      price: 15,
      count: 0,
      modifier: 0.1,
      cps: 0.1,
      label: "A classic slot machine that generates chips over time."
    },
    roullete: {
      name: "Roullete",
      price: 100,
      count: 0,
      modifier: 1,
      cps: 1,
      label: "A high-speed spinner that boosts chip production."
    },
    blackjack: {
        name: "Blackjack",
        price: 1100,
        count: 0,
        modifier: 8,
        cps: 8,
        label: "A high-speed spinner that boosts chip production."
    }
};

// Upgrades
let upgrades = [
    {
        name: "Slot Machine Upgrade",
        price: 100,
        requiredUnits: 1,
        description: "Personal and Casino slot machines are twice as efficient.",
        effect: () => { 
            cpc *= 2; 
            units.slotMachine.modifier *= 2;
            calculateCPS();
        },        
        unlocked: false
    },
    {
        name: "Slot Machine Upgrade II",
        price: 500,
        requiredUnits: 5,  
        description: "Personal and Casino slot machines are twice as efficient.",
        effect: () => { 
            cpc *= 2; 
            units.slotMachine.modifier *= 2;
            calculateCPS();
        },        
        unlocked: false
    },
    {
        name: "Personal Slot Upgrade",
        price: 50000,
        requiredUnits: 10,  
        description: "Spinning gains +1% of your CPS",
        effect: () => { 
            cpc += Math.round(cps * 0.01 * 10) / 10; 
        },        
        unlocked: false
    },
    {
        name: "Personal Slot Upgrade II",
        price: 100000,
        requiredUnits: 10,  
        description: "Spinning gains +1% of your CPS",
        effect: () => { 
            cpc += Math.round(cps * 0.01 * 10) / 10; 
        },        
        unlocked: false
    },
    {
        name: "Super Slots Upgrade",
        price: 10000,
        requiredUnits: 10,  
        description: "Personal and Casino slot machines are twice as efficient.",
        effect: () => { 
            cpc *= 2; 
            units.slotMachine.modifier *= 2;
            calculateCPS();
        },       
        unlocked: false
    },
    {
        name: "Roullete Upgrade",
        price: 1000,
        requiredUnits: 1, 
        description: "Roulletes are twice as efficient.",
        effect: () => {  
            units.roullete.modifier *= 2;
            calculateCPS();
        },        
        unlocked: false
    },
    {
        name: "Roullete Upgrade II",
        price: 5000,
        requiredUnits: 5,  
        description: "Roulletes are twice as efficient.",
        effect: () => {  
            units.roullete.modifier *= 2;
            calculateCPS();
        },        
        unlocked: false
    },
    {
        name: "Blackjack Upgrade",
        price: 11000,
        requiredUnits: 5,  
        description: "Roulletes are twice as efficient.",
        effect: () => {  
            units.blackjack.modifier *= 2;
            calculateCPS();
        },        
        unlocked: false
    },
    {
        name: "Blackjack Upgrade II",
        price: 55000,
        requiredUnits: 5,  
        description: "Roulletes are twice as efficient.",
        effect: () => {  
            units.blackjack.modifier *= 2;
            calculateCPS();
        },        
        unlocked: false
    }
];

// Calculate total CPS from upgrades
function calculateCPS() {
    cps = (units.slotMachine.count * units.slotMachine.modifier) + 
          (units.roullete.count * units.roullete.modifier) + 
          (units.blackjack.count * units.blackjack.modifier);
}

// Add upgrades to the upgrades sections as you unlock them
function populateUpgrades() {
    const upgradesSection = document.querySelector(".upgrades");
    upgradesSection.innerHTML = '<h2>Upgrades</h2>'; // Clear the section before repopulating

    upgrades.forEach(upgrade => {
        if (chips >= upgrade.price) {
            let unitsRequiredMet = false;

            if (upgrade.name.includes("Slot") && units.slotMachine.count >= upgrade.requiredUnits) {
                unitsRequiredMet = true;
            } else if (upgrade.name.includes("Roullete") && units.roullete.count >= upgrade.requiredUnits) {
                unitsRequiredMet = true;
            } else if (upgrade.name.includes("Blackjack") && units.blackjack.count >= upgrade.requiredUnits) {
                unitsRequiredMet = true;
            }

            if (unitsRequiredMet && !upgrade.unlocked) {
                const upgradeDiv = document.createElement("div");
                upgradeDiv.classList.add("upgrade");

                const upgradeName = document.createElement("h3");
                upgradeName.textContent = upgrade.name;
                const upgradeDesc = document.createElement("p");
                upgradeDesc.textContent = `${upgrade.description} (Requires ${upgrade.requiredUnits} ${upgrade.name.includes("Slot Machine") ? "Slot Machines" : upgrade.name.includes("Roullete") ? "Roulletes" : "Blackjacks"})`;

                const upgradeButton = document.createElement("button");
                upgradeButton.textContent = `Buy for ${upgrade.price} Chips`;

                upgradeButton.addEventListener("click", () => {
                    if (chips >= upgrade.price) {
                        chips -= upgrade.price;
                        upgrade.effect();
                        upgrade.unlocked = true;
                        updateGameState();
                        populateUpgrades();
                    } else {
                        console.log("Not enough chips or units to buy this upgrade.");
                    }
                });

                upgradeDiv.appendChild(upgradeName);
                upgradeDiv.appendChild(upgradeDesc);
                upgradeDiv.appendChild(upgradeButton);
                upgradesSection.appendChild(upgradeDiv);
            }
        }
    });


}

// Function to increment chips
function spin() {
    chips += cpc;
    checkAchievements();  // Check if any achievements are reached
    updateGameState(); // Save the state after the spin
}

// Function to buy units
function buyUnit(unit) {
    if (chips >= unit.price) {
        chips -= unit.price;
        unit.count += 1;
        cps += unit.modifier;

        // Exponential increase: Price grows by 1.15 for each unit purchase
        const priceMultiplier = 1.15;  // Price increases by 15% each time
        unit.price = Math.ceil(unit.price * priceMultiplier);

        updateGameState(); // Save the state after purchasing

        // If Blackjack is being purchased for the first time, unlock the game
        if (unit.name === "Blackjack" && unit.count === 1 && !bjUnlocked) {
            bjUnlocked = true;  // Set flag to true to indicate Blackjack has been unlocked
            unlockBlackjackGame(); // Unlock and show Blackjack game UI
        }

        updateGameState(); // Save the state after purchasing
    } else {
        console.log('Not Enough Chips!');
    }
}

// Show Blackjack game HTML
function unlockBlackjackGame() {
    // Make sure Blackjack game UI is visible
    document.getElementById("blackjackGameSection").style.display = "block";
}

// Add auto-collecting CPS
setInterval(() => {
    chips += cps;
    updateGameState();  // Save the state every second
}, 1000);

// Event listeners for buttons
// Spin For Chips Button
document.getElementById("spinButton").addEventListener("click", () => {
    spin();
});

// Buy slot machine button
document.getElementById("buySlotMachineButton").addEventListener("click", () => {
    buyUnit(units.slotMachine);
});

// Buy roullete button
document.getElementById("buyRoulleteButton").addEventListener("click", () => {
    buyUnit(units.roullete);
});

// Delete Save Button
document.getElementById("deleteSave").addEventListener("click", () => {
    deleteSave();
    location.reload();
});

document.getElementById("hitButton").addEventListener("click", function () {
    if (!game.gameOver) {
        Blackjack.dealCard(deck, playerHand);
        updatePlayerHand(); // Update player hand after hit
        
        if (Blackjack.checkForBusted(playerHand)) {
            console.log("You busted! You lose.");
            game.gameOver = true;
            showGameResult("You busted! You lose.");
        }
    }
});

document.getElementById("standButton").addEventListener("click", function () {
    if (!game.gameOver) {
        Blackjack.playDealerTurn(dealerHand, deck);
        updateDealerHand(true); // Show the dealer's hand

        const result = Blackjack.checkGameResult(playerHand, dealerHand);
        console.log(result);

        // Payout logic
        if (result.includes("Win")) {
            chips += 1000; // 1:1 payout
        } else if (result.includes("Tie") || result.includes("push")) {
            chips += 500; // Refund bet on a tie
        }

        showGameResult(result);
        game.gameOver = true;
        updateGameState();
    }
});

document.getElementById("retryButton").addEventListener("click", function () {
    if (chips >= 500)
    {
        chips -= 500;
    } else {
        return document.getElementById("gameStatus").textContent = 'Not Enough Money';;
    }
    // Reset the game logic properly
    game = Blackjack.resetGame(); // Resets game state, deck, hands, etc.
    playerHand = game.playerHand;
    dealerHand = game.dealerHand;
    game.gameOver = false;

    // Reset the UI elements
    updatePlayerHand();           // Refresh the player's hand display
    updateDealerHand(false);      // Hide the dealer's second card (it will be revealed after the player stands)

    // Optionally, reset any other relevant state or variables here
    document.getElementById('hitButton').style.display = 'inline-block';
    document.getElementById('standButton').style.display = 'inline-block';
    document.getElementById('retryButton').style.display = 'inline-block';
    document.getElementById("gameStatus").textContent = '';

    console.log("Game reset. Start a new round!");
});

document.getElementById("startButton").addEventListener("click", function () {
    // Reset the game logic properly
    if (chips >= 500)
    {
        chips -= 500;
    } else {
        return document.getElementById("gameStatus").textContent = 'Not Enough Money';;
    }
    game = Blackjack.resetGame(); // Resets game state, deck, hands, etc.
    playerHand = game.playerHand;
    dealerHand = game.dealerHand;
    game.gameOver = false;

    // Reset the UI elements
    updatePlayerHand();           // Refresh the player's hand display
    updateDealerHand(false);      // Hide the dealer's second card (it will be revealed after the player stands)

    // Optionally, reset any other relevant state or variables here
    document.getElementById('hitButton').style.display = 'inline-block';
    document.getElementById('standButton').style.display = 'inline-block';
    document.getElementById('retryButton').style.display = 'inline-block';
    document.getElementById('startButton').style.display = 'none';
    document.getElementById("gameStatus").textContent = '';

    console.log("Game reset. Start a new round!");
});

document.addEventListener("DOMContentLoaded", function () {
    const startButton = document.getElementById("startButton");
    const volumeSlider = document.getElementById("volumeSlider");

    if (!startButton || !volumeSlider) {
        console.error("Elements not found.");
        return;
    }

    const audio = new Audio("../assets/MAZE.mp3");
    audio.loop = true; // Enable looping
    audio.volume = volumeSlider.value; // Set initial volume

    // Play audio when the user clicks "Start Music"
    startButton.addEventListener("click", function () {
        audio.play().catch(err => {
            console.error("Audio play failed:", err);
        });

        // Hide or disable the button after it's clicked
        startButton.style.display = "none"; // Option 1: Hide the button
        // startButton.disabled = true; // Option 2: Disable the button
    });

    // Update audio volume when the slider changes
    volumeSlider.addEventListener("input", function () {
        audio.volume = this.value;
    });
});