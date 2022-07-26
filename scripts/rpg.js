let playerHealthEl = document.getElementById("playerHealth-el");
let playerLevelEl = document.getElementById("playerLvl-el");
let goldEl = document.getElementById("gold-el");
let expEl = document.getElementById("exp-el");
let enemyHealthEl = document.getElementById("enemyHealth-el");
let enemyNameEl = document.getElementById("enemyName-el");

const attackBtn = document.getElementById("attack-btn");
const healBtn = document.getElementById("heal-btn");
const potionBtn = document.getElementById("potion-btn");

let playerMaxHealth = 100;
let playerHealth = 100;
let playerLevel = 1;
let gold = 0;
let exp = 0;
let playerAttack = randomNum();
let potion = playerMaxHealth;
let potionAmount = 3;

window.onload = function() 
{
    enemyHealthEl.textContent = "Enemy Health: " + goblin.health;
}

class Monster {
    constructor(name, health, maxHealth,attack) 
    {
        this.name = name;
        this.health = health;
        this.maxHealth = maxHealth;
        this.attack = attack;
    }
}

let goblin = new Monster("Goblin", 30, 30, 3);

healBtn.addEventListener("click", function()
{
    if(potionAmount > 0 && playerHealth < 100)
    {
        playerHealth = potion;
        potionAmount -= 1;
    }

    playerHealthEl.textContent = "Player Health: " + playerHealth;
})

attackBtn.addEventListener("click", function()
{
    playerHealth -= goblin.attack;
    goblin.health -= playerAttack;

    if (randomNum() === 1)
    {
        playerAttack = 3
    } else if (randomNum() === 2)
    {
        playerAttack = 4
    } else if(randomNum() === 3)
    {
        playerAttack = 5
    } else if (randomNum() === 0)
    {
        playerAttack = 3
    }

    if (randomNum() === 1)
    {
        goblin.attack = 1
    } else if (randomNum() === 2)
    {
        goblin.attack = 2
    } else if(randomNum() === 3)
    {
        goblin.attack = 3
    } else if (randomNum() === 0)
    {
        goblin.attack = 1
    }

    if (goblin.health <= 0)
    {
        exp += 25;
        gold += 3;
        expEl.textContent = "Experience: " + exp;

        goblin.health = goblin.maxHealth;
    }

    if (playerHealth < 0)
    {
        window.location.href = "rpg.html"
    }

    if (exp >= 100)
    {
        gold += 25;
        playerLevel += 1;
        exp = 0;
    }

    playerHealthEl.textContent = "Player Health: " + playerHealth;
    goldEl.textContent = "Gold: " + gold
    enemyHealthEl.textContent = "Enemy Health: " + goblin.health;
    playerLevelEl.textContent = "Player Level: " + playerLevel;
    expEl.textContent = "Experience: " + exp;
    enemyNameEl.textContent = goblin.name;
})

potionBtn.addEventListener("click", function()
{
    if(gold >= 50)
    {
        potionAmount += 1;
        gold -= 50;
    }

    goldEl.textContent = "Gold: " + gold;
})

function randomNum()
{
    let ranNum = Math.floor(Math.random() * 4)

    return ranNum
}
