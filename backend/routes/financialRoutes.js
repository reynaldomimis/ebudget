const express = require("express");
const router = express.Router();
const FinancialController = require("../controllers/financialController");

router.get("/summary/executive", FinancialController.getExecutiveSummary);
router.get("/summary/pap", FinancialController.getPapSummary);
router.get("/pap-detail", FinancialController.getPapDetail);
router.get("/registry", FinancialController.getBudgetRegistry);
router.get("/filters", FinancialController.getFilters);
router.get("/balance", FinancialController.getBalance);

module.exports = router;
