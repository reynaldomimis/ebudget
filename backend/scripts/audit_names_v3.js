const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function audit() {
  try {
    // 1. All Names (Actionable or not)
    const [allNamesRows] = await pool.execute(`
      SELECT DISTINCT name FROM mooe
      WHERE is_subtotal = 0 AND name IS NOT NULL AND TRIM(name) != ''
    `);
    const allNames = allNamesRows.map(r => r.name);

    // 2. Actionable Names (at least one row has expense_items)
    const [actionableNamesRows] = await pool.execute(`
      SELECT DISTINCT name FROM mooe
      WHERE is_subtotal = 0
        AND name IS NOT NULL AND TRIM(name) != ''
        AND expense_items IS NOT NULL AND TRIM(expense_items) != ''
    `);
    const actionableNames = actionableNamesRows.map(r => r.name);

    // 3. Strictly Removed Names (No rows have expense_items)
    const removedNames = allNames.filter(name => !actionableNames.includes(name));

    console.log("1. Name count before filter:", allNames.length);
    console.log("2. Name count after filter:", actionableNames.length);
    console.log("3. Strictly removed names count:", removedNames.length);

    console.log("\nExample removed records (Top 10):");
    removedNames.slice(0, 10).forEach(n => console.log("- " + n));

    console.log("\nExample remaining records (Top 10):");
    actionableNames.slice(0, 10).forEach(n => console.log("- " + n));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

audit();
