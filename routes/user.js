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

    // ✅ Respond immediately
    res.json({ success: true, message: "User created", token, user: userObj });

    // ✅ Send email in background
    setImmediate(() => {
      sendEmail(
        user.email,
        "Welcome to Maths-World 🎉",
        `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Hi ${user.username},</h2>
            <p>Your account has been created successfully! 🎉 We’re excited to have you onboard.</p>
            
            <p>
              🌐 <a href="${process.env.PUBLIC_URL_FRONTEND}" 
                    style="display:inline-block; padding:10px 20px; background:#4f46e5; 
                           color:#fff; text-decoration:none; border-radius:8px;">
                Visit Your Dashboard
              </a>
            </p>

            <p>Feel free to explore and reach out if you have any questions.</p>

            <p style="margin-top:20px;">
              Best regards,<br/>
              <strong>The Developer ❤️</strong>
            </p>
          </div>
        `
      ).catch(err => console.error("Welcome email failed:", err));
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================= FORGOT PASSWORD =======================
router.post("/forgot-password", async (req, res) => {
  try {
    const API = process.env.PUBLIC_URL_FRONTEND;
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExp = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const resetLink = `${API}/reset/${token}`;

    // ✅ Respond immediately
    res.json({ success: true, message: "Password reset link sent" });

    // ✅ Send email in background
    setImmediate(() => {
      sendEmail(
        user.email,
        "Password Reset 🔑",
        `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Hi ${user.username},</h2>
            <p>Click below to reset your password (valid for 15 min):</p>
            <a href="${resetLink}" style="display:inline-block; padding:10px 20px; background:#ef4444; color:#fff; text-decoration:none; border-radius:8px;">
              Reset Password
            </a>
            <p>If you didn’t request this, you can safely ignore this email.</p>
          </div>
        `
      ).catch(err => console.error("Forgot-password email failed:", err));
    });

  } catch (err) {
    console.error("Forgot error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
