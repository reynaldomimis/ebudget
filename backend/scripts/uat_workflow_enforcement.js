const PRService = require("../services/prService");
const ObligationService = require("../services/obligationService");
const { pool } = require("../config/database");

async function runUAT() {
  console.log("--- STARTING WORKFLOW ENFORCEMENT UAT ---");
  const mooeId = 4496;

  try {
    // 1. Setup: Create a new PR in Draft status
    console.log("\n[Test Case 1] Create PR (Draft) and try to obligate...");
    const prno = `PR-WF-UAT-${Date.now()}`;
    const resCreate = await PRService.createPR({
      mooe_id: mooeId,
      prno: prno,
      amount: 1000,
      transaction_date: new Date().toISOString().split('T')[0],
      purpose: "Workflow UAT"
    });
    const prId = resCreate.insertId;
    console.log(`PR Created: ${prno} (ID: ${prId})`);

    try {
      await ObligationService.createObligation({
        prno: prno,
        obrno: `OB-WF-FAIL1-${Date.now()}`,
        amount: 500,
        transaction_date: new Date().toISOString().split('T')[0],
        particular: "Should Fail"
      });
      console.log("VERDICT: FAILED (Obligation allowed for Draft PR)");
    } catch (error) {
      console.log(`PASSED: Blocked as expected. Error: ${error.message}`);
    }

    // 2. Submit: Transition to 'For Review'
    console.log("\n[Test Case 2] Submit PR (For Review) and try to obligate...");
    await PRService.submitPR(prId);
    console.log(`PR ${prno} submitted for review.`);

    try {
      await ObligationService.createObligation({
        prno: prno,
        obrno: `OB-WF-FAIL2-${Date.now()}`,
        amount: 500,
        transaction_date: new Date().toISOString().split('T')[0],
        particular: "Should Fail"
      });
      console.log("VERDICT: FAILED (Obligation allowed for 'For Review' PR)");
    } catch (error) {
      console.log(`PASSED: Blocked as expected. Error: ${error.message}`);
    }

    // 3. Reject: Transition to 'Rejected'
    console.log("\n[Test Case 3] Reject PR and try to obligate...");
    await PRService.rejectPR(prId, "Rejected for UAT test");
    console.log(`PR ${prno} rejected.`);

    try {
      await ObligationService.createObligation({
        prno: prno,
        obrno: `OB-WF-FAIL3-${Date.now()}`,
        amount: 500,
        transaction_date: new Date().toISOString().split('T')[0],
        particular: "Should Fail"
      });
      console.log("VERDICT: FAILED (Obligation allowed for 'Rejected' PR)");
    } catch (error) {
      console.log(`PASSED: Blocked as expected. Error: ${error.message}`);
    }

    // 4. Re-submit and Approve
    console.log("\n[Test Case 4] Approve PR and try to obligate...");
    await PRService.submitPR(prId);
    await PRService.approvePR(prId);
    console.log(`PR ${prno} approved.`);

    try {
      const resOb = await ObligationService.createObligation({
        prno: prno,
        obrno: `OB-WF-OK-${Date.now()}`,
        amount: 500,
        transaction_date: new Date().toISOString().split('T')[0],
        particular: "Should Succeed"
      });
      console.log("VERDICT: PASSED (Obligation allowed for 'Approved' PR)");

      // 5. Verify PR status changed to 'Obligated'
      console.log("\n[Test Case 5] Verify PR status changed to 'Obligated'...");
      const [prRow] = await pool.execute("SELECT workflow_status FROM pr_so WHERE id = ?", [prId]);
      console.log(`Current PR Status: ${prRow[0].workflow_status}`);
      if (prRow[0].workflow_status === 'Obligated') {
        console.log("VERDICT: PASSED (PR status updated to 'Obligated')");
      } else {
        console.log("VERDICT: FAILED (PR status not updated)");
      }
    } catch (error) {
      console.log(`VERDICT: FAILED (Obligation blocked for Approved PR). Error: ${error.message}`);
    }

    console.log("\n--- UAT COMPLETED ---");
    process.exit(0);
  } catch (error) {
    console.error("UAT encountered an error:", error);
    process.exit(1);
  }
}

runUAT();
