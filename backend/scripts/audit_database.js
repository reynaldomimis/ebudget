const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function audit() {
  try {
    const [rows] = await pool.execute(`
      SELECT id, name, expense_items, expense_items_sub
      FROM mooe
      WHERE id BETWEEN 4440 AND 4450
    `);
    console.log(JSON.stringify(rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

audit();
