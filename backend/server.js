const dotenv = require("dotenv");
dotenv.config();


const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const redisClient = require("./src/config/redis");
const requestLogger = require("./src/middleware/requestLogger");

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
  stopWorker();
  redisClient.quit();
  mongoose.connection.close();
  process.exit(0);
});

app.use("/api/feedback", require("./src/routes/feedbackRoutes"));
const { startWorker } = require("./src/workers/aiWorker");
startWorker();

app.use("/api/analytics", require("./src/routes/analyticsRoutes"));
app.use("/api/sms", require("./src/routes/smsRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));
app.use(requestLogger);
