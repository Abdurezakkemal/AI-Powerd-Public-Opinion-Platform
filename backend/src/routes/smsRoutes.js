const express = require("express");
const router = express.Router();
const smsController = require("../controllers/smsController");

// Public endpoints (can add simple API key later if needed)
router.post("/receive", smsController.receiveSms);
router.get("/results", smsController.getResults);

module.exports = router;
