// cleanup-seed.js – Run with: node cleanup-seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const Policy = require("./src/models/Policy");
const Feedback = require("./src/models/Feedback");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/communityinsight";

async function cleanup() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Delete all citizen accounts with emails matching citizen%d@example.com
    const citizenRegex = /^citizen\d+@example\.com$/;
    const deleteResult = await User.deleteMany({
      email: { $regex: citizenRegex },
    });
    console.log(`Deleted ${deleteResult.deletedCount} citizen accounts`);

    // Optional: Delete the test policy and all its feedback
    const policy = await Policy.findOne({ title: "Multi-Region Test Policy" });
    if (policy) {
      await Feedback.deleteMany({ policyId: policy._id });
      console.log(`Deleted feedback for policy: ${policy._id}`);
      await policy.deleteOne();
      console.log("Deleted test policy");
    } else {
      console.log("No test policy found");
    }

    console.log("Cleanup complete!");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup error:", err);
    process.exit(1);
  }
}

cleanup();
