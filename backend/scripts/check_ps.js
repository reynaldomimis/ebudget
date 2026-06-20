const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function checkPS() {
  try {
    const names = [
      "Supply and Property management and disposal improved",
      "Office supplies, materials, furniture and fixtures procured on a timely and expeditious manner"
    ];

    for (const name of names) {
      console.log(`Checking PS for: ${name}`);
      const [rows] = await pool.execute("SELECT * FROM ps WHERE pap_des LIKE ?", [`%${name}%`]);
      console.table(rows);
    }

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkPS();
