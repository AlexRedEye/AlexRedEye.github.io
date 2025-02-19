// Player Stats
let playerStats = {
    health: 100,
    attack: 20,
    defense: 15,
    speed: 10,
    critRate: 5,
    critDamage: 50,
    gold: 200,
    xp: 0,
    level: 1,
    levelCap: 10,
    equippedWeapon: null,
    equippedShield: null,
    inventory: []
};

let XP_PER_LEVEL = 100;
let monstersTillNextFloor = 5;

// Leveling System with Dynamic XP increments
function levelUp() {
    while (playerStats.xp >= XP_PER_LEVEL) {  // Use a loop to ensure XP is properly deducted
        playerStats.level += 1;
        playerStats.xp -= XP_PER_LEVEL;
        playerStats.health += 15; // Reduce health growth per level-up
        playerStats.attack += 4;  // Reduce attack growth per level-up
        playerStats.defense += 2; // Reduce defense growth per level-up
        playerStats.speed += 2;
        playerStats.critRate += 1;
        playerStats.critDamage += 5;
        playerStats.levelCap += 5;
        showMessage(`You leveled up to level ${playerStats.level}!`);
        XP_PER_LEVEL = 100 + (playerStats.level * 15);  // XP required increases by 15 per level
    }
    updatePlayerStats();
}


// Monster Stats with adjusted base stats for better balance
const monsterPool = [
    { name: 'X3L4', health: 80, attack: 35, defense: 20, speed: 12, critRate: 8, critDamage: 25 },
    { name: 'Razor Beast', health: 70, attack: 30, defense: 15, speed: 10, critRate: 10, critDamage: 35 },
    { name: 'Venom Drake', health: 85, attack: 32, defense: 18, speed: 9, critRate: 9, critDamage: 40 },
    { name: 'Spectral Knight', health: 90, attack: 34, defense: 20, speed: 11, critRate: 9, critDamage: 35 },
    { name: 'Thunder Fang', health: 120, attack: 40, defense: 25, speed: 15, critRate: 12, critDamage: 50 },
];


const bossPool = [
    { name: 'Dark Warden', health: 80, attack: 22, defense: 14, speed: 11, critRate: 7, critDamage: 35 },
    { name: 'Inferno Beast', health: 90, attack: 25, defense: 15, speed: 9, critRate: 8, critDamage: 40 },
    { name: 'Frost Dragon', health: 100, attack: 28, defense: 16, speed: 8, critRate: 7, critDamage: 45 },
    { name: 'Chaos Serpent', health: 120, attack: 30, defense: 17, speed: 11, critRate: 10, critDamage: 50 },
    { name: 'Abyssal Lord', health: 130, attack: 32, defense: 18, speed: 10, critRate: 12, critDamage: 55 }
];



// Function to scale monsters based on the floor level with gradual stat increase
function scaleMonsterStats(floor) {
    const baseMonster = monsterPool[Math.floor(Math.random() * monsterPool.length)];
    
    // Scaling factor that adjusts for the floor level
    const scalingFactor = 10 + Math.min(0.05 * (floor - 1), 0.3); 


    // Gradually scaling the monster stats to ensure difficulty increases steadily
    const scaledMonster = {
        name: baseMonster.name,
        health: Math.floor(baseMonster.health * scalingFactor),
        attack: Math.floor(baseMonster.attack * scalingFactor),
        defense: Math.floor(baseMonster.defense * scalingFactor),
        speed: Math.floor(baseMonster.speed * scalingFactor),
        critRate: baseMonster.critRate + Math.floor(floor * 0.3), // Slight increase in critRate per floor
        critDamage: baseMonster.critDamage + Math.floor(floor * 1) // Gradual increase in critDamage per floor
    };

    return scaledMonster;
}


// Function to scale monsters based on current floor level
function scaleMonsterStats(floor) {
    const baseMonster = monsterPool[Math.floor(Math.random() * monsterPool.length)];
    
    // Gradual scaling factor
    const scalingFactor = 1 + Math.min(0.1 * (floor - 1), 0.5); // Starts slow and increases up to a max of 1.5x (50% increase)

    const scaledMonster = {
        name: baseMonster.name,
        health: Math.floor(baseMonster.health * scalingFactor),
        attack: Math.floor(baseMonster.attack * scalingFactor),
        defense: Math.floor(baseMonster.defense * scalingFactor),
        speed: Math.floor(baseMonster.speed * scalingFactor),
        critRate: baseMonster.critRate + Math.floor(Math.min(floor * 0.5, 5)), // Increase crit rate more gradually
        critDamage: baseMonster.critDamage + Math.floor(Math.min(floor * 2, 10)) // Increase crit damage more gradually
    };

    return scaledMonster;
}


let monsterStats = { ...monsterPool[0] };

// Update Player Stats
function updatePlayerStats() {
    document.querySelector('.playerStats').innerHTML = `
        <p><strong>Level:</strong> ${playerStats.level}</p>
        <p><strong>XP:</strong> ${playerStats.xp}/${XP_PER_LEVEL}</p>
        <p><strong>Health:</strong> ${playerStats.health}</p>
        <p><strong>Attack:</strong> ${playerStats.attack}</p>
        <p><strong>Defense:</strong> ${playerStats.defense}</p>
        <p><strong>Speed:</strong> ${playerStats.speed}</p>
        <p><strong>Crit Rate:</strong> ${playerStats.critRate}%</p>
        <p><strong>Crit Damage:</strong> ${playerStats.critDamage}%</p>
        <p><strong>Gold:</strong> <span id="gold">${playerStats.gold}</span> 💰</p>
        <p><strong>Equipped Weapon:</strong> ${playerStats.equippedWeapon ? playerStats.equippedWeapon.name : 'None'} <button onclick="unequipItem('weapon')">❌ Unequip</button></p>
        <p><strong>Equipped Shield:</strong> ${playerStats.equippedShield ? playerStats.equippedShield.name : 'None'} <button onclick="unequipItem('shield')">❌ Unequip</button></p>
    `;
}

// Update Monster Stats
function updateMonsterStats() {
    document.querySelector('.monsterStats').innerHTML = `
        <p><strong>Name:</strong> ${monsterStats.name}</p>
        <p><strong>Health:</strong> ${monsterStats.health}</p>
        <p><strong>Attack:</strong> ${monsterStats.attack}</p>
        <p><strong>Defense:</strong> ${monsterStats.defense}</p>
        <p><strong>Speed:</strong> ${monsterStats.speed}</p>
        <p><strong>Crit Rate:</strong> ${monsterStats.critRate}%</p>
        <p><strong>Crit Damage:</strong> ${monsterStats.critDamage}%</p>
    `;
}

// Combat Functions
function attack() {
    let damage = Math.floor(playerStats.attack - monsterStats.defense);
    if (Math.random() * 100 < playerStats.critRate) {
        damage = Math.floor(damage * (1 + playerStats.critDamage / 100));
        showMessage("Critical Hit!");
    }
    monsterStats.health -= Math.max(damage, 0);
    updateMonsterStats();
    monsterAttack();
    checkMonsterHealth();
}

function monsterAttack() {
    let damage = Math.floor(monsterStats.attack - playerStats.defense);  // Fixed the damage calculation
    if (Math.random() * 100 < monsterStats.critRate) {  // Assuming critRate is a monster stat
        damage = Math.floor(damage * (1 + monsterStats.critDamage / 100));  // Assuming critDamage is a monster stat
        showMessage("Critical Hit!");
    }
    playerStats.health -= Math.max(damage, 0);  // Avoid negative damage
    updatePlayerStats();
    checkPlayerHealth();
}


function showMessage(message) {
    const messageElement = document.querySelector('#combat-message');
    if (messageElement) {
        messageElement.textContent = message;
        setTimeout(() => messageElement.textContent = '', 2000);
    }
}
function checkMonsterHealth() {
    if (monsterStats.health <= 0) {
        showMessage('Monster defeated!');
        playerStats.gold += Math.max(25, Math.floor(monsterStats.health / 10)); // Scale gold with monster's health
        playerStats.xp += 10; // Award XP for defeating the monster
        updatePlayerStats();
        levelUp(); // Check if player leveled up

        monstersDefeated += 1; // Increment the number of defeated monsters

        // Every 5 monsters defeated, increase the floor level
        if (monstersDefeated >= monstersTillNextFloor) {
            floorLevel += 1;
            monstersDefeated = 0; // Reset monster count after increasing floor level
            monstersTillNextFloor += 5;
            updateFloorLevel(); // Update the floor in the title
        }

        // Scale the monster for the next floor
        monsterStats = scaleMonsterStats(floorLevel);
        updateMonsterStats();
    }
}

function checkPlayerHealth() {
    if (playerStats.health <= 0) {
        showMessage('You were defeated!');
        restartGame();
    }
}

// Floor and Monster Progression
let floorLevel = 1;
let monstersDefeated = 0;

function updateFloorLevel() {
    const floorTitle = document.querySelector('header h1');
    floorTitle.textContent = `Eternal Void: F${floorLevel}`;
}

function handleFloorProgression() {
    monstersDefeated += 1;
    
    // Check if it's the last monster of the floor
    if (monstersDefeated >= monstersTillNextFloor) {
        // Select a boss for the last monster
        selectNewBoss();
        
        floorLevel += 1;
        monstersDefeated = 0;
        monstersTillNextFloor += Math.floor(2 + floorLevel * 0.5);
        updateFloorLevel();
    } else {
        // Select a regular monster
        selectNewMonster();
    }
}

function selectNewMonster() {
    let randomMonster = monsterPool[Math.floor(Math.random() * monsterPool.length)];
    monsterStats = scaleMonsterStats(floorLevel);
    updateMonsterStats();
}

function selectNewBoss() {
    let randomBoss = bossPool[Math.floor(Math.random() * bossPool.length)];
    monsterStats = scaleMonsterStats(floorLevel);
    updateMonsterStats();
}


// Restart Game
function restartGame() {
    playerStats = { health: 100, attack: 20, defense: 15, speed: 10, critRate: 5, critDamage: 50, gold: 500, level: 1, levelCap: 10, equippedWeapon: null, equippedShield: null, inventory: [] };
    monsterStats = { ...monsterPool[0] };
    updatePlayerStats();
    updateMonsterStats();
    updateInventory();
    showMessage('Game has been restarted!');
    window.location.reload();
}

function dodge() {
    const dodgeChance = Math.min(10, playerStats.speed / (playerStats.speed + monsterStats.speed) * 100); // cap dodge chance at 10%
    if (Math.random() * 100 < dodgeChance) {
        showMessage("You dodged the attack!");
    } else {
        showMessage("You failed to dodge!");
        monsterAttack(); // Continue the monster's attack if dodge fails
    }
}

// Item Management
function unequipItem(itemType) {
    if (itemType === 'weapon' && playerStats.equippedWeapon) {
        removeItemEffect(playerStats.equippedWeapon);
        playerStats.inventory.push(playerStats.equippedWeapon);
        playerStats.equippedWeapon = null;
    } else if (itemType === 'shield' && playerStats.equippedShield) {
        removeItemEffect(playerStats.equippedShield);
        playerStats.inventory.push(playerStats.equippedShield);
        playerStats.equippedShield = null;
    } else {
        showMessage('Nothing to unequip!');
    }
    updatePlayerStats();
    updateInventory();
}

function removeItemEffect(item) {
    if (item.type === 'weapon') {
        playerStats.attack -= item.effectValue || 0;
    } else if (item.type === 'shield') {
        playerStats.defense -= item.effectValue || 0;
    }
}

// Item Generation (Gacha) with Rarity Weights
function getRandomItem() {
    const items = [
        { name: 'Sword of Flames', type: 'weapon', effectValue: 10, rarity: 'common', effect: () => showMessage('You received the Sword of Flames!') },
        { name: 'Sword of Shadows', type: 'weapon', effectValue: 15, rarity: 'rare', effect: () => showMessage('You received the Sword of Shadows!') },
        { name: 'Excalibur', type: 'weapon', effectValue: 30, rarity: 'legendary', effect: () => showMessage('You received Excalibur!') },
        { name: 'Silver Blade', type: 'weapon', effectValue: 20, rarity: 'rare', effect: () => showMessage('You received the Silver Blade!') },
        { name: 'Dragon Slayer', type: 'weapon', effectValue: 40, rarity: 'legendary', effect: () => showMessage('You received the Dragon Slayer!') },
        { name: 'Shield of the Ancients', type: 'shield', effectValue: 10, rarity: 'common', effect: () => showMessage('You received the Shield of the Ancients!') },
        { name: 'Aegis Shield', type: 'shield', effectValue: 20, rarity: 'rare', effect: () => showMessage('You received the Aegis Shield!') },
        { name: 'Phoenix Shield', type: 'shield', effectValue: 40, rarity: 'legendary', effect: () => showMessage('You received the Phoenix Shield!') },
        { name: 'Titan Shield', type: 'shield', effectValue: 30, rarity: 'legendary', effect: () => showMessage('You received the Titan Shield!') },
        { name: 'Obsidian Shield', type: 'shield', effectValue: 25, rarity: 'rare', effect: () => showMessage('You received the Obsidian Shield!') },
        { name: 'Health Potion', type: 'potion', effectValue: 30, rarity: 'common', effect: () => showMessage('You received a Health Potion!') },
        { name: 'Greater Health Potion', type: 'potion', effectValue: 50, rarity: 'rare', effect: () => showMessage('You received a Greater Health Potion!') },
        { name: 'Fire Scroll', type: 'scroll', effectValue: 20, rarity: 'common', effect: () => showMessage('You received a Fire Scroll!') },
        { name: 'Ice Scroll', type: 'scroll', effectValue: 25, rarity: 'rare', effect: () => showMessage('You received an Ice Scroll!') },
        { name: 'Storm Scroll', type: 'scroll', effectValue: 40, rarity: 'legendary', effect: () => showMessage('You received a Storm Scroll!') },
        { name: 'Arcane Scroll', type: 'scroll', effectValue: 30, rarity: 'rare', effect: () => showMessage('You received an Arcane Scroll!') }
    ];

    // Define rarity weights
    const rarityWeights = {
        common: 0.8,  
        rare: 0.15,   
        legendary: 0.05  
    };

    // Create a cumulative weight array
    const cumulativeWeights = [];
    let totalWeight = 0;

    for (const item of items) {
        totalWeight += rarityWeights[item.rarity];
        cumulativeWeights.push(totalWeight);
    }

    // Generate a random number and find the corresponding item
    const randomChoice = Math.random() * totalWeight;
    let chosenItem = null;

    for (let i = 0; i < items.length; i++) {
        if (randomChoice < cumulativeWeights[i]) {
            chosenItem = items[i];
            break;
        }
    }

    return chosenItem;
}



document.querySelector('.gacha-btn').addEventListener('click', () => {
    if (playerStats.gold >= 100) {
        playerStats.gold -= 100;
        updatePlayerStats();
        let randomItem = getRandomItem();
        playerStats.inventory.push(randomItem);
        updateInventory();
        document.querySelector('#gacha-result').textContent = `You rolled: ${randomItem.name}`;
    } else {
        showMessage('Not enough gold!');
    }
});

// Inventory UI Update
function updateInventory() {
    const inventoryList = document.getElementById('inventory-list');
    inventoryList.innerHTML = '';
    playerStats.inventory.forEach((item, index) => {
        const itemElement = document.createElement('li');
        itemElement.innerHTML = `${item.name} <button onclick="equipItem(${index})">Equip</button> <button onclick="sellItem(${index})">Sell</button>`;
        if (item.type === 'potion' || item.type === 'scroll') {
            itemElement.innerHTML = `${item.name} <button onclick="useItem(${index})">Use</button> <button onclick="sellItem(${index})">Sell</button>`;
        }
        inventoryList.appendChild(itemElement);
    });
}

function useItem(index) {
    const item = playerStats.inventory[index];
    if (item.type === 'potion') {
        playerStats.health = Math.min(100, playerStats.health + item.effectValue);
        showMessage(`You used a Health Potion! Health restored by ${item.effectValue}.`);
    } else if (item.type === 'scroll') {
        monsterStats.health -= item.effectValue;
        showMessage(`You used the Fire Scroll! Monster health decreased by ${item.effectValue}.`);
    }
    playerStats.inventory.splice(index, 1);
    updatePlayerStats();
    updateMonsterStats();
    updateInventory();
}

function equipItem(index) {
    const item = playerStats.inventory[index];
    if (item.type === 'weapon') {
        if (playerStats.equippedWeapon) unequipItem('weapon');
        playerStats.equippedWeapon = item;
        playerStats.attack += item.effectValue;
        item.effect();
    } else if (item.type === 'shield') {
        if (playerStats.equippedShield) unequipItem('shield');
        playerStats.equippedShield = item;
        playerStats.defense += item.effectValue;
        item.effect();
    }
    playerStats.inventory.splice(index, 1);
    updatePlayerStats();
    updateInventory();
}

function sellItem(index) {
    const item = playerStats.inventory[index];
    playerStats.gold += 50;
    playerStats.inventory.splice(index, 1);
    showMessage(`Sold ${item.name} for 50 gold.`);
    updatePlayerStats();
    updateInventory();
}

// Initialize Game
function init() {
    let randomMonster = monsterPool[Math.floor(Math.random() * monsterPool.length)];
    monsterStats = { ...randomMonster };
    updatePlayerStats();
    updateMonsterStats();
    updateInventory();
}

// Event Listeners
document.querySelector('.attack-btn').addEventListener('click', attack);
document.querySelector('.dodge-btn').addEventListener('click', dodge);

// Start the game
window.onload = init;
