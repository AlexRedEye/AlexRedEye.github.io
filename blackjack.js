let cards = []
let dealerCards = []
let sum = 0
let dealerSum = 0
let hasBlackjack = false
let isAlive = false
let message = ""
let messageEl = document.getElementById("message-el")
let sumEl = document.getElementById("sum-el")
let cardsEl = document.getElementById("cards-el")
let dealerCardsEl = document.getElementById("dealerCards-el")
let dealerSumEl = document.getElementById("dealerSum-el")

let player = {
    name: "You",
    chips: 200
}

let playerEl = document.getElementById("player-el")
playerEl.textContent = player.name + ": $" + player.chips

function getRandomCard()
{
    let randomNumber = Math.floor(Math.random() * 13) + 1;
    if (randomNumber > 10)
    {
        return 10
    } else if (randomNumber === 1) 
    {
        return 11
    } else 
    {
        return randomNumber
    }
}

function startGame()
{
    isAlive = true
    let firstCard = getRandomCard()
    let secondCard = getRandomCard()
    let dealerFirstCard = getRandomCard()
    let dealerSecondCard = getRandomCard()
    cards = [firstCard, secondCard]
    dealerCards = [dealerFirstCard, dealerSecondCard]
    sum = firstCard + secondCard
    dealerSum = dealerFirstCard + dealerSecondCard
    renderGame();
}

function renderGame()
{
    cardsEl.textContent = "Cards: "
    dealerCardsEl.textContent = "Dealer Cards: "

    for (let i = 0; i < cards.length; i++)
    {
        cardsEl.textContent += cards[i] + " "
    }

    for (let v = 0; v < dealerCards.length; v++)
    {
        dealerCardsEl.textContent += dealerCards[v] + " "
    }

    sumEl.textContent = "Sum: " + sum
    dealerSumEl.textContent = "Dealer Sum: " + dealerSum
    if (sum <= 20)
    {
        message = "Do you want to draw a new card?"
    } else if (sum === 21) 
    {
        message = "Woohoo! You've got Blackjack!"
        hasBlackjack = true
    } else{
        message = "You're out of the game!"
        isAlive = false
    }

    messageEl.textContent = message
}

function newCard()
{
    if (isAlive === true && hasBlackjack === false)
    {
        let newCard = getRandomCard()
        sum += newCard
        cards.push(newCard)
        renderGame()
    }
}