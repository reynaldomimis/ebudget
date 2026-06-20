const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function audit() {
  try {
    // 1. Total Names (where name is present)
    const [totalNames] = await pool.execute(`
      SELECT COUNT(DISTINCT name) as count
      FROM mooe
      WHERE is_subtotal = 0 AND name IS NOT NULL AND TRIM(name) != ''
    `);

    // 2. Actionable Names (where name AND expense_items are present)
    const [actionableNames] = await pool.execute(`
      SELECT COUNT(DISTINCT name) as count
      FROM mooe
      WHERE is_subtotal = 0
        AND name IS NOT NULL AND TRIM(name) != ''
        AND expense_items IS NOT NULL AND TRIM(expense_items) != ''
    `);

    // 3. Example removed records
    const [removedRecords] = await pool.execute(`
      SELECT DISTINCT name
      FROM mooe
      WHERE is_subtotal = 0
        AND name IS NOT NULL AND TRIM(name) != ''
        AND (expense_items IS NULL OR TRIM(expense_items) = '')
      LIMIT 10
    `);

    // 4. Example remaining records
    const [remainingRecords] = await pool.execute(`
      SELECT DISTINCT name
      FROM mooe
      WHERE is_subtotal = 0
        AND name IS NOT NULL AND TRIM(name) != ''
        AND expense_items IS NOT NULL AND TRIM(expense_items) != ''
      LIMIT 10
    `);

    console.log("1. Name count before filter:", totalNames[0].count);
    console.log("2. Name count after filter:", actionableNames[0].count);

    console.log("\n3. Example removed records:");
    removedRecords.forEach(r => console.log("- " + r.name));

    console.log("\n4. Example remaining records:");
    remainingRecords.forEach(r => console.log("- " + r.name));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

audit();
