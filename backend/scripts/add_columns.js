const { pool } = require("../config/database");

async function addColumns() {
  try {
    await pool.execute("ALTER TABLE pr_so ADD COLUMN workflow_status ENUM('Draft', 'For Review', 'Approved', 'Rejected') DEFAULT 'Draft' AFTER purpose");
    console.log('Column workflow_status added to pr_so');
    process.exit(0);
  } catch (e) {
    console.error('Error: ' + e.message);
    process.exit(1);
  }
}

addColumns();
