const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Import database connection
const { testConnection } = require("./config/database");

// Import routes
const activitiesRoutes = require("./routes/activitiesRoutes");
const prSoRoutes = require("./routes/prSoRoutes");
const obligationRoutes = require("./routes/obligationRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Test database connection on startup
testConnection();

// API Routes
// app.use('/api/plan-info', planInfoRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/pr", prSoRoutes);
app.use("/api/obligation", obligationRoutes);
// app.use('/api/wfp', wfpRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "WFP System API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
