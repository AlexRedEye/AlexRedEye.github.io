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
    }
  };  

let upgrades = [
    {
        name: "Slot Machine Upgrade",
        price: 100,
        requiredUnits: 1,  // Require at least 1 slot machine
        description: "Personal and Casino slot machines are twice as efficient.",
        effect: () => { 
            cpc *= 2; 
            units.slotMachine.modifier *= 2;
            cps = units.slotMachine.count * units.slotMachine.modifier;
        },
        unlocked: false
    },
    {
        name: "Slot Machine Upgrade II",
        price: 500,
        requiredUnits: 5,  // Require at least 5 slot machines
        description: "Personal and Casino slot machines are twice as efficient.",
        effect: () => { 
            cpc *= 2; 
            units.slotMachine.modifier *= 2;
            cps = units.slotMachine.count * units.slotMachine.modifier;
        },
        unlocked: false
    },
    {
        name: "Personal Slot Upgrade",
        price: 1000,
        requiredUnits: 10,  // Require at least 10 slot machines
        description: "Spinning gains +1% of your CPS",
        effect: () => { 
            cpc += Math.round(cps * 0.01 * 10) / 10; 
        },        
        unlocked: false
    },
    {
        name: "Roullete Upgrade",
        price: 200,
        requiredUnits: 1,  // Require at least 1 slot machine
        description: "Personal and Casino slot machines are twice as efficient.",
        effect: () => { 
            cpc *= 2; 
            units.roullete.modifier *= 2;
            cps = units.slotMachine.count * units.slotMachine.modifier;
        },
        unlocked: false
    },
    {
        name: "Roullete Upgrade II",
        price: 2000,
        requiredUnits: 5,  // Require at least 5 slot machines
        description: "Personal and Casino slot machines are twice as efficient.",
        effect: () => { 
            cpc *= 2; 
            units.roullete.modifier *= 2;
            cps = units.slotMachine.count * units.slotMachine.modifier;
        },
        unlocked: false
    }
];

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
    if (localStorage.getItem('reached100')) {
        reached100 = JSON.parse(localStorage.getItem('reached100'));
    }

    refreshDisplays();  // Refresh the display to reflect the loaded values
    populateUpgrades();  // Populate the upgrades section based on the current state
}

function populateUpgrades() {
    const upgradesSection = document.querySelector(".upgrades");
    upgradesSection.innerHTML = '<h2>Upgrades</h2>'; // Clear the section before repopulating

    upgrades.forEach(upgrade => {
        // Check if the upgrade is unlocked based on required units and chips
        if (chips >= upgrade.price) {
            let unitsRequiredMet = false;

            // Check if the required units condition is met
            if (upgrade.name.includes("Slot Machine") && units.slotMachine.count >= upgrade.requiredUnits) {
                unitsRequiredMet = true;
            } else if (upgrade.name.includes("Roullete") && units.roullete.count >= upgrade.requiredUnits) {
                unitsRequiredMet = true;
            }

            if (unitsRequiredMet && !upgrade.unlocked) {
                // Create the upgrade div
                const upgradeDiv = document.createElement("div");
                upgradeDiv.classList.add("upgrade");

                const upgradeName = document.createElement("h3");
                upgradeName.textContent = upgrade.name;
                const upgradeDesc = document.createElement("p");
                upgradeDesc.textContent = `${upgrade.description} (Requires ${upgrade.requiredUnits} ${upgrade.name.includes("Slot Machine") ? "Slot Machines" : "Roulletes"})`;

                const upgradeButton = document.createElement("button");
                upgradeButton.textContent = `Buy for ${upgrade.price} Chips`;

                // Add the button click event
                upgradeButton.addEventListener("click", () => {
                    if (chips >= upgrade.price) {
                        chips -= upgrade.price;
                        upgrade.effect();  // Apply the effect of the upgrade
                        upgrade.unlocked = true;  // Mark the upgrade as unlocked
                        updateGameState();  // Save the state
                        populateUpgrades();  // Re-render the upgrades section
                    } else {
                        console.log("Not enough chips or units to buy this upgrade.");
                    }
                });

                // Append the elements to the upgrade div
                upgradeDiv.appendChild(upgradeName);
                upgradeDiv.appendChild(upgradeDesc);
                upgradeDiv.appendChild(upgradeButton);

                // Add the upgrade div to the upgrades section
                upgradesSection.appendChild(upgradeDiv);
            }
        }
    });
}

// Save game state to localStorage
function saveGame() {
    localStorage.setItem('chips', chips);
    localStorage.setItem('cps', cps);
    localStorage.setItem('slotMachines', slotMachines);
    localStorage.setItem('slotMachinePrice', slotMachinePrice);
    localStorage.setItem('reached100', JSON.stringify(reached100)); // Save achievement status
}

// Function to save the game each time the state changes
function updateGameState() {
    saveGame();
    refreshDisplays();
    populateUpgrades();  // Update the upgrades section after each game state change
}

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

// Load saved data when the page loads
loadGame();
