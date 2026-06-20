const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function describe() {
  try {
    const [mooe] = await pool.execute("DESCRIBE mooe");
    console.log("=== MOOE TABLE ===");
    console.table(mooe);

    const [ps] = await pool.execute("DESCRIBE ps");
    console.log("\n=== PS TABLE ===");
    console.table(ps);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

describe();
