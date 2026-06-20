const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");
const FinancialEngine = require("../engines/FinancialEngine");
const DashboardService = require("../services/DashboardService");
const MOOERepository = require("../repositories/MOOERepository");

async function audit() {
    console.log("=== SOFT DELETE INTERACTION AUDIT ===");

    // 1. Create a dummy MOOE
    const [ins] = await pool.execute(`
        INSERT INTO mooe (plan_id, plan_year, pap_type, pap_des, office, name, expense_items, totalFq, is_deleted)
        VALUES ('AUDIT-PLAN', 2026, 'TYPE', 'DES', 'OFFICE', 'NAME', 'EXPENSE', 500000, 0)
    `);
    const mooeId = ins.insertId;
    console.log(`Created dummy MOOE ID: ${mooeId}`);

    // 2. Create a PR for it
    const [insPr] = await pool.execute(`
        INSERT INTO pr_so (mooe_id, prno, amount, workflow_status, is_deleted)
        VALUES (?, 'PR-AUDIT-DEL', 100000, 'Approved', 0)
    `);
    const prId = insPr.insertId;
    console.log(`Created dummy PR ID: ${prId}`);

    // 3. Create an Obligation for it
    const [insOb] = await pool.execute(`
        INSERT INTO obligation (mooe_id, pr_id, prno, obrno, amount, is_deleted)
        VALUES (?, ?, 'PR-AUDIT-DEL', 'OBR-AUDIT-DEL', 50000, 0)
    `);
    const obId = insOb.insertId;
    console.log(`Created dummy Obligation ID: ${obId}`);

    // 4. Verify they contribute to totals
    let summary = await FinancialEngine.getExecutiveSummary('AUDIT-PLAN');
    console.log(`Initial Total Budget (Audit Plan): ${summary.grandTotal}`);
    console.log(`Initial Total Obligated: ${summary.obligated.total}`);

    // 5. Soft Delete Obligation
    console.log("\nSoft deleting obligation...");
    await pool.execute("UPDATE obligation SET is_deleted = 1 WHERE id = ?", [obId]);
    summary = await FinancialEngine.getExecutiveSummary('AUDIT-PLAN');
    console.log(`Obligated after delete: ${summary.obligated.total} (Expected decrease by 50k)`);

    // 6. Soft Delete PR
    console.log("\nSoft deleting PR...");
    await pool.execute("UPDATE pr_so SET is_deleted = 1 WHERE id = ?", [prId]);
    // Check if it appears in vw_pr_balances
    const [rows] = await pool.execute("SELECT * FROM vw_pr_balances WHERE id = ?", [prId]);
    console.log(`PR visible in view: ${rows.length > 0 ? 'YES' : 'NO'} (Expected: NO)`);

    // 7. Cleanup
    await pool.execute("DELETE FROM obligation WHERE id = ?", [obId]);
    await pool.execute("DELETE FROM pr_so WHERE id = ?", [prId]);
    await pool.execute("DELETE FROM mooe WHERE id = ?", [mooeId]);

    process.exit();
}

audit();
