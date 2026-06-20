const express = require("express");
const router = express.Router();
const MOOEController = require("../controllers/MOOEController");

router.get("/", MOOEController.getAll);
router.get("/distinct/:field", MOOEController.getDistinctValues);
router.get("/:id", MOOEController.getById);
router.post("/", MOOEController.createPlanWithMOOE);
router.put("/:id", MOOEController.update);
router.delete("/:id", MOOEController.delete);
router.delete("/plan/:planId", MOOEController.deleteByPlanId);

module.exports = router;
