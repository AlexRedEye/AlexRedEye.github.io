let chips = 0;
let chipsPerClick = 1;
let inventory = {};

const rewards = [
    { name: "Common Coin", rarity: "Common", color: "gray", weight: 50, effect: "sell", value: 5 },
    { name: "Lucky Charm", rarity: "Uncommon", color: "green", weight: 30, effect: "boost", boostAmount: 1 },
    { name: "Golden Ticket", rarity: "Rare", color: "blue", weight: 15, effect: "boost", boostAmount: 2 },
    { name: "Diamond Ring", rarity: "Epic", color: "purple", weight: 4, effect: "sell", value: 100 },
    { name: "Jackpot Crown", rarity: "Legendary", color: "gold", weight: 1, effect: "unlock" }
];

function earnChips() {
    chips += chipsPerClick;
    updateDisplay();
}

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
}

function handTotal(hand) {
    return hand.reduce((sum, card) => sum + card, 0);
}

function updateDisplay() {
    document.getElementById("chips").textContent = chips;
}
