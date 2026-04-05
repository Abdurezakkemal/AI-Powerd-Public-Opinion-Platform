const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

const insertAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const User = require(path.join(__dirname, "src", "models", "User"));

    const email = "admin@example.com";
    const password = "temp123";

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = {
      email,
      passwordHash,
      phoneHash: null, // no phone number
      region: "",
      role: "admin",
      verified: true,
      active: true,
    };

    const result = await User.updateOne(
      { email },
      { $set: admin },
      { upsert: true },
    );

    if (result.upsertedCount > 0) {
      console.log(
        `Admin user created with email: ${email}, password: ${password}`,
      );
    } else if (result.modifiedCount > 0) {
      console.log(`Admin user updated (password reset to ${password})`);
    } else {
      console.log(`Admin user already exists, no changes.`);
    }

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

insertAdmin();
