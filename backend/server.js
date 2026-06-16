const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection } = require("./config/database");

const activityRoutes = require("./routes/activityRoutes");
const prRoutes = require("./routes/prRoutes");
const obligationRoutes = require("./routes/obligationRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

testConnection();

app.use("/api/activities", activityRoutes);
app.use("/api/pr", prRoutes);
app.use("/api/obligation", obligationRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "WFP System API is running" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
