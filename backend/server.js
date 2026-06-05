const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const redisClient = require("./src/config/redis");
const requestLogger = require("./src/middleware/requestLogger");
const { startWorker, stopWorker } = require("./src/workers/aiWorker");

dotenv.config();
connectDB(); // connect to MongoDB

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/policies", require("./src/routes/policyRoutes"));
app.use("/api/feedback", require("./src/routes/feedbackRoutes"));
app.use("/api/analytics", require("./src/routes/analyticsRoutes"));
app.use("/api/sms", require("./src/routes/smsRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Start AI worker
startWorker();

// Graceful shutdown
process.on("SIGINT", () => {
  stopWorker();
  redisClient.quit();
  mongoose.connection.close();
  process.exit(0);
});
