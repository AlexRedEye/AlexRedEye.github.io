const API_URL = "http://142.196.63.80:3000";
let muns = 0;
let munsPerClick = 1;
let upgradeCost = 25;
let username = "";

// Click to earn muns
function Increment() {
    if (!username) {
        alert("Set a username first!");
        return;
    }
    muns += munsPerClick;
    UpdateUI();
    updateLeaderboard();
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
        updateLeaderboard();
    } else {
        alert("Not enough muns!");
    }
}

// Update leaderboard
async function updateLeaderboard() {
    if (username) {
        await fetch(`${API_URL}/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: username, muns }),
        });
        fetchLeaderboard();
    }
}

// Fetch leaderboard
async function fetchLeaderboard() {
    try {
        const response = await fetch(`${API_URL}/leaderboard`);
        const leaderboard = await response.json();
        const leaderboardList = document.getElementById("leaderboard");
        leaderboardList.innerHTML = "";

        leaderboard.forEach(player => {
            let li = document.createElement("li");
            li.textContent = `${player.name}: ${player.muns} muns`;
            leaderboardList.appendChild(li);
        });
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
    }
}

// Update UI
function UpdateUI() {
    document.getElementById("munsText").textContent = muns;
    document.getElementById("mpcText").textContent = munsPerClick;
    document.getElementById("upgradeCostText").textContent = upgradeCost;
}

// Register user
async function registerUser() {
    const name = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value.trim();

    if (!name || !password) {
        alert("Please enter both username and password.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, password }),
        });
        const result = await response.json();

        alert(response.ok ? "Registration successful!" : result.error);
    } catch (error) {
        console.error("Error registering user:", error);
    }
}

// Login user
async function loginUser() {
    const name = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!name || !password) {
        alert("Please enter both username and password.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, password }),
        });
        const result = await response.json();

        if (response.ok) {
            username = name;
            muns = result.muns;
            munsPerClick = result.munsPerClick;
            upgradeCost = result.upgradeCost;
            alert("Login successful!");
            UpdateUI();
            fetchLeaderboard();
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error("Error logging in:", error);
    }
}