// dungeon.js main file
import { summonItem, addToInventory } from './Dungeon/gacha.js';
import { player } from './Dungeon/player.js';
import { updateInventoryDisplay } from './Dungeon/inventory.js';
import { updateEquipmentDisplay } from './Dungeon/equipment.js';
import { startBattle } from './Dungeon/battle.js';

let monsterPool = [];
let bossPool = [];

// Load Monsters from json
async function loadMonsters() {
    try {
        const response = await fetch('../json/monsters.json');
        const data = await response.json();
        monsterPool = data.monsters;  // Store the monsters in the monster pool
        console.log("Monsters loaded:", monsterPool);
    } catch (error) {
        console.error("Error loading monsters:", error);
    }
}

// Load Bosses from json
async function loadBosses() {
    try {
        const response = await fetch('../json/monsters.json');
        const data = await response.json();
        bossPool = data.bosses;  // Store the bosses in the boss pool
        console.log("Bosses loaded:", bossPool);
    } catch (error) {
        console.error("Error loading bosses:", error);
    }
}

let floor = 1;
let monstersDefeated = 0;
let floorCap = 5;
let gachaPrice = 15;

// Generate opponent
export function generateOpponent() {
    let opponent = null;

    // Check if it's the last monster on the floor
    if (monstersDefeated + 1 >= floorCap) {
        if (bossPool.length === 0) {
            console.error("No bosses available!");
            return null;
        }
        // Select a random boss
        const randomIndex = Math.floor(Math.random() * bossPool.length);
        const selectedMonster = bossPool[randomIndex];
        console.log("Boss fight initiated!");

        opponent = {
            id: selectedMonster.id,
            name: selectedMonster.name,
            level: selectedMonster.level,
            health: selectedMonster.health,
            attack: selectedMonster.attack,
            defense: selectedMonster.defense,
            speed: selectedMonster.speed,
            crit_rate: selectedMonster.crit_rate,
            crit_damage: selectedMonster.crit_damage,
            xp_reward: selectedMonster.xp_reward,
            gold_reward: selectedMonster.gold_reward,
            description: selectedMonster.description,
            isBoss: false,
        };
    } else {
        if (monsterPool.length === 0) {
            console.error("No monsters available!");
            return null;
        }
        // Select a random monster
        const randomIndex = Math.floor(Math.random() * monsterPool.length);
        const selectedMonster = monsterPool[randomIndex];

        opponent = {
            id: selectedMonster.id,
            name: selectedMonster.name,
            level: selectedMonster.level,
            health: selectedMonster.health,
            attack: selectedMonster.attack,
            defense: selectedMonster.defense,
            speed: selectedMonster.speed,
            crit_rate: selectedMonster.crit_rate,
            crit_damage: selectedMonster.crit_damage,
            xp_reward: selectedMonster.xp_reward,
            gold_reward: selectedMonster.gold_reward,
            description: selectedMonster.description,
            isBoss: false,
        };
    }

    console.log("Generated Opponent:", opponent);
    return opponent;
}


// Function to display player stats (example usage)
export function updatePlayerStats() {
    // Base stats
    const baseHealth = player.baseHealth || 100; // Example: set base health if not set
    const baseAttack = player.baseAttack || 10; // Example: set base attack if not set
    const baseDefense = player.baseDefense || 5; // Example: set base defense if not set

    // Display stats with modifiers
    document.getElementById("floor").textContent = floor;
    document.getElementById("player-level").textContent = player.level;
    document.getElementById("player-xp").textContent = player.xp;
    document.getElementById("player-health").textContent = `${player.health} (${getStatModifier(player.health, baseHealth)})`;
    document.getElementById("player-gold").textContent = player.gold;
    document.getElementById("player-attack").textContent = `${player.attack} (${getStatModifier(player.attack, baseAttack)})`;
    document.getElementById("player-defense").textContent = `${player.defense} (${getStatModifier(player.defense, baseDefense)})`;
}

// Helper function to calculate and format the stat modifier
function getStatModifier(stat, baseStat) {
    const modifier = stat - baseStat;
    return modifier > 0 ? `+${modifier}` : (modifier < 0 ? `${modifier}` : ''); // Format as +15 or -5, or nothing if no modifier
}


// Function to display monster stats (example usage)
export function updateMonsterStats(monster) {
    document.getElementById("monster-name").textContent = monster.name;
    document.getElementById("monster-level").textContent = monster.level;
    document.getElementById("monster-health").textContent = monster.health;
    document.getElementById("monster-attack").textContent = monster.attack;
    document.getElementById("monster-defense").textContent = monster.defense;
}

// Function to update inventory display
function refreshDisplays() {
    updateInventoryDisplay(player, updatePlayerStats);
    updateEquipmentDisplay(player, updatePlayerStats);
}

// Attach the event listener to the 'Summon' button
document.getElementById("gacha-button").addEventListener("click", () => {
    if (player.gold >= gachaPrice) {
        player.gold -= gachaPrice;
        const newItem = summonItem();
        addToInventory(newItem, player);
    
        // Update the player's inventory and stats
        refreshDisplays();
        updatePlayerStats();
        console.log(newItem); // For debugging: output the item summoned
    }
});

// Attach the event listener to the 'Attack' button
document.getElementById("attack-button").addEventListener("click", () => {
    if (startBattle(player) == true) {
        monstersDefeated++;
        console.log("Monsters defeated this floor:", monstersDefeated); // Debugging line
        
        if (monstersDefeated >= floorCap) {
            floor++;
            monstersDefeated = 0; // Reset defeated monsters for the next floor
            floorCap += 3;  // Increase the floor cap for the next floor
            console.log("Moving to next floor:", floor); // Debugging line
        }
    }
});



// Call this to initially display player stats and inventory and Load Entities
loadMonsters();
loadBosses();
updatePlayerStats();
refreshDisplays();
