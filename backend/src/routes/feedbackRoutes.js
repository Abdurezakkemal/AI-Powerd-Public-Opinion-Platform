const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth(["citizen"]), feedbackController.submitFeedback);

module.exports = router;
