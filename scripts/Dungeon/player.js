// player.js

export const player = {
    id: 1,
    name: "Pocket Friend",
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

export function levelUp() {
    const xpNeeded = Math.floor(100 * Math.pow(1.2, player.level)); // Scales XP exponentially
    if (player.xp >= xpNeeded) {
        player.xp -= xpNeeded;  
        player.level++;  
        
        // Percentage-based stat increases for smoother scaling
        player.max_health = Math.floor(player.max_health * 1.1); // 10% increase
        player.health = player.max_health;  
        player.attack = Math.floor(player.attack * 1.08); // 8% increase
        player.defense = Math.floor(player.defense * 1.05); // 5% increase
        
        // Bonus stat points for more variability (random within a range)
        const bonusAttack = Math.floor(Math.random() * 3) + 1;  // +1 to 3 attack
        const bonusDefense = Math.floor(Math.random() * 2) + 1; // +1 to 2 defense
        
        player.attack += bonusAttack;
        player.defense += bonusDefense;

        console.log(`${player.name} leveled up to Level ${player.level}!`);
        console.log(`+${bonusAttack} Attack, +${bonusDefense} Defense`);
        console.log(`New Stats - Health: ${player.max_health}, Attack: ${player.attack}, Defense: ${player.defense}`);

        return true;
    }
    return false;
}

