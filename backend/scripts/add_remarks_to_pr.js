const { pool } = require("../config/database");

async function run() {
  try {
    await pool.execute("ALTER TABLE pr_so ADD COLUMN remarks TEXT AFTER workflow_status");
    console.log('Column remarks added to pr_so');
    process.exit(0);
  } catch (e) {
    if (e.code === 'ER_DUP_COLUMN_NAME') {
        console.log('Column remarks already exists');
        process.exit(0);
    }
    console.error('Error: ' + e.message);
    process.exit(1);
  }
}

run();
