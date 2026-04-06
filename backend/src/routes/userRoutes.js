const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");

// All routes require authentication
router.use(authMiddleware(["citizen", "planner", "admin"]));

router.get("/me", userController.getMe);
router.put("/me", userController.updateMe);
router.put("/me/password", userController.changePassword);
router.get("/me/history", userController.getHistory);
router.delete("/me", userController.deleteMe);
module.exports = router;
