let chips = 0;
let cps = 0;
let cpc = 1;

let slotMachines = 0;
let slotMachinePrice = 15;
let slotMachineModifier = 0.1;

let achievement = 100;
let reached100 = false;

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

  function calculateCPS() {
    cps = (units.slotMachine.count * units.slotMachine.modifier) + 
          (units.roullete.count * units.roullete.modifier) + 
          (units.blackjack.count * units.blackjack.modifier);
}

// Updated Upgrade Effects
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

function populateUpgrades() {
    const upgradesSection = document.querySelector(".upgrades");
    upgradesSection.innerHTML = '<h2>Upgrades</h2>'; // Clear the section before repopulating

    upgrades.forEach(upgrade => {
        if (chips >= upgrade.price) {
            let unitsRequiredMet = false;

            if (upgrade.name.includes("Slot Machine") && units.slotMachine.count >= upgrade.requiredUnits) {
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
}

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
        blackjackDiv.classList.add("game"); // ✅ Correct way to add class
        blackjackDiv.innerHTML = `
            <p>Buy Blackjack ($<span id="blackjackPrice">1100</span>) <span id="blackjackCount">x0</span></p>
            <button id="buyBlackjackButton">Buy</button>
        `;
        gamesSection.appendChild(blackjackDiv);

        document.getElementById("buyBlackjackButton").addEventListener("click", () => {
            buyUnit(units.blackjack);
        });
    }
}

// Ensure game is loaded after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    loadGame();
});



function spin() {
    chips += cpc;
    checkAchievements();  // Check if any achievements are reached
    updateGameState(); // Save the state after the spin
}

function checkAchievements() {
    if (!reached100 && chips >= achievement) {
        reached100 = true;
        alert("Achievement Unlocked: 100 Chips!");
    }
}


function buyUnit(unit) {
    if (chips >= unit.price) {
        chips -= unit.price;
        unit.count += 1;
        cps += unit.modifier;

        // Exponential increase: Price grows by 1.15 for each slot machine purchase
        const priceMultiplier = 1.15;  // Price increases by 15% each time
        unit.price = Math.ceil(unit.price * priceMultiplier);

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
    buyUnit(units.slotMachine);
});

document.getElementById("buyRoulleteButton").addEventListener("click", () => {
    buyUnit(units.roullete);
});

document.getElementById("deleteSave").addEventListener("click", () => {
    deleteSave();
    location.reload();
});

// Auto-save every 10 seconds
setInterval(() => {
    saveGame();
}, 10000);

// Ensure game is loaded after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    loadGame();
});