const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function check() {
  try {
    const plan_id = "PLAN-2026-1781768962925";
    const [rows] = await pool.execute(
      "SELECT id, name, expense_items, expense_items_sub FROM mooe WHERE plan_id = ? AND is_subtotal = 0",
      [plan_id]
    );
    console.log(`Plan ${plan_id} has ${rows.length} rows.`);

    const noiseNames = [
      "Supply and Property management and disposal improved",
      "Office supplies, materials, furniture and fixtures procured on a timely and expeditious manner"
    ];

    noiseNames.forEach(noise => {
        const found = rows.filter(r => r.name.includes(noise));
        console.log(`Searching for "${noise}": found ${found.length} occurrences.`);
        if (found.length > 0) {
            console.table(found);
        }
    });

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
