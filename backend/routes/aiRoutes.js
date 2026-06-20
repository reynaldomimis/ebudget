const express = require("express");
const router = express.Router();
const AIController = require("../controllers/aiController");

router.get("/context", AIController.getContext);

module.exports = router;
