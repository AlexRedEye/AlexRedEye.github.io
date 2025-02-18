let chips = 0;
let chipsPerClick = 1;
let inventory = {};

const rewards = [
    { name: "Common Coin", rarity: "Common", color: "gray", weight: 50, effect: "sell", value: 5 },
    { name: "Lucky Charm", rarity: "Uncommon", color: "green", weight: 30, effect: "boost", boostAmount: 1 },
    { name: "Golden Ticket", rarity: "Rare", color: "blue", weight: 15, effect: "boost", boostAmount: 2 },
    { name: "Diamond Ring", rarity: "Epic", color: "purple", weight: 4, effect: "sell", value: 100 },
    { name: "Jackpot Crown", rarity: "Legendary", color: "gold", weight: 1, effect: "unlock", specialEffect: "chipsPerClickBoost", boostAmount: 5 }
];

// Load saved data from localStorage
function loadGameData() {
    const savedChips = localStorage.getItem('chips');
    const savedInventory = localStorage.getItem('inventory');
    const savedChipsPerClick = localStorage.getItem('chipsPerClick');

    if (savedChips !== null) {
        chips = parseInt(savedChips);
    }

    if (savedInventory !== null) {
        inventory = JSON.parse(savedInventory);
    }

    if (savedChipsPerClick !== null) {
        chipsPerClick = parseInt(savedChipsPerClick);
    }

    updateDisplay();
}

// Save game data to localStorage
function saveGameData() {
    localStorage.setItem('chips', chips);
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('chipsPerClick', chipsPerClick);
    saveUserData();
}

// Functions for basic clicker game
function earnChips() {
    chips += chipsPerClick;
    updateDisplay();
    saveGameData();
}

function pullGacha() {
    if (chips < 10) {
        alert("Not enough chips!");
        return;
    }
    chips -= 10;

    let reward = getRandomReward();
    addToInventory(reward);
    updateDisplay();
    saveGameData();
}

function getRandomReward() {
    let totalWeight = rewards.reduce((sum, r) => sum + r.weight, 0);
    let rand = Math.random() * totalWeight;
    for (let reward of rewards) {
        if (rand < reward.weight) return reward;
        rand -= reward.weight;
    }
}

function addToInventory(reward) {
    if (!inventory[reward.name]) {
        inventory[reward.name] = { count: 0, details: reward };
    }
    inventory[reward.name].count++;

    let log = document.getElementById("log");
    log.innerHTML = `<p style="color:${reward.color}">${reward.rarity}: ${reward.name}</p>` + log.innerHTML;

    applyItemEffect(reward);
    saveGameData();
}

function applyItemEffect(item) {
    if (item.effect === "boost") {
        chipsPerClick += item.boostAmount;
    } else if (item.effect === "unlock") {
        alert("You've unlocked High-Roller Mode!");
    } else if (item.effect === "sell") {
        sellItem(item);
    }

    if (item.specialEffect === "chipsPerClickBoost") {
        chipsPerClick += item.boostAmount;
        alert(`You've received a permanent boost of ${item.boostAmount} chips per click from the Jackpot Crown!`);
    }
}

function sellItem(itemName) {
    if (inventory[itemName] && inventory[itemName].count > 0) {
        let item = inventory[itemName].details;
        if (item.effect === "sell") {
            chips += item.value;
            inventory[itemName].count--;
            updateDisplay();
            saveGameData();
        }
    }
}

function updateDisplay() {
    document.getElementById("chips").textContent = chips;

    let invDisplay = document.getElementById("inventory");
    invDisplay.innerHTML = "<h3>Inventory</h3>";
    for (let item in inventory) {
        if (inventory[item].count > 0) {
            let itemData = inventory[item].details;
            invDisplay.innerHTML += `
                <p style="color:${itemData.color}">
                    ${itemData.name} (x${inventory[item].count})
                    ${itemData.effect === "sell" ? `<button onclick="sellItem('${item}')">Sell (${itemData.value} Chips)</button>` : ""}
                </p>
            `;
        }
    }
}

// Slot Machine
function playSlotMachine() {
    if (chips < 10) {
        alert("Not enough chips!");
        return;
    }
    chips -= 10;

    let symbols = ["🍒", "🔔", "7️⃣", "🍋", "💎"];
    let result = [randomSymbol(symbols), randomSymbol(symbols), randomSymbol(symbols)];

    let log = document.getElementById("slot-machine");
    log.innerHTML = `<h3>🎰 ${result[0]} | ${result[1]} | ${result[2]} 🎰</h3>`;

    let winnings = 0;
    if (result[0] === result[1] && result[1] === result[2]) {
        winnings = 50;  // Jackpot!
    } else if (result[0] === result[1] || result[1] === result[2]) {
        winnings = 20;  // Partial win
    }

    chips += winnings;
    updateDisplay();
    saveGameData();
}

function randomSymbol(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Blackjack
let playerHand = [];
let dealerHand = [];
let blackjackActive = false;

function startBlackjack() {
    if (chips < 20) {
        alert("Not enough chips!");
        return;
    }
    chips -= 20;
    blackjackActive = true;

    playerHand = [drawCard(), drawCard()];
    dealerHand = [drawCard(), drawCard()];

    displayBlackjack();
}

function drawCard() {
    let cards = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11]; // Numbers + face cards (J, Q, K)
    return cards[Math.floor(Math.random() * cards.length)];
}

function displayBlackjack() {
    let blackjackDiv = document.getElementById("blackjack");
    blackjackDiv.innerHTML = `
        <h3>🃏 Blackjack</h3>
        <p>Your Hand: ${playerHand.join(", ")} (Total: ${handTotal(playerHand)})</p>
        <p>Dealer's Hand: ${dealerHand[0]}, ?</p>
        <button onclick="hit()">Hit</button>
        <button onclick="stand()">Stand</button>
    `;
}

function hit() {
    if (!blackjackActive) return;
    playerHand.push(drawCard());

    if (handTotal(playerHand) > 21) {
        displayBlackjack();
        endBlackjack(false);
    } else {
        displayBlackjack();
    }
}

function stand() {
    if (!blackjackActive) return;

    while (handTotal(dealerHand) < 17) {
        dealerHand.push(drawCard());
    }

    let playerScore = handTotal(playerHand);
    let dealerScore = handTotal(dealerHand);
    
    let playerWins = (playerScore <= 21 && (playerScore > dealerScore || dealerScore > 21));
    endBlackjack(playerWins);
}

function endBlackjack(playerWins) {
    blackjackActive = false;

    let blackjackDiv = document.getElementById("blackjack");
    blackjackDiv.innerHTML += `<p>Dealer's Hand: ${dealerHand.join(", ")} (Total: ${handTotal(dealerHand)})</p>`;
    
    if (playerWins) {
        chips += 40; // Win 2x the bet
        blackjackDiv.innerHTML += `<p style="color:green;">You Win! +40 Chips</p>`;
    } else {
        blackjackDiv.innerHTML += `<p style="color:red;">You Lose!</p>`;
    }

    updateDisplay();
    saveGameData();
}

function handTotal(hand) {
    return hand.reduce((sum, card) => sum + card, 0);
}

async function registerUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert("Please enter both a username and password.");
        return;
    }

    let response = await fetch('https://clicker.pocketfriends.org:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    let data = await response.json();
    if (data.success) {
        alert("Registration successful!");
        localStorage.setItem('username', username);
    } else {
        alert("Registration failed: " + data.message);
    }
}

async function loginUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert("Please enter both a username and password.");
        return;
    }

    let response = await fetch('https://clicker.pocketfriends.org:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    let data = await response.json();
    if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.user.username);
        alert("Login successful!");
        // Update the display to show the logged-in username
        document.getElementById("player-name").textContent = data.user.username;
    } else {
        alert("Login failed: " + data.message);
    }
}



async function saveUserData() {
    let username = localStorage.getItem('username');
    let token = localStorage.getItem('token');
    if (!username || !token) return;

    let response = await fetch('https://clicker.pocketfriends.org:5000/save', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({
            username,
            chips,
            inventory,
            chipsPerClick
        }),
    });

    let data = await response.json();
    console.log(data.message);
}

//document.getElementById('slot-machine-btn').addEventListener('click', playSlotMachine);
//document.getElementById('blackjack-btn').addEventListener('click', startBlackjack);

window.onload = loadGameData;