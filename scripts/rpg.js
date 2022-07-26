let playerHealthEl = document.getElementById("playerHealth-el");
let playerLevelEl = document.getElementById("playerLvl-el");
let goldEl = document.getElementById("gold-el");
let expEl = document.getElementById("exp-el");
let potionInvEl = document.getElementById("potion-inv-el");
let atkPwrEl = document.getElementById("atk-pwr-el");
let enemyHealthEl = document.getElementById("enemyHealth-el");
let enemyNameEl = document.getElementById("enemyName-el");
let atkBtn = document.getElementById("atk-btn");
let playerName = document.getElementById("playerName");
let goblinsEl = document.getElementById("goblins-el");
let ogresEl = document.getElementById("ogres-el");
let witchesEl = document.getElementById("witches-el");
let usernameBoxEl = document.getElementById("usernameBox-el");
let camImg = document.getElementById("cam-img");

//Dev Cheats
let expBtn = document.getElementById("exp-btn");
let cheatAtk = document.getElementById("cheatAtk-btn");

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
let goblinsKilled = 0;
let ogresKilled = 0;
let witchesKilled = 0;

let currentMonster = 1;

window.onload = function() 
{
    currentMonster = monsterChoose();
    playerName.textContent = localStorage.getItem("username");
    goblinsEl.textContent = "Goblins Killed: " + goblinsKilled;
    witchesEl.textContent = "Witches Killed: " + witchesKilled;
    ogresEl.textContent = "Ogres Killed: " + ogresKilled;

    if (currentMonster === 1)
    {
        enemyHealthEl.textContent = "Enemy Health: " + goblin.health;
        enemyNameEl.textContent = goblin.name
        camImg.src = "images/Goblin01.png"
    }else if(currentMonster === 2 && playerLevel >= 3)
    {
        enemyHealthEl.textContent = "Enemy Health: " + ogre.health;
        enemyNameEl.textContent = ogre.name
        camImg.src = "images/ogre.jpg"
    }else if(currentMonster === 3 && playerLevel >= 6)
    {
        enemyHealthEl.textContent = "Enemy Health: " + witch.health;
        enemyNameEl.textContent = witch.name
        camImg.src = "images/PromoWitch.jpg"
    }else
    {
        enemyHealthEl.textContent = "Enemy Health: " + goblin.health;
        enemyNameEl.textContent = goblin.name
    }

    setInterval(isDeadCheck, 1000/10);
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
let witch = new Monster("Witch", 40, 40, 7);


healBtn.addEventListener("click", function()
{
    if(potionAmount > 0 && playerHealth < 100)
    {
        playerHealth = potion;
        potionAmount -= 1;
    }

    playerHealthEl.textContent = "Health: " + playerHealth;
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

    if (playerHealth <= 0)
    {
        window.location.href = "rpg.html"
    }

    if (exp >= 100 && playerLevel === 1)
    {
        gold += 25;
        playerLevel += 1;
        exp = 0;
    }

    if (exp >= 115 && playerLevel === 2)
    {
        gold += 50;
        playerLevel += 1;
        exp = 0;
    }

    if (exp >= 125 && playerLevel === 3)
    {
        gold += 60;
        playerLevel += 1;
        exp = 0;
    }

    if (exp >= 135 && playerLevel === 4)
    {
        gold += 65;
        playerLevel += 1;
        exp = 0;
    }

    if (exp >= 145 && playerLevel === 5)
    {
        gold += 70;
        playerLevel += 1;
        exp = 0;
    }

    if (exp >= 155 && playerLevel === 6)
    {
        gold += 75;
        playerLevel += 1;
        exp = 0;
    }



    if(currentMonster === 1)
    {
        camImg.src = "images/Goblin01.png"
        goblinFight();
    }else if(currentMonster === 2 && playerLevel >= 3)
    {
        camImg.src = "images/ogre.jpg"
        ogreFight();
    }else if(currentMonster === 3 && playerLevel >= 6)
    {
        "images/PromoWitch.jpg"
        witchFight();
    }else
    {
        goblinFight();
    }

    playerHealthEl.textContent = "Health: " + playerHealth;
    goldEl.textContent = "Gold: " + gold
    playerLevelEl.textContent = "Level: " + playerLevel;
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
        gold -= 100;
    }

    atkPwrEl.textContent = "(" + playerMaxAttack + ")";
    goldEl.textContent = "Gold: " + gold
})

function randomNum()
{
    let ranNum = Math.floor(Math.random() * 4)

    return ranNum
}

function monsterChoose()
{
    let ranMon = Math.floor(Math.random() * 4)

    return ranMon
}

//expBtn.addEventListener("click", function()
//{
//    playerLevel += 1;
//    exp = 0;
//    playerLevelEl.textContent = "Player Level: " + playerLevel;
//    expEl.textContent = "Experience: " + exp;
//})

//cheatAtk.addEventListener("click", function()
//{
//    playerMaxAttack = 50;
//    atkPwrEl.textContent = "(" + playerMaxAttack + ")";
//})

function isDeadCheck()
{
    if (playerHealth <= 0)
    {
        window.location.href = "rpg.html"
    }
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
        exp += 5;
        gold += 5;
        expEl.textContent = "Experience: " + exp;

        currentMonster = monsterChoose();

        goblin.health = goblin.maxHealth;
        goblinsKilled += 1;
    }


    enemyHealthEl.textContent = "Enemy Health: " + goblin.health;
    enemyNameEl.textContent = goblin.name;
    goblinsEl.textContent = "Goblins Killed: " + goblinsKilled;
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
        exp += 15;
        gold += 13;
        expEl.textContent = "Experience: " + exp;

        currentMonster = monsterChoose();

        ogre.health = ogre.maxHealth;
        ogresKilled += 1;
    }



    enemyHealthEl.textContent = "Enemy Health: " + ogre.health;
    enemyNameEl.textContent = ogre.name;
    ogresEl.textContent = "Ogres Killed: " + ogresKilled;
}

function witchFight()
{
    if (randomNum() === 1)
    {
        witch.attack = 5
    } else if (randomNum() === 2)
    {
        witch.attack = 6
    } else if(randomNum() === 3)
    {
        witch.attack = 7
    } else if (randomNum() === 0)
    {
        witch.attack = 5
    }

    playerHealth -= witch.attack;
    witch.health -= playerAttack;

    if (witch.health <= 0)
    {
        exp += 20;
        gold += 15;
        expEl.textContent = "Experience: " + exp;

        currentMonster = monsterChoose();

        witch.health = witch.maxHealth;
        witchesKilled += 1;
    }



    enemyHealthEl.textContent = "Enemy Health: " + witch.health;
    enemyNameEl.textContent = witch.name;
    witchesEl.textContent = "Witches Killed: " + witchesKilled;
}