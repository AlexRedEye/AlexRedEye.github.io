const API_URL = "http://localhost:3000"; // Change this when deploying

let muns = 0;
let munsPerClick = 1;
let upgradeCost = 25;
let username = "";

async function setUsername() {
    const input = document.getElementById("username").value.trim();
    if (input) {
        username = input;
        alert(`Welcome, ${username}!`);
        await fetchLeaderboard(); // Fetch latest leaderboard
        UpdateUI();
    } else {
        alert("Please enter a valid username.");
    }
}

function Increment() {
    if (!username) {
        alert("Set a username first!");
        return;
    }
    muns += munsPerClick;
    UpdateUI();
    updateLeaderboard();
}

function Upgrade() {
    if (!username) {
        alert("Set a username first!");
        return;
    }
    if (muns >= upgradeCost) {
        muns -= upgradeCost;
        munsPerClick++;
        incrUpgCost();
        UpdateUI();
        updateLeaderboard();
    } else {
        alert("Not enough muns!");
    }
}

function incrUpgCost() {
    upgradeCost = Math.floor((upgradeCost * 5) + (0.5 * 0.05));
}

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

function UpdateUI() {
    document.getElementById("munsText").textContent = muns;
    document.getElementById("mpcText").textContent = munsPerClick;
    document.getElementById("upgradeCostText").textContent = upgradeCost;
}
