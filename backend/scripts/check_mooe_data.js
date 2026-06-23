const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function check() {
  try {
    const [rows] = await pool.execute("SELECT id, name, expense_items, expense_items_sub, totalFq FROM mooe WHERE is_deleted = 0 LIMIT 10");
    console.log("=== MOOE SAMPLE DATA ===");
    console.table(rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
