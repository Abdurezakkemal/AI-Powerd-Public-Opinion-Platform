const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

const updatePlanner = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const User = require("./src/models/User");
    const hash = await bcrypt.hash("temp123", 10);
    const result = await User.updateOne(
      { email: "planner@example.com" },
      { $set: { passwordHash: hash } },
    );
    console.log("Planner password reset:", result);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

updatePlanner();
