const { pool } = require("../config/database");

async function audit() {
  try {
    console.log("=== FINAL WORKFLOW SQL AUDIT ===");

    // 1. Queue Counts
    const statuses = ['Draft', 'For Review', 'Approved', 'Rejected', 'Partially Obligated', 'Obligated'];
    console.log("\n[1] Distribution of PRs by Workflow Status:");
    for (const status of statuses) {
      const [rows] = await pool.execute("SELECT COUNT(*) as count FROM pr_so WHERE workflow_status = ?", [status]);
      console.log(`${status.padEnd(20)}: ${rows[0].count}`);
    }

    // 2. Sample Data Verification (For Review)
    console.log("\n[2] Review Queue Content (Status: 'For Review'):");
    const [reviewRows] = await pool.execute("SELECT prno, purpose, amount, transaction_date FROM pr_so WHERE workflow_status = 'For Review' LIMIT 5");
    console.table(reviewRows);

    // 3. Partially Obligated PRs
    console.log("\n[3] Partially Obligated PRs (Should be visible for OBR):");
    const [partialRows] = await pool.execute("SELECT prno, purpose, amount, workflow_status FROM pr_so WHERE workflow_status = 'Partially Obligated'");
    console.table(partialRows);

    // 4. Audit Log Verification
    console.log("\n[4] Recent Workflow Audit Logs:");
    const [auditRows] = await pool.execute("SELECT action, details, timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT 5");
    auditRows.forEach(row => {
        console.log(`[${row.timestamp.toISOString()}] ${row.action}: ${row.details}`);
    });

    // 5. Remarks Verification
    console.log("\n[5] Latest Rejections (Remarks Check):");
    const [rejectRows] = await pool.execute("SELECT prno, remarks FROM pr_so WHERE workflow_status = 'Rejected' AND remarks IS NOT NULL ORDER BY id DESC LIMIT 1");
    if (rejectRows.length > 0) {
        console.log(`PR: ${rejectRows[0].prno} | Remarks: ${rejectRows[0].remarks}`);
    } else {
        console.log("No rejected records with remarks found.");
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

audit();
