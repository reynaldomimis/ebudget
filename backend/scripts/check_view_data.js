const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function check() {
  try {
    const [rows] = await pool.execute("SELECT * FROM vw_mooe_excel_full_report WHERE id = 6981");
    console.log("=== VIEW DATA FOR ID 6981 ===");
    console.table(rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
