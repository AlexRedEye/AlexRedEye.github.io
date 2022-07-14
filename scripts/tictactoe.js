const oneBtn = document.getElementById("1-btn")
const twoBtn = document.getElementById("2-btn")
const threeBtn = document.getElementById("3-btn")
const fourBtn = document.getElementById("4-btn")
const fiveBtn = document.getElementById("5-btn")
const sixBtn = document.getElementById("6-btn")
const sevenBtn = document.getElementById("7-btn")
const eightBtn = document.getElementById("8-btn")
const nineBtn = document.getElementById("9-btn")
const resetBtn = document.getElementById("reset-btn")
let winnerEl = document.getElementById("winner-el")
let turn = -1
let alreadyPressed = false
let twoAlreadyPressed = false
let threeAlreadyPressed = false
let fourAlreadyPressed = false
let fiveAlreadyPressed = false
let sixAlreadyPressed = false
let sevenAlreadyPressed = false
let eightAlreadyPressed = false
let nineAlreadyPressed = false

oneBtn.addEventListener("click", function()
{
    turn += 1

    if(alreadyPressed === false)
    {
            if (turn % 2 == 0)
        {
            oneBtn.textContent = "X"
            alreadyPressed = true
        } else if (turn % 2 == 1)
        {
            oneBtn.textContent = "O"
            alreadyPressed = true
        }
    }
    
    winCheck()
    console.log(turn)
})

twoBtn.addEventListener("click", function()
{
    turn += 1

    if(twoAlreadyPressed === false)
    {
            if (turn % 2 == 0)
        {
            twoBtn.textContent = "X"
            twoAlreadyPressed = true
        } else if (turn % 2 == 1)
        {
            twoBtn.textContent = "O"
            twoAlreadyPressed = true
        }
    }
    winCheck()
    console.log(turn)
})

threeBtn.addEventListener("click", function()
{
    turn += 1

    if(threeAlreadyPressed === false)
    {
            if (turn % 2 == 0)
        {
            threeBtn.textContent = "X"
            threeAlreadyPressed = true
        } else if (turn % 2 == 1)
        {
            threeBtn.textContent = "O"
            threeAlreadyPressed = true
        }
    }
    winCheck()
    console.log(turn)
})

fourBtn.addEventListener("click", function()
{
    turn += 1

    if(fourAlreadyPressed === false)
    {
            if (turn % 2 == 0)
        {
            fourBtn.textContent = "X"
            fourAlreadyPressed = true
        } else if (turn % 2 == 1)
        {
            fourBtn.textContent = "O"
            fourAlreadyPressed = true
        }
    }
    winCheck()
    console.log(turn)
})

fiveBtn.addEventListener("click", function()
{
    turn += 1

    if(fiveAlreadyPressed === false)
    {
            if (turn % 2 == 0)
        {
            fiveBtn.textContent = "X"
            fiveAlreadyPressed = true
        } else if (turn % 2 == 1)
        {
            fiveBtn.textContent = "O"
            fiveAlreadyPressed = true
        }
    }
    winCheck()
    console.log(turn)
})

sixBtn.addEventListener("click", function()
{
    turn += 1

    if(sixAlreadyPressed === false)
    {
            if (turn % 2 == 0)
        {
            sixBtn.textContent = "X"
            sixAlreadyPressed = true
        } else if (turn % 2 == 1)
        {
            sixBtn.textContent = "O"
            sixAlreadyPressed = true
        }
    }
    winCheck()
    console.log(turn)
})

sevenBtn.addEventListener("click", function()
{
    turn += 1

    if(sevenAlreadyPressed === false)
    {
            if (turn % 2 == 0)
        {
            sevenBtn.textContent = "X"
            sevenAlreadyPressed = true
        } else if (turn % 2 == 1)
        {
            sevenBtn.textContent = "O"
            sevenAlreadyPressed = true
        }
    }
    winCheck()
    console.log(turn)
})

eightBtn.addEventListener("click", function()
{
    turn += 1

    if(eightAlreadyPressed === false)
    {
            if (turn % 2 == 0)
        {
            eightBtn.textContent = "X"
            eightAlreadyPressed = true
        } else if (turn % 2 == 1)
        {
            eightBtn.textContent = "O"
            eightAlreadyPressed = true
        }
    }
    winCheck()
    console.log(turn)
})

nineBtn.addEventListener("click", function()
{
    turn += 1

    if(nineAlreadyPressed === false)
    {
            if (turn % 2 == 0)
        {
            nineBtn.textContent = "X"
            nineAlreadyPressed = true
        } else if (turn % 2 == 1)
        {
            nineBtn.textContent = "O"
            nineAlreadyPressed = true
        }
    }
    winCheck()
    console.log(turn)
})

resetBtn.addEventListener("click", function()
{
    turn = -1
    
    oneBtn.textContent = "1"
    twoBtn.textContent = "2"
    threeBtn.textContent = "3"
    fourBtn.textContent = "4"
    fiveBtn.textContent = "5"
    sixBtn.textContent = "6"
    sevenBtn.textContent = "7"
    eightBtn.textContent = "8"
    nineBtn.textContent = "9"

    winnerEl.textContent = "Winner:"

    alreadyPressed = false
    twoAlreadyPressed = false
    threeAlreadyPressed = false
    fourAlreadyPressed = false
    fiveAlreadyPressed = false
    sixAlreadyPressed = false
    sevenAlreadyPressed = false
    eightAlreadyPressed = false
    nineAlreadyPressed = false
})

function winCheck()
{
    if (turn > 3)
    {
if (oneBtn.textContent && twoBtn.textContent && threeBtn.textContent === "X")
{
    winnerEl.textContent += " X"
    console.log("bruh")
}

if (fourBtn.textContent && fiveBtn.textContent && sixBtn.textContent === "X")
{
    winnerEl.textContent += " X"
    console.log("bruh")
}

if (sevenBtn.textContent && eightBtn.textContent && nineBtn.textContent === "X")
{
    winnerEl.textContent += " X"
    console.log("bruh")
}

if (oneBtn.textContent && fiveBtn.textContent && nineBtn.textContent === "X")
{
    winnerEl.textContent += " X"
    console.log("bruh")
}

if (threeBtn.textContent && fiveBtn.textContent && sevenBtn.textContent === "X")
{
    winnerEl.textContent += " X"
    console.log("bruh")
}

if (oneBtn.textContent && twoBtn.textContent && threeBtn.textContent === "O")
{
    winnerEl.textContent += " O"
    console.log("bruh")
}

if (fourBtn.textContent && fiveBtn.textContent && sixBtn.textContent === "O")
{
    winnerEl.textContent += " O"
    console.log("bruh")
}

if (sevenBtn.textContent && eightBtn.textContent && nineBtn.textContent === "O")
{
    winnerEl.textContent += " O"
    console.log("bruh")
}

if (oneBtn.textContent && fiveBtn.textContent && nineBtn.textContent === "O")
{
    winnerEl.textContent += " O"
    console.log("bruh")
}

if (threeBtn.textContent && fiveBtn.textContent && sevenBtn.textContent === "O")
{
    winnerEl.textContent += " O"
    console.log("bruh")
}
}
}