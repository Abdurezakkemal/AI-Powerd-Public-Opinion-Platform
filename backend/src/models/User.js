// src/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phoneHash: { type: String, required: true, unique: true },
  region: { type: String, required: true },
  role: {
    type: String,
    enum: ["citizen", "planner", "admin"],
    default: "citizen",
  },
  verified: { type: Boolean, default: false },
  active: { type: Boolean, default: true }, // <-- add this line
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
