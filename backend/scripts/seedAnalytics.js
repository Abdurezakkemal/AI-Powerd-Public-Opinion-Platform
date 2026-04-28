const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../src/models/User");
const Policy = require("../src/models/Policy");
const Vote = require("../src/models/Vote");
const Comment = require("../src/models/Comment");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/communityinsight";
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

// Wait for backend to be ready
async function waitForBackend(retries = 10, delayMs = 2000) {
  const healthUrl = API_URL.replace("/api", "") + "/health";
  for (let i = 0; i < retries; i++) {
    try {
      await axios.get(healthUrl, { timeout: 5000 });
      console.log("Backend is ready.");
      return true;
    } catch (err) {
      console.log(`Waiting for backend... (${i + 1}/${retries})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  console.warn("Backend not reachable after retries. Continuing anyway...");
  return false;
}

async function loginAndSaveTokens(users, filename, retries = 3) {
  const tokens = [];
  for (const user of users) {
    let success = false;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Add small random delay to avoid hammering the server
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        const response = await axios.post(
          `${API_URL}/auth/login`,
          {
            email: user.email,
            password: DEFAULT_PASSWORD,
          },
          { timeout: 10000 },
        );
        if (response.data.status === "success") {
          tokens.push({
            email: user.email,
            token: response.data.data.token,
            role: response.data.data.role,
          });
          console.log(`   Logged in: ${user.email}`);
          success = true;
          break;
        } else {
          console.warn(
            `   Login failed for ${user.email} (attempt ${attempt}): ${response.data.message}`,
          );
        }
      } catch (err) {
        console.warn(
          `   Login error for ${user.email} (attempt ${attempt}): ${err.response?.data?.error?.message || err.message}`,
        );
      }
    }
    if (!success) {
      console.error(
        `   Could not log in ${user.email} after ${retries} attempts.`,
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

    // Drop all indexes except _id_ for Vote and Comment collections
    try {
      const voteIndexes = await Vote.collection.getIndexes();
      for (const name in voteIndexes) {
        if (name !== "_id_") {
          await Vote.collection.dropIndex(name);
          console.log(`Dropped Vote index: ${name}`);
        }
      }
      const commentIndexes = await Comment.collection.getIndexes();
      for (const name in commentIndexes) {
        if (name !== "_id_") {
          await Comment.collection.dropIndex(name);
          console.log(`Dropped Comment index: ${name}`);
        }
      }
    } catch (err) {
      console.log("No indexes to drop or error:", err.message);
    }

    // Clean database (keep admin users)
    console.log("Cleaning database (keeping admin users)...");
    await Vote.deleteMany({});
    await Comment.deleteMany({});
    await Policy.deleteMany({});
    await User.deleteMany({ role: { $ne: "admin" } });
    console.log("Cleaned.");

    // Recreate the unique indexes for Vote (sparse as defined in model)
    await Vote.collection.createIndex(
      { policyId: 1, userId: 1 },
      { unique: true, sparse: true, name: "policyId_1_userId_1" },
    );
    await Vote.collection.createIndex(
      { policyId: 1, phoneHash: 1 },
      { unique: true, sparse: true, name: "policyId_1_phoneHash_1" },
    );
    console.log("Recreated unique indexes for Vote");

    // Comment index: unique on voteId (enforced in model), and index on policyId+userId
    await Comment.collection.createIndex(
      { voteId: 1 },
      { unique: true, name: "voteId_1" },
    );
    await Comment.collection.createIndex(
      { policyId: 1, userId: 1 },
      { name: "policyId_1_userId_1" },
    );
    console.log("Recreated indexes for Comment");

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
        citizens.push({ email, _id: user._id.toString(), region, phoneHash });
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

    // Generate votes and comments – only app votes
    let voteCounter = 0;

    for (const policy of activePolicies) {
      for (const citizen of citizens) {
        voteCounter++;
        const rating = randomInt(1, 5);
        const hasComment = Math.random() > 0.3;
        const createdAt = randomDate(new Date("2026-02-01"), new Date());

        // Create the Vote (always)
        const vote = new Vote({
          policyId: policy._id,
          userId: citizen._id,
          phoneHash: citizen.phoneHash,
          channel: "app",
          rating,
          createdAt,
        });
        await vote.save();

        // If comment exists, create a Comment linked to this vote
        if (hasComment) {
          const sentimentLabel =
            rating <= 2 ? "negative" : rating === 3 ? "neutral" : "positive";
          const commentText = generateComment(sentimentLabel);
          const sentimentObj = getSentimentObject(sentimentLabel);
          const keywords = extractKeywordsFromComment(commentText);
          let processed = true;
          let status = "processed";
          if (Math.random() < 0.1) {
            status = "pending_review";
            processed = false;
            sentimentObj.label = "neutral";
            sentimentObj.confidence = 0;
          }
          const commentDoc = new Comment({
            voteId: vote._id, // link to the vote
            policyId: policy._id,
            userId: citizen._id,
            rating,
            comment: commentText,
            sentiment: sentimentObj,
            keywords,
            processed,
            status,
            retryCount: 0,
            nextRetry: null,
            createdAt,
          });
          await commentDoc.save();
        }
      }
    }

    const totalVotes = await Vote.countDocuments();
    const totalComments = await Comment.countDocuments();
    console.log(
      `Created ${totalVotes} votes (${citizens.length} citizens × ${activePolicies.length} policies)`,
    );
    console.log(`Created ${totalComments} comments (with AI processing)`);

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

    // Wait for backend to be ready
    await waitForBackend();

    let citizenTokens = [];
    let plannerTokens = [];

    try {
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
    console.log(`Votes: ${totalVotes}`);
    console.log(`Comments: ${totalComments}`);
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
