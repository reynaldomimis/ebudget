const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require("../config/database");

async function update() {
  try {
    console.log("Adding transaction_date to pr_so...");
    await pool.execute("ALTER TABLE pr_so ADD COLUMN transaction_date DATE AFTER prno");

    console.log("Updating existing records to have transaction_date from created_at...");
    await pool.execute("UPDATE pr_so SET transaction_date = DATE(created_at) WHERE transaction_date IS NULL");

    console.log("Successfully updated pr_so schema.");
  } catch (err) {
    console.error("Failed to update schema:", err.message);
  } finally {
    process.exit();
  }
}

update();
