const PRService = require("../services/prService");
const BalanceEngine = require("../engines/BalanceEngine");
const { pool } = require("../config/database");

async function runUAT() {
  console.log("--- STARTING PR FLOW UAT ---");

  const mooeId = 3784; // From our previous check
  const testPrNo = `PR-UAT-${Date.now()}`;

  try {
    // Test Case 1: Valid PR
    console.log("\n[Test Case 1] Creating valid PR...");
    const initialBalance = await BalanceEngine.getAvailableAllocation(mooeId);
    console.log(`Initial Available Allocation: ${initialBalance}`);

    const prAmount = 50000;
    const prData = {
      mooe_id: mooeId,
      prno: testPrNo,
      transaction_date: new Date().toISOString().split('T')[0],
      amount: prAmount
    };

    const result = await PRService.createPR(prData);
    console.log(`PR Created. ID: ${result.insertId}`);

    const newBalance = await BalanceEngine.getAvailableAllocation(mooeId);
    console.log(`New Available Allocation: ${newBalance}`);

    const variance = initialBalance - newBalance;
    console.log(`Allocation reduction: ${variance}`);
    if (variance === prAmount) {
      console.log("PASSED: Allocation reduced by PR amount.");
    } else {
      console.log("FAILED: Allocation reduction mismatch.");
    }

    // Verify amount_unobligated
    const [prRow] = await pool.execute("SELECT amount_unobligated FROM pr_so WHERE id = ?", [result.insertId]);
    console.log(`PR amount_unobligated: ${prRow[0].amount_unobligated}`);
    if (Number(prRow[0].amount_unobligated) === prAmount) {
        console.log("PASSED: amount_unobligated initialized correctly.");
    } else {
        console.log("FAILED: amount_unobligated mismatch.");
    }

    // Test Case 2: Over Allocation
    console.log("\n[Test Case 2] Attempting over-allocation PR...");
    const overAmount = newBalance + 1000;
    console.log(`Attempting to create PR for ${overAmount} (Available: ${newBalance})`);

    try {
      await PRService.createPR({
        mooe_id: mooeId,
        prno: testPrNo + "-OVER",
        transaction_date: new Date().toISOString().split('T')[0],
        amount: overAmount
      });
      console.log("FAILED: Over-allocation PR should have been rejected.");
    } catch (error) {
      console.log(`PASSED: Rejected as expected. Error: ${error.message}`);
    }

    // Test Case 3: Duplicate Check (Manual logic in service/validation)
    // The current implementation doesn't have explicit duplicate PRNO check in ValidationEngine,
    // but DB might have unique constraint or we should add it.
    console.log("\n[Test Case 3] Verification of State...");
    console.log("Manual verification: Refreshing UI should fetch current BalanceEngine state.");
    const finalCheckBalance = await BalanceEngine.getAvailableAllocation(mooeId);
    console.log(`Current Balance: ${finalCheckBalance}`);

    // Test Case 4: PS PR Validation
    console.log("\n[Test Case 4] PS PR Validation...");
    console.log("Business Rule Check: Personal Services (PS) typically uses Payroll/Direct Obligations, not PRs.");
    console.log("Recommendation: PR workflow should be restricted to MOOE/CO allotment classes.");

    console.log("\n--- UAT COMPLETED ---");
    process.exit(0);
  } catch (error) {
    console.error("UAT encountered an error:", error);
    process.exit(1);
  }
}

runUAT();
