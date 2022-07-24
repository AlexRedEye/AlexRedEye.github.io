let playerHealthEl = document.getElementById("playerHealth-el");
let playerLevelEl = document.getElementById("playerLvl-el");
let goldEl = document.getElementById("gold-el");
let expEl = document.getElementById("exp-el");
let enemyHealthEl = document.getElementById("enemyHealth-el");


const attackBtn = document.getElementById("attack-btn");
const healBtn = document.getElementById("heal-btn");

let playerMaxHealth = 100;
let playerHealth = 100;
let playerLevel = 1;
let gold = 0;
let exp = 0;
let playerAttack = 5;
let potion = playerMaxHealth;

let enemyHealth = 100;
const enemyAttack = 3;

function randomNum()
{
    let ranNum = Math.floor(Math.random() * 4)

    return ranNum
}



healBtn.addEventListener("click", function()
{
    playerHealth = potion;

    playerHealthEl.textContent = "Player Health: " + playerHealth;
})

attackBtn.addEventListener("click", function()
{
    playerHealth -= enemyAttack;
    enemyHealth -= playerAttack;

    if (enemyHealth <= 0)
    {
        exp += 25;
        gold += 3;
        expEl.textContent = "Experience: " + exp;

        enemyHealth = 100;
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
    enemyHealthEl.textContent = "Enemy Health: " + enemyHealth;
    playerLevelEl.textContent = "Player Level: " + playerLevel;
})
