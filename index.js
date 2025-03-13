require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");

const app = express();
app.use(express.json());

const users = [];
const events = [];

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// Middleware for Authentication
const authMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");
    console.log("Received Auth Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access denied" });
    }

    const token = authHeader.split(" ")[1]; // Extract token
    console.log("Extracted Token:", token);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded);
        req.user = decoded;
        next();
    } catch (err) {
        console.log("JWT Verification Error:", err.message);
        res.status(400).json({ error: "Invalid token" });
    }
};


// User Registration
app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (users.some(user => user.email === email)) {
            return res.status(400).json({ error: "User already exists" });
        }
        if (users.some(user => user.username === username)) {
            return res.status(400).json({ error: "Username already taken" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = { id: users.length + 1, username, email, password: hashedPassword };
        users.push(user);
        res.status(201).json({ message: "User registered" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// User Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Create Event
app.post("/events", authMiddleware, (req, res) => {
    try {
        const { name, description, date, category, reminderTime } = req.body;

        if (!["Meeting", "Birthday", "Appointment"].includes(category)) {
            return res.status(400).json({ error: "Invalid category" });
        }

        const eventDate = new Date(date);
        const reminder = new Date(reminderTime);

        if (isNaN(eventDate) || isNaN(reminder)) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        const event = {
            id: events.length + 1,
            userId: req.user.id,
            name,
            description,
            date: eventDate,
            category,
            reminderTime: reminder,
            notified: false // Prevent multiple notifications
        };
        events.push(event);
        res.status(201).json(event);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get Events
app.get("/events", authMiddleware, (req, res) => {
    try {
        const userEvents = events.filter(event => event.userId === req.user.id);
        res.json(userEvents.sort((a, b) => a.date - b.date));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Reminder System (Runs every minute)
cron.schedule("* * * * *", () => {
    const now = new Date();

    events.forEach(event => {
        if (!event.notified && event.reminderTime <= now) {
            console.log(`Reminder: ${event.name} is happening soon!`);
            event.notified = true;
        }
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
