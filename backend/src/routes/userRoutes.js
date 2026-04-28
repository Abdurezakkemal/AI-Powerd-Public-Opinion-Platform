const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware(["citizen", "planner", "admin"]));

// Profile
router.get("/me", userController.getMe);
router.put("/me", userController.updateMe);
router.put("/me/password", userController.changePassword);
router.delete("/me", userController.deleteMe);

// History
router.get("/me/history", userController.getHistory);

// Email change (secure flow)
router.post("/me/email/request", userController.requestEmailChange);
router.post("/me/email/verify", userController.verifyEmailChange);

module.exports = router;
