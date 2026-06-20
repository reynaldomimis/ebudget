const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function deepInspect() {
  try {
    const name = "Supply and Property management and disposal improved";
    console.log(`Checking ALL occurrences of name: "${name}"`);

    const [rows] = await pool.execute(
      "SELECT id, expense_items, expense_items_sub, is_subtotal, pap_type, office FROM mooe WHERE name LIKE ?",
      [`%${name}%`]
    );

    console.table(rows);

    if (rows.length === 0) {
        console.log("No exact match found. Checking partial matches...");
    }

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

deepInspect();
