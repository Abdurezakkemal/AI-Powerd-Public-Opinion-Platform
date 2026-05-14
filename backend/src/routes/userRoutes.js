const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const limiters = require("../config/rateLimits");

// All routes require authentication
router.use(authMiddleware(["citizen", "planner", "admin"]));

// Profile
router.get("/me", userController.getMe);
router.put("/me", limiters.userProfileUpdate, userController.updateMe);
router.put(
  "/me/password",
  limiters.userProfileUpdate,
  userController.changePassword,
);
router.delete("/me", limiters.userProfileUpdate, userController.deleteMe);
router.get("/me/export", limiters.dataExport, userController.exportMe);

// History
router.get("/me/history", userController.getHistory);

// Email change
router.post(
  "/me/email/request",
  limiters.userProfileUpdate,
  userController.requestEmailChange,
);
router.post(
  "/me/email/verify",
  limiters.userProfileUpdate,
  userController.verifyEmailChange,
);

// Notifications
router.get("/me/notifications", userController.getNotifications);
router.patch("/me/notifications/:id/read", userController.markNotificationRead);
router.patch(
  "/me/notifications/read-all",
  userController.markAllNotificationsRead,
);

// Phone change
router.post(
  "/me/phone/request",
  limiters.phoneChangeRequest,
  userController.requestPhoneChange,
);
router.post(
  "/me/phone/verify",
  limiters.userProfileUpdate,
  userController.verifyPhoneChange,
);

module.exports = router;
