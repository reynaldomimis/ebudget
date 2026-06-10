const express = require("express");
const router = express.Router();
const ActivitiesController = require("../controllers/activitiesController");

router.get("/", ActivitiesController.getAll);
router.get("/distinct/:field", ActivitiesController.getDistinctValues);
router.post("/", ActivitiesController.createPlanWithActivities);
router.put("/:id", ActivitiesController.update);
router.put("/:id/total-fq", ActivitiesController.updateTotalFq);
router.delete("/:id", ActivitiesController.delete);
router.delete("/plan/:plan_id", ActivitiesController.deleteByPlanId);

module.exports = router;
