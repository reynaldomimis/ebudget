const express = require("express");
const router = express.Router();
const MOOEController = require("../controllers/MOOEController");

router.post("/", MOOEController.createPlanWithMOOE);
router.put("/:id", MOOEController.update);
router.delete("/:id", MOOEController.delete);
router.delete("/plan/:planId", MOOEController.deleteByPlanId);

module.exports = router;
