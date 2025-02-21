// player.js

export const player = {
    id: 1,
    name: "Hero",
    level: 1,
    health: 100,
    max_health: 100,
    attack: 10,
    defense: 5,
    speed: 8,
    crit_rate: 0.05,
    crit_damage: 2.0,
    xp: 0,
    gold: 50,
    location: "Dungeon Floor 1",
    status: "active",
    equipment: {
        weapon: null,
        head: null,
        chestplate: null,
        leggings: null,
        feet: null
    },
    inventory: []
};

// Function to level up the player when they have enough XP
export function levelUp() {
    const xpNeeded = player.level * 100;  // Example: 100 XP per level
    if (player.xp >= xpNeeded) {
        player.xp -= xpNeeded;  // Deduct XP after leveling up
        player.level++;  // Increase level
        
        // Increase stats (customize the increments as you like)
        player.max_health += 20;
        player.health = player.max_health;  // Restore health after level-up
        player.attack += 5;
        player.defense += 2;
        
        console.log(`${player.name} leveled up to Level ${player.level}!`);
        
        return true;
    }
    return false;
}
