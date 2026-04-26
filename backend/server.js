const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose"); // ADDED
const connectDB = require("./src/config/db");
const redisClient = require("./src/config/redis");
const requestLogger = require("./src/middleware/requestLogger");

connectDB(); // connect to MongoDB

const app = express();
app.use(cors());
app.use(express.json());

// Request logger MUST come before routes
app.use(requestLogger);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes (mount all before listening)
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/policies", require("./src/routes/policyRoutes"));
app.use("/api/feedback", require("./src/routes/feedbackRoutes"));
app.use("/api/analytics", require("./src/routes/analyticsRoutes"));
app.use("/api/sms", require("./src/routes/smsRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Import workers (after app is configured)
const { startWorker, stopWorker } = require("./src/workers/aiWorker");
const { startAutoCloseWorker } = require("./src/workers/autoCloseWorker");
const { startAutoActivateWorker } = require("./src/workers/autoActivateWorker");

// Start all workers
startWorker();
startAutoCloseWorker();
startAutoActivateWorker();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  stopWorker(); // from aiWorker
  redisClient.quit();
  mongoose.connection.close();
  server.close(() => process.exit(0));
});
