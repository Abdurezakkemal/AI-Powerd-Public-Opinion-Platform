const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/auth");

router.get("/planners", auth(["admin"]), adminController.listPlanners);
router.post("/planners", auth(["admin"]), adminController.createPlanner);
router.put("/planners/:id", auth(["admin"]), adminController.updatePlanner);

module.exports = router;
