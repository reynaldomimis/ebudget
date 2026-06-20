const express = require("express");
const router = express.Router();
const PrController = require("../controllers/prController");

router.get("/", PrController.getAll);
router.get("/mooe", PrController.getByMOOEId);
router.get("/next-no", PrController.getNextNo);
router.post("/", PrController.create);
router.put("/:id", PrController.update);
router.get("/mooe-balance", PrController.getWithBalance);
router.get("/records/:id", PrController.getByRecordsId);
router.delete("/:id", PrController.delete);

router.post("/:id/submit", PrController.submit);
router.post("/:id/approve", PrController.approve);
router.post("/:id/reject", PrController.reject);

module.exports = router;
