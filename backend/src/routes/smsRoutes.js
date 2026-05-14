const express = require("express");
const router = express.Router();
const smsController = require("../controllers/smsController");
const limiters = require("../config/rateLimits");

// Public endpoints
router.post("/receive", limiters.smsReceive, smsController.receiveSms);
router.get("/results", smsController.getResults);

module.exports = router;
