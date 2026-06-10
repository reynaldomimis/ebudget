const express = require("express");
const router = express.Router();
const PrSoController = require("../controllers/prSoController");

router.get("/", PrSoController.getAll);
router.get("/activity", PrSoController.getByActivitiesId);
router.get("/next-no", PrSoController.getNextNo);
router.post("/", PrSoController.create);
router.put("/:id", PrSoController.update);
router.put("/unobligated/:prno", PrSoController.updateUnobligatedAmount);
router.get("/activity-balance", PrSoController.getWithBalance);
router.get('/records/:id', PrSoController.getByRecordsId);
router.delete("/:id", PrSoController.delete);

module.exports = router;
