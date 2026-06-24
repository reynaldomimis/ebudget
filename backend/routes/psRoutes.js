const express = require("express");
const router = express.Router();
const PSController = require("../controllers/PSController");

router.post("/", PSController.createPlanWithPS);
router.put("/:id", PSController.update);
router.delete("/:id", PSController.delete);

module.exports = router;
