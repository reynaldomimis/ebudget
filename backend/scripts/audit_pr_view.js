const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function audit() {
  try {
    const [rows] = await pool.execute("SELECT * FROM vw_pr_details LIMIT 1");
    console.log("vw_pr_details sample:", rows[0]);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

audit();
