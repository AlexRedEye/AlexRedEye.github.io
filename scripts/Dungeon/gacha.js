// gacha.js

// Fetch the items from the external JSON file
export let gachaPool = [];

async function loadItems() {
    try {
        const response = await fetch('../data/items.json');
        const data = await response.json();
        gachaPool = data.items;  // Store the items in the gacha pool
        console.log("Items loaded:", gachaPool);
    } catch (error) {
        console.error("Error loading items:", error);
    }
}

// Weight for each rarity (lower numbers are less likely to be summoned)
const rarityWeights = {
    common: 50,
    uncommon: 30,
    rare: 15,
    epic: 4,
    legendary: 1
};

// Function to handle a summon (random item from the pool)
export function summonItem() {
    // Ensure the items are loaded before summoning
    if (gachaPool.length === 0) {
        console.error("No items loaded yet.");
        return null;
    }

    // Calculate the total weight
    const totalWeight = gachaPool.reduce((total, item) => {
        const rarity = item.rarity.toLowerCase();
        const weight = rarityWeights[rarity] || 0;
        return total + weight;
    }, 0);

    // Generate a random number between 0 and totalWeight
    const randomNum = Math.random() * totalWeight;

    let currentWeight = 0;

    // Loop through items and select the one based on weighted probability
    for (const item of gachaPool) {
        const rarity = item.rarity.toLowerCase();
        const weight = rarityWeights[rarity] || 0;
        currentWeight += weight;

        // If randomNum is within the range of this item's weight, select it
        if (randomNum < currentWeight) {
            console.log(`You summoned a ${item.name}!`);
            return item; // Return the summoned item
        }
    }

    // Fallback in case something goes wrong (should not happen)
    console.error("Error: No item selected.");
    return null;
}

// Add to inventory function
export function addToInventory(item, player) {
    player.inventory.push(item);
    console.log(`Added ${item.name} to inventory.`);
}

// Initialize the items when the module loads
loadItems();
