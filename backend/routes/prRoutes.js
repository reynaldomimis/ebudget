const express = require("express");
const router = express.Router();
const PrController = require("../controllers/prController");

router.get("/", PrController.getAll);
router.get("/activity", PrController.getByActivitiesId);
router.get("/next-no", PrController.getNextNo);
router.post("/", PrController.create);
router.put("/:id", PrController.update);
router.put("/unobligated/:prno", PrController.updateUnobligatedAmount);
router.get("/activity-balance", PrController.getWithBalance);
router.get("/records/:id", PrController.getByRecordsId);
router.delete("/:id", PrController.delete);

module.exports = router;
