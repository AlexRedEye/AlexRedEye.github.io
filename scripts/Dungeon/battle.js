// battle.js
import { updatePlayerStats, updateMonsterStats, generateOpponent } from '../dungeon.js';  // Update player stats
import { levelUp } from './player.js';

let monster;

// Function to calculate damage
function calculateDamage(attacker, defender) {
    let damage = attacker.attack;

    // Check for critical hit
    if (Math.random() < attacker.crit_rate) {
        damage *= attacker.crit_damage;
        console.log(`Critical hit! ${attacker.name} dealt ${damage} damage!`);
    }

    // Apply defense
    damage = Math.max(damage - defender.defense, 0);
    return damage;
}

// Function to handle player's attack
export function playerAttack(player, monster) {
    const damage = calculateDamage(player, monster);
    monster.health -= damage;
    console.log(`Player attacks ${monster.name} for ${damage} damage!`);

    // Check if monster is defeated
    if (monster.health <= 0) {
        monster.health = 0;
        console.log(`${monster.name} has been defeated!`);

        // Reward player with XP and gold
        player.xp += monster.xp_reward;
        levelUp();
        player.gold += monster.gold_reward;
        updatePlayerStats(); // Update player stats with new XP and gold
    }

    // Update the monster stats display
    updateMonsterStats(monster);
}

// Function to handle monster's attack
export function monsterAttack(monster, player) {
    const damage = calculateDamage(monster, player);
    player.health -= damage;
    console.log(`${monster.name} attacks Player for ${damage} damage!`);

    // Check if player is defeated
    if (player.health <= 0) {
        player.health = 0;
        console.log("Player has been defeated!");
        window.location.reload();
    } else {
        playerAttack(player, monster);
    }

    // Update the player stats display
    updatePlayerStats();
}

// Function to initiate combat
export function startBattle(player) {
    if (!monster) {
        monster = generateOpponent();  // Generate a monster only once
    }

    // First, display the starting stats
    updatePlayerStats();
    updateMonsterStats(monster);

    let gameWon = false;

    if (player.speed > monster.speed) {
        playerAttack(player, monster);

        // Check if monster is defeated
        if (monster.health <= 0) {
            gameWon = true;  // Player wins
            monster = generateOpponent();  // Generate a new monster
            updateMonsterStats(monster);
        } else {
            monsterAttack(monster, player);
        }
    } else {
        monsterAttack(monster, player);

        // Check if player is defeated
        if (player.health <= 0) {
            gameWon = false;  // Player loses
            window.location.reload(); // End the battle if the player loses
        } else {
            playerAttack(player, monster);
        }
        // Check if monster is defeated
        if (monster.health <= 0) {
            gameWon = true;  // Player wins
            monster = generateOpponent();  // Generate a new monster
            updateMonsterStats(monster);
        }
    }

    // Return if the player won (true) or lost (false)
    if (gameWon) {
        console.log("Player has won!");
        return true;  // Player won the battle
    } else if (player.health <= 0) {
        console.log("Player has lost!");
        return false; // Player lost the battle
    }
}
