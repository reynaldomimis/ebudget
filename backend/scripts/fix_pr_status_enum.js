const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function fix() {
  try {
    const query = `
      ALTER TABLE pr_so
      MODIFY COLUMN workflow_status ENUM(
        'Draft',
        'For Review',
        'Reviewed',
        'Approved',
        'Rejected',
        'Partially Obligated',
        'Obligated'
      ) DEFAULT 'Draft'
    `;
    await pool.execute(query);
    console.log('Table pr_so altered successfully to include Reviewed status');
    process.exit(0);
  } catch (e) {
    console.error('Error: ' + e.message);
    process.exit(1);
  }
}

fix();
