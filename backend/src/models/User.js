const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phoneHash: { type: String, unique: true, sparse: true, default: null },
  region: { type: String },
  role: {
    type: String,
    enum: ["citizen", "planner", "admin"],
    default: "citizen",
  },
  verified: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
