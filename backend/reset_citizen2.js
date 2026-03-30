const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

const updateCitizen = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const User = require("./src/models/User");
    const hash = await bcrypt.hash("secret123", 10);
    const result = await User.updateOne(
      { email: "citizen2@example.com" },
      { $set: { passwordHash: hash } },
    );
    console.log("Citizen2 password reset:", result);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

updateCitizen();
