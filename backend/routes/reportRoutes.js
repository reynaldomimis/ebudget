const express = require("express");
const router = express.Router();
const ReportController = require("../controllers/reportController");

router.get("/standard", ReportController.getStandardReport);

module.exports = router;
