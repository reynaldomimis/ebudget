const express = require("express");
const router = express.Router();
const MonitoringController = require("../controllers/monitoringController");

router.get("/overview", MonitoringController.getOverview);
router.get("/pap-summary", MonitoringController.getPapSummary);
router.get("/workflow-summary", MonitoringController.getWorkflowSummary);
router.get("/prs", MonitoringController.getPRs);
router.get("/obligations", MonitoringController.getObligations);

module.exports = router;
