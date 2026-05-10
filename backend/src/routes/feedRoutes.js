const express = require("express");
const router = express.Router();
const feedController = require("../controllers/feedController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth(["citizen"]), feedController.getFeed);
router.post("/interact", auth(["citizen"]), feedController.recordInteraction);

module.exports = router;
