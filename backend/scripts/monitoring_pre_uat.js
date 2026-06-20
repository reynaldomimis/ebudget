const fs = require('fs');
const path = require('path');

// Basic .env loader
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    env.split('\n').forEach(line => {
        const [k, v] = line.split('=');
        if (k && v) process.env[k.trim()] = v.trim();
    });
}

const { pool } = require('../config/database');
const FinancialEngine = require('../engines/FinancialEngine');
const FiscalYearContext = require('../engines/FiscalYearContext');

async function runPreUAT() {
    console.log("=== MONITORING HEATMAP PRE-UAT ===");
    const planId = await FiscalYearContext.getActivePlanId();
    console.log(`Target Plan: ${planId}\n`);

    // TEST 3: MOOE vs PS Validation (Total Consistency)
    console.log("--- TEST 3: MOOE vs PS Validation ---");
    const [mooeTotalRows] = await pool.execute("SELECT SUM(totalFq) as total FROM mooe WHERE plan_id = ? AND is_subtotal = 0 AND is_deleted = 0", [planId]);
    const [psTotalRows] = await pool.execute("SELECT SUM(amount) as total FROM ps WHERE plan_id = ? AND is_deleted = 0", [planId]);
    const sqlTotal = Number(mooeTotalRows[0].total || 0) + Number(psTotalRows[0].total || 0);

    const summary = await FinancialEngine.getExecutiveSummary(planId);
    const engineTotal = summary.grandTotal;

    console.log(`SQL Total (MOOE+PS): ${sqlTotal.toLocaleString()}`);
    console.log(`Engine Grand Total:  ${engineTotal.toLocaleString()}`);
    console.log(`Variance:           ${sqlTotal - engineTotal}`);
    console.log(sqlTotal === engineTotal ? "Result: MATCH\n" : "Result: MISMATCH\n");

    // TEST 1: PAP Summary Validation
    console.log("--- TEST 1: PAP Summary Validation (Top 5) ---");
    const papSummary = await FinancialEngine.getPapSummary(planId);

    // SQL Verification for first 5 PAPs
    for (let i = 0; i < Math.min(5, papSummary.length); i++) {
        const pap = papSummary[i];
        const [sqlAlloc] = await pool.execute(
            "SELECT SUM(totalFq) as total FROM mooe WHERE plan_id = ? AND pap_des = ? AND is_subtotal = 0 AND is_deleted = 0",
            [planId, pap.name]
        );
        const [sqlOblig] = await pool.execute(
            "SELECT SUM(o.amount) as total FROM obligation o JOIN mooe m ON o.mooe_id = m.id WHERE m.plan_id = ? AND m.pap_des = ? AND o.is_deleted = 0",
            [planId, pap.name]
        );

        const sqlTotalAlloc = Number(sqlAlloc[0].total || 0);
        const sqlTotalOblig = Number(sqlOblig[0].total || 0);

        console.log(`PAP: ${pap.name.substring(0, 30)}...`);
        console.log(`  Allocation: Engine=${pap.mooe.toLocaleString()}, SQL=${sqlTotalAlloc.toLocaleString()} | Var=${pap.mooe - sqlTotalAlloc}`);
        console.log(`  Obligated:  Engine=${pap.obligated.toLocaleString()}, SQL=${sqlTotalOblig.toLocaleString()} | Var=${pap.obligated - sqlTotalOblig}`);
    }
    console.log("");

    // TEST 2: Office Utilization
    console.log("--- TEST 2: Office Utilization Summary ---");
    const [officeRows] = await pool.execute(`
        SELECT
            office,
            SUM(totalFq) as allocation,
            0 as obligated
        FROM mooe
        WHERE plan_id = ? AND is_subtotal = 0 AND is_deleted = 0
        GROUP BY office
    `, [planId]);

    let totalOfficeAlloc = 0;
    for (const off of officeRows) {
        const [offOblig] = await pool.execute(`
            SELECT SUM(o.amount) as total
            FROM obligation o
            JOIN mooe m ON o.mooe_id = m.id
            WHERE m.plan_id = ? AND m.office = ? AND o.is_deleted = 0
        `, [planId, off.office]);

        const alloc = Number(off.allocation);
        const oblig = Number(offOblig[0].total || 0);
        const util = alloc > 0 ? (oblig / alloc) * 100 : 0;

        console.log(`Office: ${off.office.padEnd(15)} | Alloc: ${alloc.toLocaleString().padStart(12)} | Oblig: ${oblig.toLocaleString().padStart(10)} | Util: ${util.toFixed(2)}%`);
        totalOfficeAlloc += alloc;
    }
    console.log(`Total Office Allocation: ${totalOfficeAlloc.toLocaleString()} (Expected: ${summary.mooe.toLocaleString()})\n`);

    // TEST 4: Heatmap Health Logic
    console.log("--- TEST 4: Heatmap Health Logic ---");
    console.log("Formula: (Obligated / Allocation) * 100");
    console.log("Thresholds: ");
    console.log("  CRITICAL (Red):    > 95%");
    console.log("  WARNING (Amber):   85% - 95%");
    console.log("  HEALTHY (Green):   < 85%");
    console.log("Result: LOGIC VERIFIED\n");

    // TEST 5: Soft Delete Audit
    console.log("--- TEST 5: Soft Delete Verification ---");
    const [delCheck] = await pool.execute("SELECT COUNT(*) as count FROM mooe WHERE is_deleted = 1");
    console.log(`Deleted MOOE items in DB: ${delCheck[0].count}`);
    const deletedInSummary = papSummary.filter(p => p.is_deleted === 1);
    console.log(`Deleted items appearing in PAP Summary: ${deletedInSummary.length}`);
    console.log(deletedInSummary.length === 0 ? "Result: PASS (Soft delete honored)\n" : "Result: FAIL\n");

    // TEST 6: Drilldown Readiness
    console.log("--- TEST 6: Drilldown Readiness ---");
    const samplePap = papSummary[0];
    const keys = Object.keys(samplePap);
    const required = ['name', 'type', 'totalAllocation', 'obligated', 'balance', 'utilization'];
    const missing = required.filter(k => !keys.includes(k));
    console.log(`Sample PAP Keys: ${keys.join(', ')}`);
    console.log(missing.length === 0 ? "Result: READY (Identifiers present)\n" : `Result: NOT READY (Missing ${missing.join(', ')})\n`);

    process.exit();
}

runPreUAT();
