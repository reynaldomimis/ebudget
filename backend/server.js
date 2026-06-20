const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection } = require("./config/database");
const { handleError } = require("./utils/errorHandler");

// Route Imports
const mooeRoutes = require("./routes/mooeRoutes");
const psRoutes = require("./routes/psRoutes");
const prRoutes = require("./routes/prRoutes");
const obligationRoutes = require("./routes/obligationRoutes");
const financialRoutes = require("./routes/financialRoutes");
const monitoringRoutes = require("./routes/monitoringRoutes");
const reportRoutes = require("./routes/reportRoutes");
const aiRoutes = require("./routes/aiRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

testConnection();

// Versioned API Routes
const apiV1 = express.Router();

apiV1.use("/mooe", mooeRoutes);
apiV1.use("/ps", psRoutes);
apiV1.use("/pr", prRoutes);
apiV1.use("/obligation", obligationRoutes);
apiV1.use("/financial", financialRoutes);
apiV1.use("/monitoring", monitoringRoutes);
apiV1.use("/reports", reportRoutes);
apiV1.use("/ai", aiRoutes);
apiV1.use("/dashboard", dashboardRoutes);
app.use("/api/v1", apiV1);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "OK", message: "WFP System API v1 is running" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  handleError(err, res);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
