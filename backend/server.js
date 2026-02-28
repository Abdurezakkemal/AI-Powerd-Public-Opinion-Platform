const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db");
const redisClient = require("./src/config/redis");

dotenv.config();
connectDB(); // connect to MongoDB

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/policies", require("./src/routes/policyRoutes"));
// We'll add other route files later

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  redisClient.quit();
  mongoose.connection.close();
  process.exit(0);
});
