const { pool } = require("../config/database");

async function run() {
  try {
    // 1. Change schema default
    await pool.execute("ALTER TABLE pr_so MODIFY COLUMN workflow_status ENUM('Draft', 'For Review', 'Approved', 'Rejected') DEFAULT 'For Review'");
    console.log('Database schema updated: Default workflow_status is now "For Review"');

    // 2. Update existing records that are currently 'Draft' or NULL
    const [result] = await pool.execute("UPDATE pr_so SET workflow_status = 'For Review' WHERE workflow_status = 'Draft' OR workflow_status IS NULL");
    console.log(`Updated ${result.affectedRows} existing records to "For Review"`);

    process.exit(0);
  } catch (e) {
    console.error('Error: ' + e.message);
    process.exit(1);
  }
}

run();
