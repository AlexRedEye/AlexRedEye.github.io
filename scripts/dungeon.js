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

// Function to determine monster level range per floor
function getLevelRange(floor) {
    const minLevel = Math.max(1, Math.floor(floor * 1.5));  // Floor 1 → Level 1-2, Floor 5 → Level 7-8
    const maxLevel = minLevel + 2; // Monsters can be 2 levels higher than the minimum
    return { min: minLevel, max: maxLevel };
}

// Function to scale monster stats based on their level
function scaleMonsterStats(baseStats, level) {
    const scalingFactor = 1 + (level * 0.1); // Increase stats by 10% per level
    return {
        health: Math.floor(baseStats.health * scalingFactor),
        attack: Math.floor(baseStats.attack * scalingFactor),
        defense: Math.floor(baseStats.defense * scalingFactor),
        speed: Math.floor(baseStats.speed * scalingFactor),
        crit_rate: baseStats.crit_rate,  // Keep crit rate the same
        crit_damage: baseStats.crit_damage, // Keep crit damage the same
        xp_reward: Math.floor(baseStats.xp_reward * scalingFactor),
        gold_reward: Math.floor(baseStats.gold_reward * scalingFactor),
    };
}

// Generate an opponent based on floor difficulty
export function generateOpponent() {
    if (monsterPool.length === 0 || bossPool.length === 0) {
        console.error("Monster or boss pool is empty!");
        return null;
    }

    const { min, max } = getLevelRange(floor);
    const monsterLevel = Math.floor(Math.random() * (max - min + 1)) + min; // Random level in range

    let opponent = null;

    // Boss fight on last monster of the floor
    if (monstersDefeated + 1 >= floorCap) {
        const randomIndex = Math.floor(Math.random() * bossPool.length);
        const baseStats = bossPool[randomIndex];

        opponent = {
            ...baseStats,
            level: monsterLevel + 2, // Bosses are 2 levels higher than floor monsters
            ...scaleMonsterStats(baseStats, monsterLevel + 2),
            isBoss: true,
        };

        console.log("Boss fight initiated!");
    } else {
        const randomIndex = Math.floor(Math.random() * monsterPool.length);
        const baseStats = monsterPool[randomIndex];

        opponent = {
            ...baseStats,
            level: monsterLevel,
            ...scaleMonsterStats(baseStats, monsterLevel),
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
