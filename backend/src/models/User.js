const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // Existing fields
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phoneHash: { type: String, unique: true, sparse: true, default: null },
  region: { type: String, required: true }, // make required?
  role: {
    type: String,
    enum: ["citizen", "planner", "admin"],
    default: "citizen",
  },
  verified: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },

  // Demographics (mandatory at registration)
  ageRange: {
    type: String,
    enum: ["18-24", "25-34", "35-44", "45-54", "55+"],
    required: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "non-binary", "prefer-not-to-say"],
    required: true,
  },
  occupation: {
    type: String,
    enum: [
      "student",
      "farmer",
      "merchant",
      "government-employee",
      "private-sector",
      "unemployed",
      "other",
    ],
    required: true,
  },
  education: {
    type: String,
    enum: [
      "no-formal",
      "primary",
      "secondary",
      "diploma",
      "bachelors",
      "postgraduate",
    ],
    required: true,
  },

  // Planner-specific fields
  languagesSpoken: {
    type: [String],
    enum: ["am", "om", "ti", "en"],
    default: [],
  },
  trainingCompletedAt: { type: Date, default: null },
  twoFactorEnabled: { type: Boolean, default: false },
  totpSecret: { type: String, default: null },
  tokenVersion: { type: Number, default: 0 }, // for JWT invalidation

  // Soft delete
  deletedAt: { type: Date, default: null },
});

module.exports = mongoose.model("User", userSchema);
