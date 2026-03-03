// seed-multi.js – Run with: node seed-multi.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");
const Policy = require("./src/models/Policy");
const Feedback = require("./src/models/Feedback");
const { hashPhone } = require("./src/utils/helpers");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/communityinsight";

// List of Ethiopian regions for variety
const regions = [
  "Addis Ababa",
  "Oromia",
  "Amhara",
  "SNNPR",
  "Tigray",
  "Sidama",
  "Harari",
  "Gambela",
  "Benishangul-Gumuz",
  "Afar",
  "Somali",
];

// Sample comments and keywords for variety
const comments = [
  {
    text: "This is a great policy!",
    sentiment: "positive",
    keywords: ["great", "policy"],
  },
  {
    text: "I support this but it needs more funding.",
    sentiment: "neutral",
    keywords: ["funding", "support"],
  },
  {
    text: "Terrible idea, will waste money.",
    sentiment: "negative",
    keywords: ["terrible", "waste"],
  },
  {
    text: "Finally something useful for our community.",
    sentiment: "positive",
    keywords: ["useful", "community"],
  },
  {
    text: "The implementation is too slow.",
    sentiment: "negative",
    keywords: ["slow", "implementation"],
  },
  {
    text: "I have mixed feelings about this.",
    sentiment: "neutral",
    keywords: ["mixed"],
  },
  {
    text: "Excellent work by the planners!",
    sentiment: "positive",
    keywords: ["excellent", "planners"],
  },
  { text: "This will create jobs.", sentiment: "positive", keywords: ["jobs"] },
  {
    text: "Not relevant to my area.",
    sentiment: "negative",
    keywords: ["relevant"],
  },
  {
    text: "I hope they consider environmental impact.",
    sentiment: "neutral",
    keywords: ["environment"],
  },
  {
    text: "The roads in our area are terrible.",
    sentiment: "negative",
    keywords: ["roads"],
  },
  {
    text: "We need more schools.",
    sentiment: "positive",
    keywords: ["schools"],
  },
  {
    text: "Water supply is insufficient.",
    sentiment: "negative",
    keywords: ["water"],
  },
  {
    text: "Electricity outages are frequent.",
    sentiment: "negative",
    keywords: ["electricity"],
  },
  {
    text: "Health clinics are far away.",
    sentiment: "negative",
    keywords: ["health"],
  },
];

// Helper to generate a random phone number (unique)
function generateRandomPhone(index) {
  return `09${Math.floor(10000000 + Math.random() * 90000000)}`; // 09xxxxxxxx
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Find an existing planner (you said you have one)
    const planner = await User.findOne({ role: "planner" });
    if (!planner) {
      console.error("No planner found. Please create a planner first.");
      process.exit(1);
    }
    console.log(`Using planner: ${planner.email}`);

    // 2. Create a test policy (if not exists)
    let policy = await Policy.findOne({ title: "Multi-Region Test Policy" });
    if (!policy) {
      policy = new Policy({
        title: "Multi-Region Test Policy",
        description:
          "This policy tests geographic heatmaps across Ethiopian regions.",
        targetRegions: regions, // target all regions
        policyCode: "MULTI001",
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-03-15"),
        status: "active",
        createdBy: planner._id,
      });
      await policy.save();
      console.log("Created test policy");
    } else {
      console.log("Test policy already exists");
    }

    // 3. Create multiple citizens with different regions
    const citizens = [];
    const citizenCount = 20; // number of citizens to create

    for (let i = 0; i < citizenCount; i++) {
      const region = regions[i % regions.length]; // cycle through regions
      const email = `citizen${i + 1}@example.com`;
      let user = await User.findOne({ email });
      if (!user) {
        const passwordHash = await bcrypt.hash("citizen123", 10);
        const phone = generateRandomPhone(i);
        user = new User({
          email,
          passwordHash,
          phoneHash: hashPhone(phone),
          region,
          role: "citizen",
          verified: true,
          active: true,
        });
        await user.save();
        console.log(`Created citizen ${email} in ${region}`);
      }
      citizens.push(user);
    }

    // 4. Drop the problematic unique indexes (they will be recreated with sparse=true by Mongoose on next restart)
    try {
      await mongoose.connection
        .collection("feedbacks")
        .dropIndex("policyId_1_userId_1");
      console.log("Dropped index policyId_1_userId_1");
    } catch (err) {
      console.log("Index policyId_1_userId_1 does not exist, skipping drop");
    }
    try {
      await mongoose.connection
        .collection("feedbacks")
        .dropIndex("policyId_1_phoneHash_1");
      console.log("Dropped index policyId_1_phoneHash_1");
    } catch (err) {
      console.log("Index policyId_1_phoneHash_1 does not exist, skipping drop");
    }

    // 5. Delete old feedback for this policy
    await Feedback.deleteMany({ policyId: policy._id });
    console.log("Cleared old feedback");

    // 6. Generate feedback entries – each citizen votes exactly once
    const startDate = new Date("2026-03-01");
    const endDate = new Date("2026-03-07");
    const feedbacks = [];

    // App votes: one per citizen
    for (const citizen of citizens) {
      const randomDay = new Date(
        startDate.getTime() + Math.random() * (endDate - startDate),
      );
      const randomComment =
        comments[Math.floor(Math.random() * comments.length)];
      const rating =
        randomComment.sentiment === "positive"
          ? 4 + Math.floor(Math.random() * 2)
          : randomComment.sentiment === "negative"
            ? 1 + Math.floor(Math.random() * 2)
            : 3; // neutral gives 3

      feedbacks.push({
        policyId: policy._id,
        userId: citizen._id,
        channel: "app",
        rating,
        comment: randomComment.text,
        sentiment: {
          label: randomComment.sentiment,
          confidence: 0.85 + Math.random() * 0.1,
        },
        keywords: randomComment.keywords,
        processed: true,
        createdAt: randomDay,
      });
    }

    // SMS votes: a few without userId
    for (let i = 0; i < 5; i++) {
      feedbacks.push({
        policyId: policy._id,
        phoneHash: hashPhone(generateRandomPhone(i + 100)), // ensure unique hash
        channel: "sms",
        rating: Math.floor(Math.random() * 5) + 1,
        processed: true,
        createdAt: new Date(
          startDate.getTime() + Math.random() * (endDate - startDate),
        ),
      });
    }

    await Feedback.insertMany(feedbacks);
    console.log(`Inserted ${feedbacks.length} feedback entries`);

    console.log("Seeding complete!");
    console.log(`Policy ID: ${policy._id}`);
    console.log(
      `You can now test geographic analytics with regions: ${regions.join(", ")}`,
    );
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
