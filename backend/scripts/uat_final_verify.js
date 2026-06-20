const PRService = require("../services/prService");
const { pool } = require("../config/database");

async function verify() {
  try {
    console.log("--- FINAL REJECT/APPROVE VERIFICATION ---");

    // Get a PR for review
    const [prs] = await pool.execute("SELECT id, prno FROM pr_so WHERE workflow_status = 'For Review' LIMIT 1");
    if (prs.length === 0) {
      console.log("No PRs for review found. Creating one...");
      const res = await PRService.createPR({
          mooe_id: 4496,
          prno: `PR-VERIFY-${Date.now()}`,
          amount: 500,
          transaction_date: new Date().toISOString().split('T')[0],
          purpose: "Final Audit Verify"
      });
      await PRService.submitPR(res.insertId);
      prs.push({ id: res.insertId, prno: `PR-VERIFY-${Date.now()}` });
    }

    const target = prs[0];
    console.log(`Testing with PR: ${target.prno} (ID: ${target.id})`);

    // 1. Test Reject
    console.log("\n[1] Testing Rejection...");
    await PRService.rejectPR(target.id, "Audit rejection test remarks", 1);
    const [rejectRow] = await pool.execute("SELECT workflow_status, remarks FROM pr_so WHERE id = ?", [target.id]);
    console.log(`Status: ${rejectRow[0].workflow_status} | Remarks: ${rejectRow[0].remarks}`);

    // 2. Test Resubmit and Approve
    console.log("\n[2] Testing Resubmit and Approve...");
    await PRService.submitPR(target.id, 1);
    await PRService.approvePR(target.id, 1);
    const [approveRow] = await pool.execute("SELECT workflow_status FROM pr_so WHERE id = ?", [target.id]);
    console.log(`Status: ${approveRow[0].workflow_status}`);

    // 3. Check Audit Logs
    console.log("\n[3] Checking Audit Logs...");
    const [logs] = await pool.execute("SELECT action, details FROM audit_logs ORDER BY id DESC LIMIT 3");
    logs.forEach(l => console.log(`${l.action}: ${l.details}`));

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

verify();
