const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../src/models/User");
const Policy = require("../src/models/Policy");
const Feedback = require("../src/models/Feedback");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/civic_engagement";
const API_URL = process.env.API_URL || "http://localhost:5000/api";
const DEFAULT_PASSWORD = "Pass123!";

// All Ethiopian regions (for geographic coverage)
const ALL_REGIONS = [
  "Addis Ababa",
  "Oromia",
  "Amhara",
  "Tigray",
  "SNNPR",
  "Sidama",
  "Harari",
  "Gambela",
  "Benishangul-Gumuz",
  "Afar",
  "Somali",
];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const generateComment = (sentiment) => {
  const comments = {
    positive: [
      "This policy is excellent! It will help many people. በጣም ጥሩ ፖሊሲ ነው።",
      "I fully support this initiative. Great work!",
      "Finally a policy that addresses our needs. Thank you.",
      "This will improve access to clean water. Very positive step.",
      "The government is listening to citizens. Keep it up!",
    ],
    negative: [
      "This policy does not consider rural areas. Disappointed.",
      "Waste of tax money. No consultation with locals.",
      "Implementation will fail like previous ones. Not happy.",
      "The timeline is unrealistic. We need more time.",
      "Excludes important stakeholders. Bad approach.",
    ],
    neutral: [
      "Need more details before forming an opinion.",
      "Some good points, some concerns. Let's see implementation.",
      "The policy has pros and cons. Neutral for now.",
      "Waiting for pilot results.",
    ],
  };
  return randomItem(comments[sentiment]);
};

const extractKeywordsFromComment = (comment) => {
  const words = comment.toLowerCase().split(/\W+/);
  const common = [
    "policy",
    "water",
    "access",
    "money",
    "government",
    "citizens",
    "implementation",
    "support",
    "time",
    "education",
    "road",
    "health",
    "business",
    "youth",
  ];
  const found = words.filter((w) => common.includes(w) && w.length > 3);
  return [...new Set(found.slice(0, 3))];
};

const getSentimentObject = (label) => {
  const confidence =
    label === "neutral" ? randomInt(50, 80) / 100 : randomInt(70, 98) / 100;
  return { label, confidence };
};

const uniquePhoneHash = (prefix, counter) =>
  `${prefix}_${counter}_${Date.now()}_${Math.random()}`;

async function loginAndSaveTokens(users, filename) {
  const tokens = [];
  for (const user of users) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: user.email,
        password: DEFAULT_PASSWORD,
      });
      if (response.data.status === "success") {
        tokens.push({
          email: user.email,
          token: response.data.data.token,
          role: response.data.data.role,
        });
        console.log(`   Logged in: ${user.email}`);
      } else {
        console.warn(
          `   Login failed for ${user.email}:`,
          response.data.message,
        );
      }
    } catch (err) {
      console.warn(
        `   Login error for ${user.email}:`,
        err.response?.data?.error?.message || err.message,
      );
    }
  }
  // Create tokens directory if it doesn't exist
  const tokensDir = path.join(__dirname, "../tokens");
  if (!fs.existsSync(tokensDir)) {
    fs.mkdirSync(tokensDir);
    console.log("Created tokens directory.");
  }
  const filePath = path.join(tokensDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(tokens, null, 2));
  console.log(`   Tokens saved to ${filePath}`);
  return tokens;
}

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Drop all indexes except _id_
    try {
      const indexes = await Feedback.collection.getIndexes();
      for (const name in indexes) {
        if (name !== "_id_") {
          await Feedback.collection.dropIndex(name);
          console.log(`Dropped index: ${name}`);
        }
      }
    } catch (err) {
      console.log("No indexes to drop or error:", err.message);
    }

    // Clean database (keep admin users)
    console.log("Cleaning database (keeping admin users)...");
    await Feedback.deleteMany({});
    await Policy.deleteMany({});
    await User.deleteMany({ role: { $ne: "admin" } });
    console.log("Cleaned.");

    // Recreate the unique indexes (sparse as defined in model)
    await Feedback.collection.createIndex(
      { policyId: 1, userId: 1 },
      { unique: true, sparse: true, name: "policyId_1_userId_1" },
    );
    await Feedback.collection.createIndex(
      { policyId: 1, phoneHash: 1 },
      { unique: true, sparse: true, name: "policyId_1_phoneHash_1" },
    );
    console.log("Recreated unique indexes");

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Create 2 planners
    const planners = [];
    for (let i = 1; i <= 2; i++) {
      const email = `planner${i}@test.com`;
      const user = new User({
        email,
        passwordHash,
        phoneHash: `planner_dummy_${i}_${Date.now()}`,
        region: "",
        role: "planner",
        verified: true,
        active: true,
      });
      await user.save();
      planners.push({ email, _id: user._id.toString() });
    }
    console.log(
      `Created ${planners.length} planners (password: ${DEFAULT_PASSWORD})`,
    );

    // Create citizens – 2 per region (total 22)
    const citizens = [];
    let citizenIndex = 1;
    for (const region of ALL_REGIONS) {
      for (let j = 1; j <= 2; j++) {
        const email = `citizen${citizenIndex}@test.com`;
        const phoneHash = `hash_${Math.random().toString(36).substring(2, 15)}`;
        const user = new User({
          email,
          passwordHash,
          phoneHash,
          region,
          role: "citizen",
          verified: true,
          active: true,
        });
        await user.save();
        citizens.push({ email, _id: user._id.toString(), region });
        citizenIndex++;
      }
    }
    console.log(
      `Created ${citizens.length} citizens (2 per region, password: ${DEFAULT_PASSWORD})`,
    );

    // Create 6 policies:
    // - First policy (index 0): Geographic test policy that targets ALL regions
    // - Next 4 policies (indices 1-4): active, random target regions
    // - Last policy (index 5): closed (inactive)
    const policyTitles = [
      "Geographic Test Policy (All Regions)",
      "Clean Water Access Initiative",
      "Digital Education for All",
      "Rural Road Development",
      "Healthcare Modernization",
      "Youth Employment Scheme",
    ];
    const policies = [];
    for (let i = 0; i < policyTitles.length; i++) {
      const title = policyTitles[i];
      const description = `${title} – a comprehensive policy to improve lives.`;
      let targetRegions;
      if (i === 0) {
        targetRegions = [...ALL_REGIONS];
      } else {
        targetRegions = [
          randomItem(ALL_REGIONS),
          randomItem(ALL_REGIONS),
        ].slice(0, randomInt(1, 2));
      }
      const startDate = new Date("2026-02-01");
      const endDate = new Date("2026-07-30");
      let status = "active";
      if (i === 5) status = "closed";
      const createdBy = randomItem(planners)._id;
      const policyCode =
        title.substring(0, 4).toUpperCase() +
        Math.random().toString(36).substring(2, 6).toUpperCase();
      const policy = new Policy({
        title,
        description,
        targetRegions,
        policyCode,
        startDate,
        endDate,
        status,
        createdBy,
      });
      await policy.save();
      policies.push({ ...policy.toObject(), _id: policy._id.toString() });
    }
    const activePolicies = policies.filter((p) => p.status === "active");
    console.log(
      `Created ${policies.length} policies (active: ${activePolicies.length})`,
    );

    if (activePolicies.length === 0)
      throw new Error("No active policies to seed feedback.");

    // Generate feedback – only app votes
    const feedbacks = [];
    let voteCounter = 0;

    for (const policy of activePolicies) {
      for (const citizen of citizens) {
        voteCounter++;
        const rating = randomInt(1, 5);
        const hasComment = Math.random() > 0.3;
        let comment = "";
        let sentimentObj = null;
        let keywords = [];
        let processed = false;
        let status = "processing";

        if (hasComment) {
          const sentimentLabel =
            rating <= 2 ? "negative" : rating === 3 ? "neutral" : "positive";
          comment = generateComment(sentimentLabel);
          sentimentObj = getSentimentObject(sentimentLabel);
          keywords = extractKeywordsFromComment(comment);
          processed = true;
          status = "processed";
          if (Math.random() < 0.1) {
            status = "pending review";
            processed = false;
            sentimentObj = { label: "neutral", confidence: 0 };
            keywords = [];
          }
        } else {
          processed = true;
          status = "processed";
          sentimentObj = { label: "neutral", confidence: 0 };
          keywords = [];
        }

        const createdAt = randomDate(new Date("2026-02-01"), new Date());

        const feedbackDoc = new Feedback({
          policyId: policy._id,
          userId: citizen._id,
          phoneHash: uniquePhoneHash("app", voteCounter),
          channel: "app",
          rating,
          comment: comment || "",
          sentiment: sentimentObj,
          keywords,
          processed,
          retryCount: 0,
          nextRetry: null,
          status,
          createdAt,
        });
        await feedbackDoc.save();
        feedbacks.push(feedbackDoc);
      }
    }

    console.log(
      `Created ${feedbacks.length} feedback entries (${citizens.length} citizens × ${activePolicies.length} policies = ${citizens.length * activePolicies.length} app votes)`,
    );

    const geographicPolicy = activePolicies[0];
    if (geographicPolicy) {
      console.log(
        `\nUse this policy ID for geographic heatmap testing: ${geographicPolicy._id}`,
      );
      console.log(`   Policy title: ${geographicPolicy.title}`);
      console.log(
        `   Target regions: ${geographicPolicy.targetRegions.length} regions (all)`,
      );
    } else {
      console.log("\nNo active policy found for geographic testing.");
    }

    if (activePolicies.length > 1) {
      console.log(
        `\nUse this policy ID for general analytics testing: ${activePolicies[1]._id}`,
      );
      console.log(`   Policy title: ${activePolicies[1].title}`);
    }

    console.log("\nObtaining JWT tokens for citizens and planners...");
    console.log("(Make sure your backend is running on port 5000)");

    let citizenTokens = [];
    let plannerTokens = [];

    try {
      await axios.get(`${API_URL.replace("/api", "")}/health`);
      console.log("Backend is reachable, logging in users...\n");

      citizenTokens = await loginAndSaveTokens(citizens, "citizen_tokens.json");
      plannerTokens = await loginAndSaveTokens(planners, "planner_tokens.json");

      console.log("\nTokens saved to tokens/ directory.");
    } catch (err) {
      console.warn(
        "\nBackend not reachable. Skipping token generation. Start the backend and run again if needed.",
      );
    }

    console.log("\n========== SEED COMPLETE ==========");
    console.log(`Planners: ${planners.length} created`);
    console.log(
      `Citizens: ${citizens.length} created (2 per region, covering ${ALL_REGIONS.length} regions)`,
    );
    console.log(
      `Policies: ${policies.length} (${activePolicies.length} active, ${policies.length - activePolicies.length} inactive)`,
    );
    console.log(`Feedback: ${feedbacks.length} entries`);
    console.log(`Regions covered: ${ALL_REGIONS.join(", ")}`);
    if (citizenTokens.length)
      console.log(`Citizen tokens saved: ${citizenTokens.length}`);
    if (plannerTokens.length)
      console.log(`Planner tokens saved: ${plannerTokens.length}`);
    console.log("===================================\n");

    await mongoose.disconnect();
    console.log("Disconnected.");
  } catch (err) {
    console.error("Seeding error:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
