const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // optional for Google users
    googleId: { type: String, index: true },
    scores: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },
    history: [
      {
        difficulty: { type: String, enum: ["easy", "medium", "hard"] },
        value: { type: Number, default: 0 },
        label: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = { User };
