let playerHealthEl = document.getElementById("playerHealth-el");
let playerLevelEl = document.getElementById("playerLvl-el");
let goldEl = document.getElementById("gold-el");
let expEl = document.getElementById("exp-el");
let potionInvEl = document.getElementById("potion-inv-el");
let atkPwrEl = document.getElementById("atk-pwr-el");
let enemyHealthEl = document.getElementById("enemyHealth-el");
let enemyNameEl = document.getElementById("enemyName-el");
let atkBtn = document.getElementById("atk-btn");

const attackBtn = document.getElementById("attack-btn");
const healBtn = document.getElementById("heal-btn");
const potionBtn = document.getElementById("potion-btn");

let playerMaxHealth = 100;
let playerHealth = 100;
let playerLevel = 1;
let gold = 0;
let exp = 0;
let playerMaxAttack = 5;
let playerAttack = playerMaxAttack;
let potion = playerMaxHealth;
let potionAmount = 3;

let currentMonster = 1;

window.onload = function() 
{
    currentMonster = monsterChoose();

    if (currentMonster === 1)
    {
        enemyHealthEl.textContent = "Enemy Health: " + goblin.health;
        enemyNameEl.textContent = goblin.name
    }else if(currentMonster === 2 && playerLevel >= 3)
    {
        enemyHealthEl.textContent = "Enemy Health: " + ogre.health;
        enemyNameEl.textContent = ogre.name
    }else
    {
        enemyHealthEl.textContent = "Enemy Health: " + goblin.health;
        enemyNameEl.textContent = goblin.name
    }
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
let ogre = new Monster("Ogre", 50, 50, 5);

healBtn.addEventListener("click", function()
{
    if(potionAmount > 0 && playerHealth < 100)
    {
        playerHealth = potion;
        potionAmount -= 1;
    }

    playerHealthEl.textContent = "Player Health: " + playerHealth;
    potionInvEl.textContent = "(" + potionAmount + ")"
})

attackBtn.addEventListener("click", function()
{
    if (randomNum() === 1)
    {
        playerAttack = playerMaxAttack - 2
    } else if (randomNum() === 2)
    {
        playerAttack = playerMaxAttack - 1
    } else if(randomNum() === 3)
    {
        playerAttack = playerMaxAttack
    } else if (randomNum() === 0)
    {
        playerAttack = 3
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

    if(currentMonster === 1)
    {
        goblinFight();
    }else if(currentMonster === 2 && playerLevel >= 3)
    {
        ogreFight();
    }else
    {
        goblinFight();
    }

    playerHealthEl.textContent = "Player Health: " + playerHealth;
    goldEl.textContent = "Gold: " + gold
    playerLevelEl.textContent = "Player Level: " + playerLevel;
    expEl.textContent = "Experience: " + exp;
    atkPwrEl.textContent = "(" + playerMaxAttack + ")";
})

potionBtn.addEventListener("click", function()
{
    if(gold >= 50)
    {
        potionAmount += 1;
        gold -= 50;
    }

    goldEl.textContent = "Gold: " + gold;
    potionInvEl.textContent = "(" + potionAmount + ")"
})

atkBtn.addEventListener("click", function()
{
    if(gold >= 100)
    {
        playerMaxAttack += 2;
        playerAttack += 2;
    }

    atkPwrEl.textContent = "(" + playerMaxAttack + ")";
})

function randomNum()
{
    let ranNum = Math.floor(Math.random() * 4)

    return ranNum
}

function monsterChoose()
{
    let ranMon = Math.floor(Math.random() * 3)

    return ranMon
}

function goblinFight()
{
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

    playerHealth -= goblin.attack;
    goblin.health -= playerAttack;

    if (goblin.health <= 0)
    {
        exp += 25;
        gold += 3;
        expEl.textContent = "Experience: " + exp;

        currentMonster = monsterChoose();

        goblin.health = goblin.maxHealth;
    }



    enemyHealthEl.textContent = "Enemy Health: " + goblin.health;
    enemyNameEl.textContent = goblin.name;
}

function ogreFight()
{
    if (randomNum() === 1)
    {
        ogre.attack = 3
    } else if (randomNum() === 2)
    {
        ogre.attack = 4
    } else if(randomNum() === 3)
    {
        ogre.attack = 5
    } else if (randomNum() === 0)
    {
        ogre.attack = 3
    }

    playerHealth -= ogre.attack;
    ogre.health -= playerAttack;

    if (ogre.health <= 0)
    {
        exp += 25;
        gold += 3;
        expEl.textContent = "Experience: " + exp;

        currentMonster = monsterChoose();

        ogre.health = ogre.maxHealth;
    }



    enemyHealthEl.textContent = "Enemy Health: " + ogre.health;
    enemyNameEl.textContent = ogre.name;
}
