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
    try {
        console.log("=== CRITICAL PS BUG DEEP AUDIT ===");
        const planId = await FiscalYearContext.getActivePlanId();
        console.log(`Active Plan ID: ${planId}`);

        // 1. & 2. PS Repository / Plan Verification
        const [psCountAll] = await pool.execute("SELECT COUNT(*) as c FROM ps WHERE is_deleted = 0");
        const [psCountPlan] = await pool.execute("SELECT COUNT(*) as c FROM ps WHERE plan_id = ? AND is_deleted = 0", [planId]);

        console.log(`\n1. PS Table Total (active): ${psCountAll[0].c}`);
        console.log(`2. PS Table for Plan ${planId}: ${psCountPlan[0].c}`);

        // 3. PAP Description Match
        const [psDes] = await pool.execute("SELECT DISTINCT pap_des FROM ps WHERE plan_id = ? AND is_deleted = 0", [planId]);
        const [mooeDes] = await pool.execute("SELECT DISTINCT pap_des FROM mooe WHERE plan_id = ? AND is_deleted = 0", [planId]);

        console.log("\n3. PAP Description Match:");
        console.log("PS Descriptions:", psDes.map(r => `"${r.pap_des}"`));
        console.log("MOOE Descriptions:", mooeDes.map(r => `"${r.pap_des}"`));

        // 5. RLIP Field Verification
        const [psCols] = await pool.execute("DESCRIBE ps");
        console.log("\n5. PS Table Columns:");
        console.table(psCols);

        const [rlipCheck] = await pool.execute("SELECT * FROM ps WHERE expense_items LIKE '%RLIP%' LIMIT 1");
        console.log("\nRLIP Extraction Test (expense_items LIKE '%RLIP%'):", rlipCheck.length > 0 ? "FOUND" : "NOT FOUND");

        // 4. & 6. Engine & DTO Verification
        console.log("\n4. & 6. Engine Aggregation Trace:");
        const desSummary = await FinancialEngine.getPapDescriptionSummary(planId);
        desSummary.forEach(p => {
            if (p.ps > 0 || p.rlip > 0) {
                console.log(`MATCH FOUND: "${p.name}" -> PS: ${p.ps}, RLIP: ${p.rlip}, MOOE: ${p.mooe}`);
            }
        });

        const execSummary = await FinancialEngine.getExecutiveSummary(planId);
        console.log("\nDTO papComposition Sample (National Nutrition...):");
        const match = Object.keys(execSummary.papComposition).find(k => k.includes("Assistance to national"));
        if (match) {
            console.log(JSON.stringify({ [match]: execSummary.papComposition[match] }, null, 2));
        } else {
            console.log("Assistance PAP not found in DTO.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

audit();
