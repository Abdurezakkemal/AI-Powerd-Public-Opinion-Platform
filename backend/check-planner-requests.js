require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const PlannerRequest = require("./src/models/PlannerRequest");

async function checkRequests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const requests = await PlannerRequest.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "email")
      .populate("reviewedBy", "email");

    console.log(`\nTotal planner requests: ${await PlannerRequest.countDocuments()}`);
    console.log(`\nLatest 10 requests:\n`);
    
    requests.forEach((req, i) => {
      console.log(`${i + 1}. ${req.email || req.userId?.email || 'N/A'}`);
      console.log(`   Status: ${req.status}`);
      console.log(`   Organization: ${req.organization}`);
      console.log(`   Created: ${req.createdAt}`);
      console.log(`   Proof file: ${req.proofFile ? 'Yes' : 'No'}`);
      console.log('');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkRequests();
