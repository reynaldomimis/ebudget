const { pool } = require("../config/database");
const PRService = require("../services/prService");
const BalanceEngine = require("../engines/BalanceEngine");

async function runUAT() {
    console.log("--- STARTING FULL PR UAT ---");
    const mooeId = 4496;

    try {
        // Step 1: Check Initial Balance
        console.log("\n[Step 0] Checking Initial State...");
        const initialAvailable = await BalanceEngine.getAvailableAllocation(mooeId);
        console.log(`Initial Available Allocation: ${initialAvailable}`);

        // Step 2: Create PR (50,000)
        console.log("\n[Step 1 & 2] Creating PR (50,000)...");
        const prno1 = `PR-UAT-STEP1-${Date.now()}`;
        const prData1 = {
            prno: prno1,
            mooe_id: mooeId,
            amount: 50000,
            transaction_date: new Date().toISOString().split('T')[0],
            purpose: "UAT Step 1"
        };
        const res1 = await PRService.createPR(prData1);
        console.log("API Response (Service Result):", res1);

        const [row1] = await pool.execute("SELECT * FROM pr_so WHERE id = ?", [res1.insertId]);
        console.log("Inserted Row:", row1[0]);

        // Step 3: Verify vw_pr_balances
        console.log("\n[Step 3] Verifying vw_pr_balances...");
        const [viewRes1] = await pool.execute("SELECT * FROM vw_pr_balances WHERE mooe_id = ?", [mooeId]);
        // Note: The view might sum all PRs for this mooe_id, so we need to account for pre-existing data
        console.log("vw_pr_balances result:", viewRes1);

        // Step 4: Verify Available Allocation
        console.log("\n[Step 4] Checking Available Allocation after first PR...");
        const availableAfter1 = await BalanceEngine.getAvailableAllocation(mooeId);
        console.log(`Available Allocation: ${availableAfter1}`);
        console.log(`Reduction: ${initialAvailable - availableAfter1}`);

        // Step 6: Create second PR (100,000)
        console.log("\n[Step 6] Creating second PR (100,000)...");
        const prno2 = `PR-UAT-STEP6-${Date.now()}`;
        const prData2 = {
            prno: prno2,
            mooe_id: mooeId,
            amount: 100000,
            transaction_date: new Date().toISOString().split('T')[0],
            purpose: "UAT Step 6"
        };
        await PRService.createPR(prData2);
        const availableAfter2 = await BalanceEngine.getAvailableAllocation(mooeId);
        console.log(`Available Allocation: ${availableAfter2}`);

        // Step 7: Attempt Over Allocation (1,400,000)
        console.log("\n[Step 7] Attempting Over Allocation (1,400,000)...");
        const prData3 = {
            prno: `PR-UAT-FAIL-${Date.now()}`,
            mooe_id: mooeId,
            amount: 1400000,
            transaction_date: new Date().toISOString().split('T')[0],
            purpose: "UAT Step 7 - Should Fail"
        };
        try {
            await PRService.createPR(prData3);
            console.log("VERDICT: FAILED (Over-allocation was allowed)");
        } catch (error) {
            console.log("Expected Error Received:", error.message);
            if (error.message.includes("Insufficient allocation")) {
                console.log("VERDICT: PASSED (Over-allocation rejected correctly)");
            } else {
                console.log("VERDICT: UNKNOWN ERROR", error);
            }
        }

        console.log("\n--- UAT COMPLETED ---");
        process.exit(0);
    } catch (error) {
        console.error("UAT FAILED with error:", error);
        process.exit(1);
    }
}

runUAT();
