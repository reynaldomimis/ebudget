const fs = require('fs');
const path = require('path');

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

async function audit() {
    console.log("=== CRITICAL PS / RLIP VALIDATION AUDIT ===");
    const planId = await FiscalYearContext.getActivePlanId();
    console.log(`Active Plan: ${planId}\n`);

    // 1. Raw PS Table Verification
    console.log("--- 1. Raw PS Table Verification ---");
    const [countRows] = await pool.execute("SELECT COUNT(*) as count FROM ps WHERE is_deleted = 0");
    console.log(`Total active records in PS table: ${countRows[0].count}`);

    const [allPsRows] = await pool.execute("SELECT pap_des, SUM(amount) as total, plan_id FROM ps WHERE is_deleted = 0 GROUP BY pap_des, plan_id");
    console.log("PS records grouped by pap_des and plan_id:");
    console.table(allPsRows);

    // 2. RLIP Verification
    console.log("\n--- 2. RLIP Verification ---");
    const [rlipRows] = await pool.execute("SELECT pap_des, SUM(amount) as total, plan_id FROM ps WHERE is_deleted = 0 AND expense_items LIKE '%RLIP%' GROUP BY pap_des, plan_id");
    console.log("RLIP records grouped by pap_des and plan_id:");
    console.table(rlipRows);

    // 3. Plan ID matching
    const [distinctPlans] = await pool.execute("SELECT DISTINCT plan_id FROM ps WHERE is_deleted = 0");
    console.log("\nDistinct Plan IDs in PS table:", distinctPlans.map(r => r.plan_id));

    const [mooePlans] = await pool.execute("SELECT DISTINCT plan_id FROM mooe WHERE is_deleted = 0");
    console.log("Distinct Plan IDs in MOOE table:", mooePlans.map(r => r.plan_id));

    // 5. Dashboard Proof (Local Trace)
    console.log("\n--- 5. Dashboard Composition Proof ---");
    const summary = await FinancialEngine.getExecutiveSummary(planId);
    console.log("Summary Global Metrics:");
    console.log(`  PS:   ${summary.ps}`);
    console.log(`  RLIP: ${summary.rlip}`);

    console.log("\nSample papComposition keys (First 3):");
    const keys = Object.keys(summary.papComposition);
    keys.slice(0, 3).forEach(k => {
        console.log(`[${k}]:`, JSON.stringify(summary.papComposition[k]));
    });

    process.exit();
}

audit();
