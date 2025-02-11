require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error(err));

// Define a schema and model for leaderboard entries
const playerSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    muns: Number
});

const Player = mongoose.model("Player", playerSchema);

// Save/update player score
app.post("/update", async (req, res) => {
    const { name, muns } = req.body;
    try {
        let player = await Player.findOne({ name });
        if (player) {
            player.muns = muns;
            await player.save();
        } else {
            player = new Player({ name, muns });
            await player.save();
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch leaderboard
app.get("/leaderboard", async (req, res) => {
    try {
        const leaderboard = await Player.find().sort({ muns: -1 }).limit(10);
        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
