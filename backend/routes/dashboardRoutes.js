const express = require("express");
const router = express.Router();
const DashboardController = require("../controllers/dashboardController");

router.get("/executive-summary", DashboardController.getExecutiveSummary);
router.get("/audit-feed", DashboardController.getAuditFeed);

module.exports = router;
