const express = require("express");
const User = require("../models/User");
const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Basic validation
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" });
        }

        // Create new user
        const newUser = new User({
            username,
            password // In a real application, you should hash the password
        });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login user
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Basic validation
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        // Check database users
        const dbUser = await User.findOne({ username, password });
        
        // If user found in database
        if (dbUser) {
            return res.json({ 
                message: "Login successful",
                user: {
                    id: dbUser._id,
                    username: dbUser.username
                }
            });
        }

        // Check local storage users (your existing array-based users)
        // You might want to move this array to a configuration file
        const localUsers = [
            { username: "admin", password: "admin123" },
            { username: "manager", password: "manager123" }
        ];

        const localUser = localUsers.find(
            user => user.username === username && user.password === password
        );

        if (localUser) {
            return res.json({ 
                message: "Login successful",
                user: {
                    username: localUser.username
                }
            });
        }

        // If no user found
        res.status(401).json({ error: "Invalid username or password" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all users (for testing purposes)
router.get("/users", async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 