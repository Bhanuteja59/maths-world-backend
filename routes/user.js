// routes/user.js
const express = require("express");
const bcrypt = require("bcryptjs");
const { User } = require("../db/schema");
const { generateToken } = require("../auth/jwt");
const authMiddleware = require("../auth/middleware");

const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });

    const normalized = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalized });
    if (existing) return res.status(400).json({ success: false, message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username: username || normalized.split("@")[0], email: normalized, password: hashed });
    await user.save();

    const token = generateToken({ id: user._id, email: user.email });
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, message: "User created", token, user: userObj });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });

    const normalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalized });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.password) return res.status(400).json({ success: false, message: "Google login only" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = generateToken({ id: user._id, email: user.email });
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, message: "Login successful", token, user: userObj });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get current user
router.get("/me", authMiddleware, async (req, res) => {
  const userObj = req.user.toObject();
  delete userObj.password;
  res.json({ success: true, user: userObj });
});

// Update score
router.post("/score", authMiddleware, async (req, res) => {
  try {
    const { difficulty, score, label } = req.body;
    if (!["easy", "medium", "hard"].includes(difficulty)) return res.status(400).json({ success: false, message: "Invalid difficulty" });

    const newScore = Math.max(req.user.scores[difficulty] || 0, score);
    req.user.scores[difficulty] = newScore;

    req.user.history.push({ difficulty, value: score, label: label || difficulty });
    await req.user.save();

    const userObj = req.user.toObject();
    delete userObj.password;

    res.json({ success: true, message: "Score updated", user: userObj });
  } catch (err) {
    console.error("/score error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
