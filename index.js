//document.getElementById("count-el").innerText = 5;

let countEl = document.getElementById("count-el");
let count = 0

let saveEl = document.getElementById("save-el");

let errorEl = document.getElementById("error-el");

function increment() 
{
    count += 1;
    countEl.textContent = count;
}

function save()
{
    let saveCount = " " + count + " -";

    saveEl.textContent += saveCount;
    count = 0;
    countEl.textContent = count;
}

function store()
{
    window.location.href = "store.html";
}

function error()
{
    errorEl.textContent = "Something went wrong! Please try again later.";
}

function counter()
{
    window.location.href = "peoplecounter.html";
}

function game()
{
    window.location.href = "blackjack.html";
}

function calculator()
{
    window.location.href = "calculator.html"
}