let playerHealthEl = document.getElementById("playerHealth-el");

const healBtn = document.getElementById("heal-btn");

let playerHealth = 5;

healBtn.addEventListener("click", function()
{
    playerHealthEl.textContent = "Player Health: " + playerHealth;
})

