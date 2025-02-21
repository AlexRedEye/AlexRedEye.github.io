//equipment.js
import { updatePlayerStats } from '../dungeon.js';
import { updateInventoryDisplay } from './inventory.js';

// Function to display the equipment (weapon, armor, etc.)
export function updateEquipmentDisplay(player, updatePlayerStats) {
    const equipmentList = document.getElementById("equipment-list");
    equipmentList.innerHTML = ''; // Clear the current list

    // Loop through all equipment slots
    for (const slot in player.equipment) {
        const item = player.equipment[slot];
        const listItem = document.createElement("li");

        // Display the equipment name or "Empty" if no item is equipped
        if (item) {
            listItem.textContent = `${slot.charAt(0).toUpperCase() + slot.slice(1)}: ${item.name}`;
            
            // Create a button to unequip items (only if item is equipped)
            const unequipButton = document.createElement("button");
            unequipButton.textContent = `Unequip ${slot.charAt(0).toUpperCase() + slot.slice(1)}`;
            unequipButton.addEventListener("click", () => {
                unequipItemToInventory(slot, player, updateInventoryDisplay, updatePlayerStats); // Pass both update functions
            });

            listItem.appendChild(unequipButton);  // Add the unequip button to the list item
        } else {
            listItem.textContent = `${slot.charAt(0).toUpperCase() + slot.slice(1)}: Empty`;
        }

        equipmentList.appendChild(listItem);
    }
}

// Function to unequip an item from a specific equipment slot and send it back to inventory
export function unequipItemToInventory(slot, player, updateInventoryDisplay) {
    const itemToUnequip = player.equipment[slot];
    
    if (itemToUnequip) {
        // Add the item back to the inventory
        player.inventory.push(itemToUnequip);
        
        // Remove the item from equipment slot
        player.equipment[slot] = null;
        console.log(`Unequipped ${itemToUnequip.name} from ${slot} and sent back to inventory.`);

        // Update the player's stats (subtract the item stats)
        if (itemToUnequip.type === "weapon") {
            player.attack -= itemToUnequip.attack || 0;
        } else if (itemToUnequip.type === "armor") {
            player.defense -= itemToUnequip.defense || 0;
        }

        // Update inventory and equipment display
        updateInventoryDisplay(player, updatePlayerStats);
        updateEquipmentDisplay(player, updatePlayerStats);
        
        // Update the player stats after unequipping
        updatePlayerStats();
    }
}
