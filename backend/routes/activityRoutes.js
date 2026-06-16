const express = require("express");
const router = express.Router();
const ActivityController = require("../controllers/activityController");

router.get("/", ActivityController.getAll);
router.get("/distinct/:field", ActivityController.getDistinctValues);
router.post("/", ActivityController.createPlanWithActivities);
router.put("/:id", ActivityController.update);
router.delete("/:id", ActivityController.delete);
router.delete("/plan/:planId", ActivityController.deleteByPlanId);

module.exports = router;
