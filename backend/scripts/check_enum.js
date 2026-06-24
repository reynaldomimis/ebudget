const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function check() {
  try {
    const [rows] = await pool.execute("SHOW COLUMNS FROM pr_so LIKE 'workflow_status'");
    console.log("Column Type:", rows[0].Type);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
