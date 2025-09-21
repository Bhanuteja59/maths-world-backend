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

// ✅ CORS setup (allow deployed + localhost)
const allowedOrigins = [
  "https://maths-world.vercel.app",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin); // log blocked origins
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


// ✅ Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set to true if using HTTPS + custom domain
  })
);

// ✅ Passport setup
app.use(passport.initialize());
app.use(passport.session());
setupGoogleAuth(passport);

// ✅ Routes
app.use("/auth", googleAuthRoutes);
app.use("/user", userRoutes);

// ✅ MongoDB connection with pooling + timeout
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000, // fail after 10s if no DB server
    socketTimeoutMS: 45000, // close idle sockets after 45s
    maxPoolSize: 10, // reuse up to 10 connections
  })
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
