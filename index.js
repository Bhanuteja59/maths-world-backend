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
app.use(express.json());

app.use(cors({ origin: "https://maths-world.vercel.app", credentials: true }));


// ✅ Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // change to true if using HTTPS
  })
);

// ✅ Passport setup
app.use(passport.initialize());
app.use(passport.session());
setupGoogleAuth(passport);

// ✅ Routes
app.use("/auth", googleAuthRoutes);
app.use("/user", userRoutes);

// ✅ MongoDB
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
