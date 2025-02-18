require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    chips: { type: Number, default: 0 },
    inventory: { type: Object, default: {} },
    chipsPerClick: { type: Number, default: 1 },
});

const User = mongoose.model('User', UserSchema);

// **Register a new user with hashed password**
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        let existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Username already exists!' });

        const hashedPassword = await bcrypt.hash(password, 10);

        let newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.json({ message: 'User registered!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// **Login user and return JWT token**
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        let user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user: { username: user.username, chips: user.chips, inventory: user.inventory, chipsPerClick: user.chipsPerClick } });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// **Middleware to verify JWT token**
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// **Update user data (requires authentication)**
app.post('/save', authenticateToken, async (req, res) => {
    const { username, chips, inventory, chipsPerClick } = req.body;

    try {
        await User.findOneAndUpdate({ username }, { chips, inventory, chipsPerClick });
        res.json({ message: 'Data saved!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Set up HTTPS server
const options = {
  key: fs.readFileSync('private.key'),
  cert: fs.readFileSync('cert.cer'),
  //ca: fs.readFileSync('/path/to/your/ca_bundle.crt') // Optional, if needed
};

const PORT = process.env.PORT || 5000;
https.createServer(options, app).listen(PORT, () => {
    console.log(`Secure server running on https://localhost:${PORT}`);
});
