const inputEl = document.getElementById("input-el")
const oneBtn = document.getElementById("1-btn")
const twoBtn = document.getElementById("2-btn")
const threeBtn = document.getElementById("3-btn")
const fourBtn = document.getElementById("4-btn")
const fiveBtn = document.getElementById("5-btn")
const sixBtn = document.getElementById("6-btn")
const sevenBtn = document.getElementById("7-btn")
const eightBtn = document.getElementById("8-btn")
const nineBtn = document.getElementById("9-btn")
const zeroBtn = document.getElementById("0-btn")
const plusBtn = document.getElementById("+-btn")
const equalBtn = document.getElementById("=-btn")
const clrBtn = document.getElementById("clr-btn")
const multBtn = document.getElementById("mult-btn")
const divBtn = document.getElementById("div-btn")

timesPressed = 0

let add = false
let mult = false
let div = false

oneBtn.addEventListener("click", function()
{
    inputEl.value += "1"
})

twoBtn.addEventListener("click", function()
{
    inputEl.value += "2"
})

threeBtn.addEventListener("click", function()
{
    inputEl.value += "3"
})

fourBtn.addEventListener("click", function()
{
    inputEl.value += "4"
})

fiveBtn.addEventListener("click", function()
{
    inputEl.value += "5"
})

sixBtn.addEventListener("click", function()
{
    inputEl.value += "6"
})

sevenBtn.addEventListener("click", function()
{
    inputEl.value += "7"
})

eightBtn.addEventListener("click", function()
{
    inputEl.value += "8"
})

nineBtn.addEventListener("click", function()
{
    inputEl.value += "9"
})

zeroBtn.addEventListener("click", function()
{
    inputEl.value += "0"
})

plusBtn.addEventListener("click", function()
{
    add = true
    timesPressed += 0
    num1 = inputEl.value
    firstNum = parseInt(num1)
    inputEl.value = ""
})

multBtn.addEventListener("click", function()
{
    mult = true
    timesPressed += 0
    num1 = inputEl.value
    firstNum = parseInt(num1)
    inputEl.value = ""
})

divBtn.addEventListener("click", function()
{
    div = true
    timesPressed += 0
    num1 = inputEl.value
    firstNum = parseInt(num1)
    inputEl.value = ""
})

equalBtn.addEventListener("click", function()
{
    num2 = inputEl.value
    secondNum = parseInt(num2)

    if(add === true)
    {
        finalNum = firstNum + secondNum
    } else if (mult === true)
    {
        finalNum = firstNum * secondNum
    } else if (div === true)
    {
        finalNum = firstNum / secondNum
    }

    inputEl.value = finalNum


})

clrBtn.addEventListener("click", function()
{
    add = false
    mult = false
    div = false

    inputEl.value = ""
})

