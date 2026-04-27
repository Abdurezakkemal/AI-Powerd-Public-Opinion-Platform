const express = require("express");
const router = express.Router();
const voteController = require("../controllers/voteController");
const auth = require("../middleware/authMiddleware");

// Submit a vote (rating required, comment optional)
router.post("/", auth(["citizen"]), voteController.submitAppVote);

module.exports = router;
