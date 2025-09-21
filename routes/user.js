const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { User } = require("../db/schema");
const { generateToken } = require("../auth/jwt");
const authMiddleware = require("../auth/middleware");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

// ======================= SIGNUP =======================
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required" });

    const normalized = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalized });
    if (existing)
      return res.status(400).json({ success: false, message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      username: username || normalized.split("@")[0],
      email: normalized,
      password: hashed,
    });
    await user.save();

    const token = generateToken({ id: user._id, email: user.email });
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, message: "User created", token, user: userObj });

    // Welcome email
    setImmediate(() => {
      sendEmail(
        user.email,
        "Welcome to Maths-World 🎉",
        `<div>
          <h2>Hello ${user.username} 👋</h2>
          <p>Welcome to Maths-World! Your account has been created successfully.</p>
          <p>You can now enjoy quizzes, track your scores, and collect stars.</p>
          <a href="${process.env.PUBLIC_URL_FRONTEND}/dashboard" style="padding:10px; background:#4f46e5; color:white;">Go to Dashboard</a>
          <p>We are thrilled to have you!</p>
        </div>`
      ).catch(err => console.error("Welcome email failed:", err));
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================= LOGIN =======================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = generateToken({ id: user._id, email: user.email });
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, message: "Login successful", token, user: userObj });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================= FORGOT PASSWORD =======================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExp = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const resetLink = `${process.env.PUBLIC_URL_FRONTEND}/reset/${token}`;
    res.json({ success: true, message: "Password reset link sent" });

    setImmediate(() => {
      sendEmail(
        user.email,
        "Password Reset 🔑",
        `<div>
          <h2>Hello ${user.username} 👋</h2>
          <p>We received a request to reset your Maths-World password.</p>
          <p>This link is valid for 15 minutes:</p>
          <a href="${resetLink}" style="padding:10px; background:#ef4444; color:white;">Reset Password</a>
          <p>If you did not request this, you can safely ignore this email.</p>
          <p>Stay safe!</p>
        </div>`
      ).catch(err => console.error("Forgot-password email failed:", err));
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================= RESET PASSWORD =======================
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({ resetToken: token, resetTokenExp: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: "Invalid or expired token" });

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExp = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successful" });

  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================= GET CURRENT USER =======================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // exclude password
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    console.error("Fetch user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;
