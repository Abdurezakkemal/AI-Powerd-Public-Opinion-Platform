const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../src/models/User");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/civic_engagement";
const API_URL = process.env.API_URL || "http://localhost:5000/api";
const DEFAULT_PASSWORD = "Pass123!";

async function seedPlanners() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");

    await User.deleteMany({ role: "planner" });
    console.log("Deleted existing planners.");

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    console.log("Hash used:", passwordHash);

    const planners = [];
    for (let i = 1; i <= 5; i++) {
      planners.push({
        email: `planner${i}@test.com`,
        passwordHash,
        phoneHash: `planner_dummy_${i}`,
        region: "",
        role: "planner",
        verified: true,
        active: true,
      });
    }

    const inserted = await User.insertMany(planners);
    console.log(`Created ${inserted.length} planners.`);

    // Verify one planner's password
    const testPlanner = await User.findOne({ email: "planner1@test.com" });
    const isMatch = await bcrypt.compare(
      DEFAULT_PASSWORD,
      testPlanner.passwordHash,
    );
    console.log(
      `Password verification for planner1: ${isMatch ? "OK" : "FAIL"}`,
    );

    await mongoose.disconnect();
    console.log("MongoDB disconnected.\n");

    if (!isMatch) {
      console.error("Password mismatch in database. Aborting login test.");
      process.exit(1);
    }

    // Now login
    console.log("Logging in planners...\n");
    const tokens = [];

    for (let i = 1; i <= 5; i++) {
      const email = `planner${i}@test.com`;
      try {
        const response = await axios.post(`${API_URL}/auth/login`, {
          email,
          password: DEFAULT_PASSWORD,
        });
        if (response.data.status === "success") {
          tokens.push({
            email,
            token: response.data.data.token,
            role: response.data.data.role,
          });
          console.log(`${email} logged in.`);
        } else {
          console.error(`${email} login failed:`, response.data);
        }
      } catch (err) {
        console.error(
          `${email} login error:`,
          err.response?.data || err.message,
        );
      }
    }

    // Create tokens directory if it doesn't exist
    const tokensDir = path.join(__dirname, "../tokens");
    if (!fs.existsSync(tokensDir)) {
      fs.mkdirSync(tokensDir);
      console.log("Created tokens directory.");
    }

    // Save tokens to tokens/planner_tokens.json
    const tokenFilePath = path.join(tokensDir, "planner_tokens.json");
    fs.writeFileSync(tokenFilePath, JSON.stringify(tokens, null, 2));
    console.log(`\nTokens saved to ${tokenFilePath}`);
    console.log("Planner Tokens:\n", JSON.stringify(tokens, null, 2));
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seedPlanners();
