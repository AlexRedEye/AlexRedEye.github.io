let chips = 0;
let cps = 0;
let cpc = 1;

let slotMachines = 0;
let slotMachinePrice = 15;
let slotMachineModifier = 0.1;

function spin() {
    chips += cpc;
    refreshDisplays();
}

function buyUnit() {
    if (chips >= slotMachinePrice) {
        chips -= slotMachinePrice;
        slotMachines += 1;
        cps += slotMachineModifier;

        // Exponential increase: Price grows by 1.15 for each slot machine purchase
        const priceMultiplier = 1.15;  // Price increases by 15% each time
        slotMachinePrice = Math.ceil(slotMachinePrice * priceMultiplier);

        refreshDisplays();
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


// Add auto-collecting CPS
setInterval(() => {
    chips += cps; // Add chips based on cps
    refreshDisplays(); // Update the display
}, 1000); // Runs every second

document.getElementById("spinButton").addEventListener("click", () => {
    spin();
});

document.getElementById("buySlotMachineButton").addEventListener("click", () => {
    buyUnit();
});

refreshDisplays();