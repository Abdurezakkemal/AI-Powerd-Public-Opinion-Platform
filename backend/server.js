const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const redisClient = require("./src/config/redis");
const requestLogger = require("./src/middleware/requestLogger");
const limiters = require("./src/config/rateLimits");
const { setSocketIO } = require("./src/services/notificationService");
const {
  startEmergingTopicsWorker,
} = require("./src/workers/emergingTopicsWorker");

connectDB(); // connect to MongoDB

const app = express();
app.use(cors());
app.use(express.json());

// Request logger MUST come before routes
app.use(requestLogger);

// Global rate limiter for all API routes (except health)
app.use("/api", limiters.global);

// Health check (unlimited)
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ========== API ROUTES ==========
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/policies", require("./src/routes/policyRoutes"));
app.use("/api/votes", require("./src/routes/voteRoutes"));
app.use("/api/comments", require("./src/routes/commentRoutes"));
app.use("/api/analytics", require("./src/routes/analyticsRoutes"));
app.use("/api/sms", require("./src/routes/smsRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api/planners", require("./src/routes/plannerRoutes"));
app.use("/api/messages", require("./src/routes/messageRoutes"));
app.use("/api/feed", require("./src/routes/feedRoutes"));
app.use("/api/translate", require("./src/routes/translationRoutes"));
// ========== HTTP & SOCKET.IO SERVER ==========
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }, // Adjust for production
});
setSocketIO(io);

io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;
  if (userId) {
    socket.join(`user:${userId}`);
    console.log(`Socket connected for user ${userId}`);
  }
  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ========== WORKERS ==========
const { startWorker, stopWorker } = require("./src/workers/aiWorker");
const { startAutoCloseWorker } = require("./src/workers/autoCloseWorker");
const { startAutoActivateWorker } = require("./src/workers/autoActivateWorker");

startWorker();
startAutoCloseWorker();
startAutoActivateWorker();
startEmergingTopicsWorker();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  stopWorker();
  redisClient.quit();
  mongoose.connection.close();
  server.close(() => process.exit(0));
});
