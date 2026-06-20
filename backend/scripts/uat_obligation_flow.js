const ObligationService = require("../services/obligationService");
const BalanceEngine = require("../engines/BalanceEngine");
const PRRepository = require("../repositories/PRRepository");
const { pool } = require("../config/database");

async function runUAT() {
  console.log("--- STARTING DYNAMIC OBLIGATION FLOW UAT (SINGLE SOURCE OF TRUTH) ---");

  const testPrNo = "PR-UAT-1781763278402";
  const psId = 481;

  try {
    // 1. Reset: Delete all obligations for this PR
    await pool.execute("DELETE FROM obligation WHERE prno = ?", [testPrNo]);
    console.log("Obligations reset for PR.");

    // 2. Initial State Verification (Using PRRepository which now uses the View)
    const initialPR = await PRRepository.getByPRNo(testPrNo);
    console.log(`Initial PR State - Amount: ${initialPR.pr_amount}, Obligated: ${initialPR.obligated_amount}, Remaining: ${initialPR.remaining_balance}`);

    // Test Case 1: Partial Obligation
    console.log("\n[Test Case 1] Partial Obligation (20,000 of 50,000)...");
    const ob1Data = {
      prno: testPrNo,
      obrno: `OB-UAT-D1-${Date.now()}`,
      transaction_date: new Date().toISOString().split('T')[0],
      particular: "Dynamic Payment 1",
      amount: 20000
    };
    await ObligationService.createObligation(ob1Data);

    const pr1 = await PRRepository.getByPRNo(testPrNo);
    console.log(`PR State - Obligated: ${pr1.obligated_amount}, Remaining: ${pr1.remaining_balance}, Fully Obligated: ${pr1.is_fully_obligated}`);

    if (Number(pr1.remaining_balance) === 30000) {
        console.log("PASSED: remaining_balance = 30,000");
    } else {
        console.log("FAILED: balance mismatch");
    }

    // Test Case 2: Multiple Partial Obligations
    console.log("\n[Test Case 2] Second Partial Obligation (15,000)...");
    await ObligationService.createObligation({
      prno: testPrNo,
      obrno: `OB-UAT-D2-${Date.now()}`,
      transaction_date: new Date().toISOString().split('T')[0],
      particular: "Dynamic Payment 2",
      amount: 15000
    });

    const pr2 = await PRRepository.getByPRNo(testPrNo);
    console.log(`PR State - Obligated: ${pr2.obligated_amount}, Remaining: ${pr2.remaining_balance}`);
    if (Number(pr2.remaining_balance) === 15000) {
        console.log("PASSED: remaining_balance = 15,000");
    } else {
        console.log("FAILED: balance mismatch");
    }

    // Test Case 4: Over Obligation
    console.log("\n[Test Case 4] Over Obligation Attempt (20,000 when 15,000 remains)...");
    try {
        await ObligationService.createObligation({
            prno: testPrNo,
            obrno: `OB-UAT-DOVER-${Date.now()}`,
            transaction_date: new Date().toISOString().split('T')[0],
            particular: "Over Payment Attempt",
            amount: 20000
        });
        console.log("FAILED: Over-obligation should have been rejected.");
    } catch (error) {
        console.log(`PASSED: Rejected. Error: ${error.message}`);
    }

    // Test Case 3: Full Obligation
    console.log("\n[Test Case 3] Full Obligation (Final 15,000)...");
    await ObligationService.createObligation({
      prno: testPrNo,
      obrno: `OB-UAT-D3-${Date.now()}`,
      transaction_date: new Date().toISOString().split('T')[0],
      particular: "Dynamic Full Payment",
      amount: 15000
    });

    const pr3 = await PRRepository.getByPRNo(testPrNo);
    console.log(`PR State - Remaining: ${pr3.remaining_balance}, Is Fully Obligated: ${pr3.is_fully_obligated}`);
    if (Number(pr3.remaining_balance) === 0 && pr3.is_fully_obligated === 1) {
        console.log("PASSED: PR Fully Obligated (Dynamically calculated).");
    } else {
        console.log("FAILED: PR state mismatch");
    }

    console.log("\n--- DYNAMIC UAT COMPLETED ---");
    process.exit(0);
  } catch (error) {
    console.error("UAT encountered an error:", error);
    process.exit(1);
  }
}

runUAT();
