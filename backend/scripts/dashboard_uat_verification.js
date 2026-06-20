const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");
const FinancialEngine = require("../engines/FinancialEngine");
const DashboardService = require("../services/DashboardService");
const FiscalYearContext = require("../engines/FiscalYearContext");

async function runUAT() {
    const planId = await FiscalYearContext.getActivePlanId();
    console.log(`Active Plan: ${planId}`);

    const results = {};

    // 1. Database Queries
    const [mooeSql] = await pool.execute("SELECT SUM(totalFq) as total FROM mooe WHERE plan_id = ? AND is_subtotal = 0 AND is_deleted = 0", [planId]);
    const [psSql] = await pool.execute("SELECT SUM(amount) as total FROM ps WHERE plan_id = ? AND is_deleted = 0", [planId]);
    const [obSql] = await pool.execute("SELECT SUM(amount) as total FROM obligation WHERE is_deleted = 0");
    const [workflowSql] = await pool.execute("SELECT workflow_status, COUNT(*) as count FROM pr_so WHERE is_deleted = 0 GROUP BY workflow_status");

    results.sql = {
        totalBudget: Number(mooeSql[0].total || 0) + Number(psSql[0].total || 0),
        totalObligated: Number(obSql[0].total || 0),
        workflow: workflowSql.reduce((acc, curr) => ({ ...acc, [curr.workflow_status]: curr.count }), {})
    };

    // 2. Engine Queries
    const finSummary = await FinancialEngine.getExecutiveSummary(planId);
    results.engine = {
        totalBudget: finSummary.grandTotal,
        totalObligated: finSummary.obligated.total,
        workflow: finSummary.counts // Engine has simplified counts
    };

    // 3. API (Service) Queries
    const apiSummary = await DashboardService.getExecutiveSummary(planId);
    results.api = {
        totalBudget: apiSummary.totalBudget,
        totalObligated: apiSummary.totalObligated,
        workflow: apiSummary.workflow
    };

    console.log("\n=== TEST 1: TOTAL BUDGET ===");
    console.log(`SQL:    ${results.sql.totalBudget.toLocaleString()}`);
    console.log(`Engine: ${results.engine.totalBudget.toLocaleString()}`);
    console.log(`API:    ${results.api.totalBudget.toLocaleString()}`);
    console.log(`Variance: ${results.sql.totalBudget - results.api.totalBudget}`);

    console.log("\n=== TEST 2: TOTAL OBLIGATED ===");
    console.log(`SQL:    ${results.sql.totalObligated.toLocaleString()}`);
    console.log(`Engine: ${results.engine.totalObligated.toLocaleString()}`);
    console.log(`API:    ${results.api.totalObligated.toLocaleString()}`);
    console.log(`Variance: ${results.sql.totalObligated - results.api.totalObligated}`);

    console.log("\n=== TEST 5: WORKFLOW PULSE ===");
    console.log("SQL Statuses:", JSON.stringify(results.sql.workflow));
    console.log("API Statuses:", JSON.stringify(results.api.workflow));

    process.exit();
}

runUAT();
