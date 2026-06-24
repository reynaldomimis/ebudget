const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function audit() {
  try {
    const [cols] = await pool.execute("SHOW COLUMNS FROM obligation");
    console.table(cols);

    const [rows] = await pool.execute("SELECT * FROM obligation LIMIT 1");
    console.log("Sample Row:", rows[0]);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

audit();
