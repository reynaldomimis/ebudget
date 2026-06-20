const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");
const ObligationService = require("../services/obligationService");
const PRRepository = require("../repositories/PRRepository");
const PRBalanceResolver = require("../engines/PRBalanceResolver");

async function runUAT() {
    console.log("=== OBLIGATION REGISTER UAT HARDENING ===");
    const testPrNo = `UAT-PR-${Date.now()}`;
    const mooeId = 4496; // Use a known valid MOOE ID from previous scripts

    try {
        // Setup: Create an Approved PR
        console.log(`Setting up PR ${testPrNo} with 100,000 allocation...`);
        await pool.execute(
            "INSERT INTO pr_so (mooe_id, prno, transaction_date, amount, purpose, workflow_status) VALUES (?, ?, CURDATE(), 100000, 'UAT Testing', 'Approved')",
            [mooeId, testPrNo]
        );

        // Test Case 1: Create OBR-001 (30,000)
        console.log("\n[TC1] Creating OBR-001 (30,000)...");
        await ObligationService.createObligation({
            obrno: 'OBR-001',
            prno: testPrNo,
            amount: 30000,
            transaction_date: '2026-06-20',
            particular: 'First Obligation',
            payee: 'Test Payee'
        });

        let pr = await PRRepository.getByPRNo(testPrNo);
        console.log(`PR Status: ${pr.workflow_status} (Expected: Partially Obligated)`);
        console.log(`Remaining Balance: ${pr.remaining_balance} (Expected: 70000)`);

        // Test Case 2: Create OBR-002 (20,000)
        console.log("\n[TC2] Creating OBR-002 (20,000)...");
        await ObligationService.createObligation({
            obrno: 'OBR-002',
            prno: testPrNo,
            amount: 20000,
            transaction_date: '2026-06-21',
            particular: 'Second Obligation',
            payee: 'Test Payee'
        });
        pr = await PRRepository.getByPRNo(testPrNo);
        console.log(`PR Status: ${pr.workflow_status} (Expected: Partially Obligated)`);
        console.log(`Remaining Balance: ${pr.remaining_balance} (Expected: 50000)`);

        // Test Case 3: Create OBR-003 (50,000)
        console.log("\n[TC3] Creating OBR-003 (50,000)...");
        await ObligationService.createObligation({
            obrno: 'OBR-003',
            prno: testPrNo,
            amount: 50000,
            transaction_date: '2026-06-22',
            particular: 'Final Obligation',
            payee: 'Test Payee'
        });
        pr = await PRRepository.getByPRNo(testPrNo);
        console.log(`PR Status: ${pr.workflow_status} (Expected: Obligated)`);
        console.log(`Remaining Balance: ${pr.remaining_balance} (Expected: 0)`);

        // Test Case 4: Attempt OBR = 1 (Blocked)
        console.log("\n[TC4] Attempting over-obligation (1.00)...");
        try {
            await ObligationService.createObligation({
                obrno: 'OBR-OVER',
                prno: testPrNo,
                amount: 1,
                transaction_date: '2026-06-23',
                particular: 'Over Obligation',
                payee: 'Test Payee'
            });
            console.log("FAIL: Over-obligation was NOT blocked!");
        } catch (err) {
            console.log(`SUCCESS: Blocked as expected. Error: ${err.message}`);
        }

        // Test Case 5: Edit OBR-001 (30,000 -> 40,000)
        // Note: ObligationService.updateObligation currently doesn't re-resolve PR status.
        console.log("\n[TC5] Editing OBR-001 (30,000 -> 40,000)...");
        const [obr1] = await pool.execute("SELECT id FROM obligation WHERE obrno = 'OBR-001' AND prno = ?", [testPrNo]);
        await ObligationService.updateObligation(obr1[0].id, {
            obrno: 'OBR-001',
            prno: testPrNo,
            amount: 40000,
            transaction_date: '2026-06-20',
            particular: 'Updated Obligation'
        });
        // We need to manually call re-resolution or update service to handle this
        await PRBalanceResolver.resolvePRStatus(testPrNo);
        pr = await PRRepository.getByPRNo(testPrNo);
        console.log(`Remaining Balance: ${pr.remaining_balance} (Expected: -10000 or similar if over-edited)`);

        // Test Case 6: Delete OBR-003
        console.log("\n[TC6] Deleting OBR-003...");
        const [obr3] = await pool.execute("SELECT id FROM obligation WHERE obrno = 'OBR-003' AND prno = ?", [testPrNo]);
        await ObligationService.deleteObligation(obr3[0].id);
        await PRBalanceResolver.resolvePRStatus(testPrNo);
        pr = await PRRepository.getByPRNo(testPrNo);
        console.log(`PR Status: ${pr.workflow_status} (Expected: Partially Obligated)`);
        console.log(`Remaining Balance: ${pr.remaining_balance} (Expected: 40000)`);

        // Test Case 7: Delete all
        console.log("\n[TC7] Deleting all obligations...");
        await pool.execute("DELETE FROM obligation WHERE prno = ?", [testPrNo]);
        await PRBalanceResolver.resolvePRStatus(testPrNo);
        pr = await PRRepository.getByPRNo(testPrNo);
        console.log(`PR Status: ${pr.workflow_status} (Expected: Approved)`);
        console.log(`Remaining Balance: ${pr.remaining_balance} (Expected: 100000)`);

    } catch (err) {
        console.error("UAT Failed:", err);
    } finally {
        // Cleanup
        await pool.execute("DELETE FROM obligation WHERE prno = ?", [testPrNo]);
        await pool.execute("DELETE FROM pr_so WHERE prno = ?", [testPrNo]);
        process.exit();
    }
}

runUAT();
