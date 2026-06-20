const { pool } = require("../config/database");

async function backfill() {
  try {
    const [result] = await pool.execute("UPDATE pr_so SET purpose = '' WHERE purpose IS NULL");
    console.log(`Updated ${result.affectedRows} records with NULL purpose.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

backfill();
