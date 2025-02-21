// inventory.js
import { updatePlayerStats } from '../dungeon.js';
import { updateEquipmentDisplay } from './equipment.js';

// Function to display the inventory, showing item quantities with action buttons
export function updateInventoryDisplay(player, updatePlayerStats) {
    const inventoryList = document.getElementById("inventory-list");
    inventoryList.innerHTML = ''; // Clear current list

    // Group items by name to show quantities
    const groupedItems = player.inventory.reduce((acc, item) => {
        acc[item.name] = acc[item.name] || { ...item, quantity: 0 };
        acc[item.name].quantity++;
        return acc;
    }, {});

    // Create and append list items with buttons for each item
    for (const itemName in groupedItems) {
        const item = groupedItems[itemName];
        const listItem = document.createElement("li");

        // Display item name, quantity, and rarity
        listItem.textContent = `${item.name} x${item.quantity} (${item.rarity})`;

        // Optionally, you can add some color to the rarity for better visibility
        listItem.style.color = getRarityColor(item.rarity);

        // Create action buttons based on item type
        const buttonContainer = document.createElement("div");

        // Button to use item (only consumables like potions)
        if (item.type === "consumable") {
            const useButton = document.createElement("button");
            useButton.textContent = "Use";
            useButton.addEventListener("click", () => {
                useItem(item.name, player);
                updateInventoryDisplay(player, updatePlayerStats);
                updatePlayerStats();
            });
            buttonContainer.appendChild(useButton);
        }

        // Button to equip item (for weapons, armor, etc.)
        if (item.type !== "consumable") {
            const equipButton = document.createElement("button");
            equipButton.textContent = "Equip";
            equipButton.addEventListener("click", () => {
                equipItem(item.name, player);
                updateInventoryDisplay(player, updatePlayerStats);
                updatePlayerStats();
            });
            buttonContainer.appendChild(equipButton);
        }

        // Button to sell item (can be used for any item)
        const sellButton = document.createElement("button");
        sellButton.textContent = "Sell";
        sellButton.addEventListener("click", () => {
            sellItem(item.name, player);
            updateInventoryDisplay(player, updatePlayerStats);
            updatePlayerStats();
        });
        buttonContainer.appendChild(sellButton);

        // Append the buttons and item text to the list item
        listItem.appendChild(buttonContainer);
        inventoryList.appendChild(listItem);
    }
}

// Function to get the color based on rarity
function getRarityColor(rarity) {
    switch (rarity.toLowerCase()) {
        case 'common':
            return 'gray';  // Common items in gray
        case 'uncommon':
            return 'green'; // Uncommon items in green
        case 'rare':
            return 'blue';  // Rare items in blue
        case 'epic':
            return 'purple'; // Epic items in purple
        case 'legendary':
            return 'orange'; // Legendary items in orange
        default:
            return 'black';  // Default color for unknown rarities
    }
}

// Function to use an item from the inventory
export function useItem(itemName, player) {
    const itemIndex = player.inventory.findIndex(item => item.name === itemName);
    if (itemIndex !== -1) {
        const item = player.inventory[itemIndex];
        
        // Logic to apply item effects
        if (item.type === "consumable") {
            if (item.effect.type === "heal") {
                player.health = Math.min(player.max_health, player.health + item.effect.value); // Example: Heal by 50
                console.log(`Used a ${item.name}. Health is now ${player.health}.`);
            }
        }
        
        // Remove one item from the inventory
        player.inventory.splice(itemIndex, 1);
        updateInventoryDisplay(player); // Update the inventory display
    }
}

// Function to equip an item
export function equipItem(itemName, player) {
    const itemIndex = player.inventory.findIndex(item => item.name === itemName);
    if (itemIndex !== -1) {
        const item = player.inventory[itemIndex];
        
        // Equip the item based on type (for example, weapons and armor)
        if (item.type === "weapon" && !player.equipment.weapon) {
            // Equip the weapon
            player.equipment.weapon = item;
            console.log(`Equipped ${item.name} as your weapon.`);

            // Update the player's stats (add weapon attack)
            player.attack += item.attack || 0;

        } else if (item.type === "armor") {
            // Check if the armor has a specific slot
            if (item.slot === "head" && !player.equipment.head) {
                player.equipment.head = item;
                console.log(`Equipped ${item.name} as your helmet.`);
                player.defense += item.defense || 0;

            } else if (item.slot === "chest" && !player.equipment.chestplate) {
                player.equipment.chestplate = item;
                console.log(`Equipped ${item.name} as your chestplate.`);
                player.defense += item.defense || 0;

            } else if (item.slot === "legs" && !player.equipment.leggings) {
                player.equipment.leggings = item;
                console.log(`Equipped ${item.name} as your leggings.`);
                player.defense += item.defense || 0;

            } else if (item.slot === "feet" && !player.equipment.feet) {
                player.equipment.feet = item;
                console.log(`Equipped ${item.name} as your boots.`);
                player.defense += item.defense || 0;
                player.speed += item.speed || 0;
            } else {
                console.log(`You cannot equip ${item.name} in the current slot.`);
                return; // Do nothing if the slot is already occupied
            }
        }

        // Remove the item from inventory once equipped
        player.inventory.splice(itemIndex, 1);

        // Update the inventory and equipment display
        updateInventoryDisplay(player);
        updateEquipmentDisplay(player);
    }
}

// Function to sell an item
export function sellItem(itemName, player) {
    const itemIndex = player.inventory.findIndex(item => item.name === itemName);
    if (itemIndex !== -1) {
        const item = player.inventory[itemIndex];
        
        // Sell the item (this example just removes it from inventory)
        player.inventory.splice(itemIndex, 1);
        player.gold += item.price; // Example: Each item sells for 10 gold
        console.log(`Sold ${item.name} for 10 gold. You now have ${player.gold} gold.`);
        
        updateInventoryDisplay(player); // Update the inventory display
    }
}
