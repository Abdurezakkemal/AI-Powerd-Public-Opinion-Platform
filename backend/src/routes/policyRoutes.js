const express = require("express");
const router = express.Router();
const policyController = require("../controllers/policyController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth(["citizen", "planner", "admin"]), policyController.getAll);
router.get(
  "/:id",
  auth(["citizen", "planner", "admin"]),
  policyController.getOne,
);
router.post("/", auth(["planner", "admin"]), policyController.create);
router.put("/:id", auth(["planner", "admin"]), policyController.update);
router.delete("/:id", auth(["planner", "admin"]), policyController.delete);

module.exports = router;
