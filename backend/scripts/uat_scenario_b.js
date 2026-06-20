const PRService = require("../services/prService");
const ObligationService = require("../services/obligationService");
const { pool } = require("../config/database");

async function runUAT() {
  console.log("--- STARTING SCENARIO B UAT (MULTI-OBLIGATION) ---");
  const mooeId = 4496;

  try {
    // 1. Create PR (100,000)
    const prno = `PR-SCEN-B-${Date.now()}`;
    const resCreate = await PRService.createPR({
      mooe_id: mooeId,
      prno: prno,
      amount: 100000,
      transaction_date: new Date().toISOString().split('T')[0],
      purpose: "Scenario B Test"
    });
    const prId = resCreate.insertId;
    await PRService.submitPR(prId);
    await PRService.approvePR(prId);
    console.log(`PR ${prno} Approved. Total: 100,000`);

    // 2. Create Partial Obligation (30,000)
    console.log("\n[Step 1] Creating Partial Obligation (30,000)...");
    await ObligationService.createObligation({
      prno: prno,
      obrno: `OB-SCEN-B-1-${Date.now()}`,
      amount: 30000,
      transaction_date: new Date().toISOString().split('T')[0],
      particular: "Partial Payment 1"
    });

    const [row1] = await pool.execute("SELECT workflow_status FROM pr_so WHERE id = ?", [prId]);
    console.log(`PR Status: ${row1[0].workflow_status}`);
    if (row1[0].workflow_status === 'Partially Obligated') {
        console.log("PASSED: Status is 'Partially Obligated'");
    } else {
        console.log("FAILED: Status mismatch");
    }

    // 3. Create Second Obligation (70,000) - THIS WOULD HAVE FAILED BEFORE
    console.log("\n[Step 2] Creating Final Obligation (70,000)...");
    await ObligationService.createObligation({
      prno: prno,
      obrno: `OB-SCEN-B-2-${Date.now()}`,
      amount: 70000,
      transaction_date: new Date().toISOString().split('T')[0],
      particular: "Final Payment"
    });

    const [row2] = await pool.execute("SELECT workflow_status FROM pr_so WHERE id = ?", [prId]);
    console.log(`PR Status: ${row2[0].workflow_status}`);
    if (row2[0].workflow_status === 'Obligated') {
        console.log("PASSED: Status is 'Obligated' (Fully)");
    } else {
        console.log("FAILED: Status mismatch");
    }

    console.log("\n--- SCENARIO B UAT COMPLETED ---");
    process.exit(0);
  } catch (error) {
    console.error("UAT encountered an error:", error);
    process.exit(1);
  }
}

runUAT();
