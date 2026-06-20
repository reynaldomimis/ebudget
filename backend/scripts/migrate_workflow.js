const { pool } = require("../config/database");

async function migrate() {
  try {
    console.log("--- STARTING WORKFLOW MIGRATION ---");

    // 1. Update ENUM values and set default to 'Draft'
    await pool.execute(`
      ALTER TABLE pr_so
      MODIFY COLUMN workflow_status ENUM('Draft', 'For Review', 'Approved', 'Rejected', 'Obligated')
      DEFAULT 'Draft'
    `);
    console.log("SUCCESS: pr_so table schema updated.");

    // 2. Initialize any NULL statuses to 'Draft'
    const [result] = await pool.execute("UPDATE pr_so SET workflow_status = 'Draft' WHERE workflow_status IS NULL");
    console.log(`INFO: Updated ${result.affectedRows} NULL records to 'Draft'.`);

    // 3. Update the view to include the latest columns if necessary (already handles workflow_status)
    // No changes needed to vw_pr_balances if it just selects workflow_status

    console.log("--- MIGRATION COMPLETED ---");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
