require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");

// Routes
const googleAuthRoutes = require("./auth/googleAuth");
const setupGoogleAuth = require("./auth/googleStrategy");
const userRoutes = require("./routes/user");

const app = express();

// ✅ Parse JSON bodies
app.use(express.json());

// ✅ CORS setup for your Vercel frontend
app.use(cors({
  origin: 'https://maths-world.vercel.app', // Frontend URL
  credentials: true,                        // Allow cookies
}));

// ✅ Handle preflight requests
app.options('*', cors({
  origin: 'https://maths-world.vercel.app',
  credentials: true,
}));

// ✅ Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || "dev_session_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // secure in production
    httpOnly: true,
  },
}));

// ✅ Passport setup
app.use(passport.initialize());
app.use(passport.session());
setupGoogleAuth(passport);

// ✅ Routes
app.use("/auth", googleAuthRoutes);
app.use("/user", userRoutes);

// ✅ MongoDB connection and server start
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
