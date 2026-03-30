const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { nanoid } = require("nanoid"); // npm i nanoid
const User = require("./src/models/User");
const Policy = require("./src/models/Policy");
const { hashPassword, hashPhone } = require("./src/utils/helpers");

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/finalproject";

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Config
const NUM_CITIZENS = 10;
const NUM_POLICIES = 5;
const REGIONS = ["Addis Ababa", "Bahir Dar", "Mekelle", "Adama"];

const randomRegion = () => REGIONS[Math.floor(Math.random() * REGIONS.length)];
const randomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Ensure unique policy code
const generateUniquePolicyCode = async (title) => {
  let code;
  let exists;
  do {
    code =
      title.replace(/\W/g, "").substring(0, 4).toUpperCase() +
      nanoid(4).toUpperCase();
    exists = await Policy.findOne({ policyCode: code });
  } while (exists);
  return code;
};

async function seed() {
  try {
    // Delete old citizens and policies
    await User.deleteMany({ role: "citizen" });
    await Policy.deleteMany({});
    console.log("Deleted old citizens and policies");

    // Insert bulk citizens
    const citizens = [];
    for (let i = 1; i <= NUM_CITIZENS; i++) {
      const phone = `0912${String(100000 + i).slice(-6)}`;
      const email = `citizen${i}@test.com`;
      const passwordHash = await hashPassword("password123");
      citizens.push({
        email,
        phone,
        phoneHash: hashPhone(phone),
        passwordHash,
        verified: true,
        role: "citizen",
        region: randomRegion(),
      });
    }
    await User.insertMany(citizens);
    console.log(`Inserted ${NUM_CITIZENS} citizens`);

    // Get a planner for policy creation
    const planner = await User.findOne({ role: "planner" });
    if (!planner) throw new Error("No planner found. Please create one first.");

    // Insert bulk policies
    for (let i = 1; i <= NUM_POLICIES; i++) {
      const start = randomDate(new Date("2026-01-01"), new Date("2026-03-01"));
      const end = randomDate(new Date(start), new Date("2026-12-31"));
      const policyCode = await generateUniquePolicyCode(`Policy${i}`);

      await Policy.create({
        title: `Test Policy ${i}`,
        description: `Description for policy ${i}`,
        targetRegions: [randomRegion()],
        policyCode,
        startDate: start,
        endDate: end,
        status: "active",
        createdBy: planner._id,
      });
    }
    console.log(`Inserted ${NUM_POLICIES} policies`);

    console.log("Seeding completed successfully.");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    // Mongoose 7+ close without callback
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

seed();
