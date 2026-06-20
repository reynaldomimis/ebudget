const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function inspect() {
  try {
    const noiseNames = [
      "Supply and Property management and disposal improved",
      "Office supplies, materials, furniture and fixtures procured on a timely and expeditious manner",
      "Repair and maintenance"
    ];

    for (const name of noiseNames) {
      console.log(`\n--- Inspecting: ${name} ---`);
      // Use HEX to see hidden characters
      const [rows] = await pool.execute(
        "SELECT id, HEX(expense_items) as items_hex, HEX(expense_items_sub) as sub_hex FROM mooe WHERE name = ?",
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
