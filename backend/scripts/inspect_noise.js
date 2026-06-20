const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function inspect() {
  try {
    const names = [
      "Supply and Property management and disposal improved",
      "Office supplies, materials, furniture and fixtures procured on a timely and expeditious manner",
      "Repair and maintenance"
    ];

    for (const name of names) {
      console.log(`\n--- Inspecting: ${name} ---`);
      const [rows] = await pool.execute(
        "SELECT id, expense_items, expense_items_sub, is_subtotal FROM mooe WHERE name = ?",
        [name]
      );
      console.table(rows);
    }

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

inspect();
