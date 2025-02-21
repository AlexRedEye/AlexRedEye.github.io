// gacha.js

// Fetch the items from the external JSON file
export let gachaPool = [];

async function loadItems() {
    try {
        const response = await fetch('../json/items.json');
        const data = await response.json();
        gachaPool = data.items;  // Store the items in the gacha pool
        console.log("Items loaded:", gachaPool);
    } catch (error) {
        console.error("Error loading items:", error);
    }
}

// Function to dynamically adjust rarity weights based on floor
function getAdjustedRarityWeights(floor) {
    return {
        common: Math.max(10, 57.3 - floor * 2), // Decrease over time, but not below 10%
        uncommon: Math.min(30, 25 + floor * 1), // Gradually increase, but cap at 30%
        rare: Math.min(25, 15 + floor * 1.2),   // Increase, cap at 25%
        epic: Math.min(7, 2.4 + floor * 0.5),   // Increase, cap at 7%
        legendary: Math.min(2, 0.3 + floor * 0.2) // Increase, cap at 2%
    };
}

// Function to summon item with rarity scaling
export function summonItem(floor) {
    if (gachaPool.length === 0) {
        console.error("No items loaded yet.");
        return null;
    }

    const rarityWeights = getAdjustedRarityWeights(floor); // Get floor-based rarity weights

    // Calculate total weight
    const totalWeight = gachaPool.reduce((total, item) => {
        const rarity = item.rarity.toLowerCase();
        return total + (rarityWeights[rarity] || 0);
    }, 0);

    // Generate a random number
    const randomNum = Math.random() * totalWeight;
    let currentWeight = 0;

    // Determine which item is chosen
    for (const item of gachaPool) {
        const rarity = item.rarity.toLowerCase();
        currentWeight += rarityWeights[rarity] || 0;

        if (randomNum < currentWeight) {
            console.log(`You summoned a ${item.name} (${item.rarity})!`);
            return item;
        }
    }

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
