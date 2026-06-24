const express = require("express");
const router = express.Router();
const PrController = require("../controllers/prController");

router.get("/next-no", PrController.getNextNo);
router.post("/", PrController.create);
router.get("/:id", PrController.getById);
router.put("/:id", PrController.update);
router.delete("/:id", PrController.delete);

router.post("/:id/submit", PrController.submit);
router.post("/:id/approve", PrController.approve);
router.post("/:id/reject", PrController.reject);

module.exports = router;
