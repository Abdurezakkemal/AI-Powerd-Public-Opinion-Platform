const express = require("express");
const router = express.Router();
const translationController = require("../controllers/translationController");
const auth = require("../middleware/authMiddleware");

// Allow planners and admins to translate comments (and optionally citizens)
router.post(
  "/",
  auth(["planner", "admin", "citizen"]),
  translationController.translateText,
);

module.exports = router;
