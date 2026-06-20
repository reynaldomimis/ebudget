const { pool } = require("../config/database");
const FinancialEngine = require("../engines/FinancialEngine");

async function verifyPlan(plan_id, label) {
  try {
    console.log(`\n--- VERIFYING ${label}: ${plan_id} ---`);

    // 1. SQL Direct Queries
    const [psRows] = await pool.execute("SELECT SUM(amount) as total FROM ps WHERE plan_id = ?", [plan_id]);
    const [mooeRows] = await pool.execute("SELECT SUM(totalFq) as total FROM mooe WHERE is_subtotal = 0 AND plan_id = ?", [plan_id]);

    const sqlPS = Number(psRows[0].total || 0);
    const sqlMOOE = Number(mooeRows[0].total || 0);
    const sqlGrand = sqlPS + sqlMOOE;

    // 2. API (Engine) Results
    const apiData = await FinancialEngine.getExecutiveSummary(plan_id);
    const apiPS = Number(apiData.ps + apiData.rlip);
    const apiMOOE = Number(apiData.mooe);
    const apiGrand = Number(apiData.grandTotal);

    // 3. Comparison
    console.log(`PS Total:   SQL = ${sqlPS.toFixed(2)}, API = ${apiPS.toFixed(2)}, Variance = ${(sqlPS - apiPS).toFixed(2)}`);
    console.log(`MOOE Total: SQL = ${sqlMOOE.toFixed(2)}, API = ${apiMOOE.toFixed(2)}, Variance = ${(sqlMOOE - apiMOOE).toFixed(2)}`);
    console.log(`Grand Total: SQL = ${sqlGrand.toFixed(2)}, API = ${apiGrand.toFixed(2)}, Variance = ${(sqlGrand - apiGrand).toFixed(2)}`);

    // 4. Registry Count
    const registry = await FinancialEngine.getBudgetRegistry(plan_id);
    const [mCount] = await pool.execute("SELECT COUNT(*) as c FROM mooe WHERE is_subtotal = 0 AND plan_id = ?", [plan_id]);
    const [pCount] = await pool.execute("SELECT COUNT(*) as c FROM ps WHERE plan_id = ?", [plan_id]);
    const totalExpected = mCount[0].c + pCount[0].c;
    console.log(`Registry Count Match: ${registry.length === totalExpected ? "YES" : "NO"} (Registry: ${registry.length}, Expected: ${totalExpected})`);

  } catch (err) {
    console.error(`Error verifying ${plan_id}:`, err);
  }
}

async function runAll() {
    // Plan with only PS
    await verifyPlan('PLAN-PS-2026-1781762829488', 'PS PLAN');
    // Plan with only MOOE
    await verifyPlan('PLAN-2026-1781762792118', 'MOOE PLAN');

    // Cross-plan check (Manual Summation)
    console.log("\n--- CROSS-PLAN GRAND TOTAL VERIFICATION ---");
    const [allPS] = await pool.execute("SELECT SUM(amount) as s FROM ps");
    const [allMOOE] = await pool.execute("SELECT SUM(totalFq) as s FROM mooe WHERE is_subtotal = 0");
    const totalSQL = Number(allPS[0].s) + Number(allMOOE[0].s);
    console.log(`Global Database Grand Total (PS + MOOE): ${totalSQL.toFixed(2)}`);

    process.exit(0);
}

runAll();
