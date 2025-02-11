const API_URL = "http://localhost:3000"; // Change if deploying
let token = localStorage.getItem("token");
let username = localStorage.getItem("username");
let muns = 0;
let munsPerClick = 1;
let upgradeCost = 25;

// Register User
async function registerUser() {
    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;

    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
        alert("Registration successful! Please log in.");
    } else {
        alert(data.error);
    }
}

// Login User
async function loginUser() {
    const usernameInput = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password }),
    });

    const data = await response.json();
    if (response.ok) {
        token = data.token;
        username = data.user.username;
        muns = data.user.muns;
        munsPerClick = data.user.munsPerClick;
        upgradeCost = data.user.upgradeCost;

        localStorage.setItem("token", token);
        localStorage.setItem("username", username);

        alert("Login successful!");
        UpdateUI();
        loadLeaderboard();
    } else {
        alert(data.error);
    }
}

// Click to earn muns
function Increment() {
    if (!username) {
        alert("Set a username first!");
        return;
    }
    muns += munsPerClick;
    UpdateUI();
    saveProgress();
}

// Upgrade click power
function Upgrade() {
    if (!username) {
        alert("Set a username first!");
        return;
    }
    if (muns >= upgradeCost) {
        muns -= upgradeCost;
        munsPerClick++;
        upgradeCost = Math.floor(upgradeCost * 1.5);
        UpdateUI();
        saveProgress();
    } else {
        alert("Not enough muns!");
    }
}

// Save Progress
async function saveProgress() {
    if (!token) return;

    await fetch(`${API_URL}/update`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, muns, munsPerClick, upgradeCost }),
    });
}

// Load Leaderboard
async function loadLeaderboard() {
    const response = await fetch(`${API_URL}/leaderboard`);
    const leaderboard = await response.json();
    const leaderboardElement = document.getElementById("leaderboard");
    leaderboardElement.innerHTML = leaderboard
        .map((player, index) => `<li>${index + 1}. ${player.username} - ${player.muns} muns</li>`)
        .join("");
}

// Update UI
function UpdateUI() {
    document.getElementById("munsText").textContent = muns;
    document.getElementById("mpcText").textContent = munsPerClick;
    document.getElementById("upgradeCostText").textContent = upgradeCost;
}

// Load leaderboard on page load
window.onload = () => {
    if (username) {
        loadLeaderboard();
        UpdateUI();
    }
};
