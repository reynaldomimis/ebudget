const express = require("express");
const router = express.Router();
const ObligationController = require("../controllers/obligationController");

router.get("/next-no", ObligationController.getNextNo);
router.post("/", ObligationController.create);
router.put("/:id", ObligationController.update);
router.delete("/:id", ObligationController.delete);

module.exports = router;
