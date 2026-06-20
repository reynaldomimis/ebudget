const { pool } = require("../config/database");

async function check() {
  try {
    const [review] = await pool.execute("SELECT COUNT(*) as count FROM pr_so WHERE workflow_status = 'For Review'");
    const [approved] = await pool.execute("SELECT COUNT(*) as count FROM pr_so WHERE workflow_status = 'Approved'");
    const [partially] = await pool.execute("SELECT COUNT(*) as count FROM pr_so WHERE workflow_status = 'Partially Obligated'");

    console.log("--- QUEUE COUNTS ---");
    console.log(`Review Queue (For Review): ${review[0].count}`);
    console.log(`Approval Queue (Approved): ${approved[0].count}`);
    console.log(`Partially Obligated: ${partially[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
