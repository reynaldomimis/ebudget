const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require("../config/database");

async function cleanup() {
  try {
    console.log("Dropping transaction_date from pr_so...");
    await pool.execute("ALTER TABLE pr_so DROP COLUMN transaction_date");
    console.log("Successfully cleaned up pr_so schema.");
  } catch (err) {
    console.log("Note:", err.message);
  } finally {
    process.exit();
  }
}

cleanup();
