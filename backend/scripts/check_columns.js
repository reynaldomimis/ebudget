const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require("../config/database");

async function check() {
  try {
    const [rows] = await pool.execute("SHOW COLUMNS FROM pr_so");
    console.log("COLUMNS OF pr_so:", JSON.stringify(rows, null, 2));

    const [viewRows] = await pool.execute("SELECT * FROM vw_pr_details LIMIT 1");
    console.log("SAMPLE VIEW ROW:", JSON.stringify(viewRows[0], null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
