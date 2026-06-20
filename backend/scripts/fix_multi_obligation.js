const { pool } = require("../config/database");

async function fix() {
  try {
    console.log("--- UPDATING WORKFLOW FOR MULTI-OBLIGATION SUPPORT ---");

    // 1. Update ENUM to include 'Partially Obligated'
    await pool.execute(`
      ALTER TABLE pr_so
      MODIFY COLUMN workflow_status ENUM('Draft', 'For Review', 'Approved', 'Rejected', 'Partially Obligated', 'Obligated')
      DEFAULT 'Draft'
    `);
    console.log("SUCCESS: ENUM updated to include 'Partially Obligated'.");

    process.exit(0);
  } catch (error) {
    console.error("Fix failed:", error);
    process.exit(1);
  }
}

fix();
