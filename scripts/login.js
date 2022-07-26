let userBtn = document.getElementById("user-btn");
let usernameEl = document.getElementById("username");
let mainGreetEl = document.getElementById("main-greet-el");

userBtn.addEventListener("click", function()
{
    let username = usernameEl.value;
    let key = "username";

    console.log(username)

    localStorage.setItem(key, username);

    console.log(localStorage.getItem("username"));

    if(localStorage.getItem("username") === true)
    {
        localStorage.removeItem("username");
    }
})