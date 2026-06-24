const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function describe() {
  try {
    const [pr_so] = await pool.execute("DESCRIBE pr_so");
    console.log("=== PR_SO TABLE ===");
    console.table(pr_so);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

describe();
