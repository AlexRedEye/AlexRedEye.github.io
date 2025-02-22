// blackjack.js

// Define suits and ranks
const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

// Initialize card deck
function createDeck() {
    let deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ rank, suit });
        }
    }
    return deck;
}

// Shuffle deck
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Calculate the total value of a hand
function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;
    for (let card of hand) {
        if (card.rank === "A") {
            aces += 1;
            value += 11;
        } else if (["K", "Q", "J"].includes(card.rank)) {
            value += 10;
        } else {
            value += parseInt(card.rank);
        }
    }

    // Adjust for aces (if needed)
    while (value > 21 && aces > 0) {
        value -= 10;
        aces -= 1;
    }

    return value;
}

// Deal a card to a hand
function dealCard(deck, hand) {
    hand.push(deck.pop());
}

// Reset the game
function resetGame() {
    let deck = shuffleDeck(createDeck()); // Shuffle a new deck
    let playerHand = [];
    let dealerHand = [];

    // Deal two cards to both the player and the dealer
    dealCard(deck, playerHand);
    dealCard(deck, playerHand);
    dealCard(deck, dealerHand);
    dealCard(deck, dealerHand);

    return {
        deck: deck,
        playerHand: playerHand,
        dealerHand: dealerHand,
        gameOver: false,
        playerBusted: false,
        dealerBusted: false
    };
}


// Check if the player has busted (over 21)
function checkForBusted(hand) {
    return calculateHandValue(hand) > 21;
}

// Check if player wins or loses
function checkGameResult(playerHand, dealerHand) {
    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);

    if (playerValue > 21) {
        return "Player Busted! You Lose.";
    } else if (dealerValue > 21) {
        return "Dealer Busted! You Win.";
    } else if (playerValue > dealerValue) {
        return "You Win!";
    } else if (dealerValue > playerValue) {
        return "You Lose!";
    } else {
        return "It's a Tie!";
    }
}

// Play dealer's turn
function playDealerTurn(dealerHand, deck) {
    while (calculateHandValue(dealerHand) < 17) {
        dealCard(deck, dealerHand);
    }

    return dealerHand;
}

// Export functions
export {
    createDeck,
    shuffleDeck,
    calculateHandValue,
    dealCard,
    resetGame,
    checkForBusted,
    checkGameResult,
    playDealerTurn
};
