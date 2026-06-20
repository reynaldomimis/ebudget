const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function audit() {
  try {
    console.log("=== ALL OFFICES AND THEIR HIERARCHIES ===");
    const [rows] = await pool.execute(`
      SELECT DISTINCT office, pap_type, pap_des
      FROM mooe
      WHERE is_subtotal = 0
        AND expense_items IS NOT NULL AND expense_items != ''
      ORDER BY office, pap_type, pap_des
    `);

    console.table(rows);

    const offices = [...new Set(rows.map(r => r.office))];
    console.log("\nUnique Offices found in actionable rows:", offices);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

audit();
