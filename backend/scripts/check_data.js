const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require("../config/database");

async function check() {
  try {
    const [rows] = await pool.execute("SELECT plan_id, pap_type, pap_des, total_amount, row_type FROM vw_mooe_excel_full_report LIMIT 10");
    console.log("SAMPLE DATA:", JSON.stringify(rows, null, 2));

    const [plans] = await pool.execute("SELECT * FROM plan_info ORDER BY created_at DESC");
    console.log("PLANS:", JSON.stringify(plans, null, 2));

    const [mooeCounts] = await pool.execute("SELECT plan_id, COUNT(*) as count FROM mooe GROUP BY plan_id");
    console.log("MOOE COUNTS BY PLAN:", JSON.stringify(mooeCounts, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
