let cards = []
let sum = 0
let hasBlackjack = false
let isAlive = false
let message = ""
let messageEl = document.getElementById("message-el")
let sumEl = document.getElementById("sum-el")
let cardsEl = document.getElementById("cards-el")

function getRandomCard()
{
    let randomNumber = Math.floor(Math.random() * 12) + 1;
    return randomNumber
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
    cards.push(firstCard, secondCard)
    sum = firstCard + secondCard
    renderGame();
}

function renderGame()
{
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
        sumEl.textContent = "Sum: " + sum
        for (let i = cards.length; i <= cards.length; i++)
        {
            cardsEl.textContent = "Cards: " + cards
        }
}

function newCard()
{
    let newCard = getRandomCard()
    sum += newCard
    cards.push(newCard)
    
    renderGame()
}