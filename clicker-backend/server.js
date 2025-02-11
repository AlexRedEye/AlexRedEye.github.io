require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error(err));

// Define schema
const playerSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    muns: { type: Number, default: 0 },
    munsPerClick: { type: Number, default: 1 },
    upgradeCost: { type: Number, default: 25 },
    password: { type: String, required: true },
});

// Hash password before saving
playerSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const Player = mongoose.model("Player", playerSchema);

// Update player score
app.post("/update", async (req, res) => {
    const { name, muns, munsPerClick, upgradeCost } = req.body;
    if (!name) return res.status(400).json({ error: "Username is required" });

    try {
        let player = await Player.findOne({ name });
        if (player) {
            player.muns = muns;
            player.munsPerClick = munsPerClick;
            player.upgradeCost = upgradeCost;
            await player.save();
        } else {
            return res.status(404).json({ error: "Player not found" });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Get leaderboard
app.get("/leaderboard", async (req, res) => {
    try {
        const leaderboard = await Player.find().sort({ muns: -1 }).limit(10);
        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch player data
app.get("/player/:name", async (req, res) => {
    const { name } = req.params;
    try {
        const player = await Player.findOne({ name });
        if (player) res.json(player);
        else res.status(404).json({ error: "Player not found" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Register player
app.post("/register", async (req, res) => {
    const { name, password } = req.body;
    if (!name || !password) return res.status(400).json({ error: "All fields are required" });

    try {
        const existingPlayer = await Player.findOne({ name });
        if (existingPlayer) return res.status(400).json({ error: "Username already taken" });

        const newPlayer = new Player({ name, password });
        await newPlayer.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login player
app.post("/login", async (req, res) => {
    const { name, password } = req.body;
    if (!name || !password) return res.status(400).json({ error: "All fields are required" });

    try {
        const player = await Player.findOne({ name });
        if (!player) return res.status(404).json({ error: "Player not found" });

        const isMatch = await bcrypt.compare(password, player.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid password" });

        res.json({ 
            success: true, 
            muns: player.muns, 
            munsPerClick: player.munsPerClick, 
            upgradeCost: player.upgradeCost 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/player/:name", async (req, res) => {
    const { name } = req.params;
    try {
        const player = await Player.findOne({ name });
        if (player) {
            res.json({
                muns: player.muns,
                munsPerClick: player.munsPerClick,
                upgradeCost: player.upgradeCost
            });
        } else {
            res.status(404).json({ error: "Player not found" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(process.env.PORT || 3000, () => console.log(`Server running on port ${process.env.PORT || 3000}`));
