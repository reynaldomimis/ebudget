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

async function verify() {
    console.log("=== MONITORING HEATMAP RUNTIME VERIFICATION ===");
    const planId = await FiscalYearContext.getActivePlanId();

    // TEST 1: Total Count
    const papSummary = await FinancialEngine.getPapSummary(planId);
    console.log(`TEST 1: PAP Summary Length = ${papSummary.length}`);

    // TEST 2: Card Accuracy (Top 5)
    console.log("\nTEST 2: Card Accuracy (Top 5)");
    for (let i = 0; i < Math.min(5, papSummary.length); i++) {
        const pap = papSummary[i];
        console.log(`PAP ${i+1}: ${pap.name}`);
        console.log(`  Alloc: ${pap.totalAllocation.toLocaleString()}`);
        console.log(`  Oblig: ${pap.obligated.toLocaleString()}`);
        console.log(`  Bal:   ${pap.balance.toLocaleString()}`);
        console.log(`  Util:  ${pap.utilization.toFixed(2)}%`);
    }

    // TEST 3 & 4: Drilldown & Office Breakdown (First PAP)
    if (papSummary.length > 0) {
        const target = papSummary[0];
        console.log(`\nTEST 3 & 4: Target PAP = ${target.name}`);
        const detail = await FinancialEngine.getPapDetail(planId, target.type, target.name);

        console.log("Drilldown Summary:");
        console.log(`  Alloc: ${detail.summary.allocation.toLocaleString()} (Match Summary: ${detail.summary.allocation === target.totalAllocation})`);
        console.log(`  Oblig: ${detail.summary.obligated.toLocaleString()} (Match Summary: ${detail.summary.obligated === target.obligated})`);

        const officeSum = detail.officeBreakdown.reduce((sum, off) => sum + off.allocation, 0);
        console.log(`Office Allocation Sum: ${officeSum.toLocaleString()}`);
        console.log(`Allocation Match: ${officeSum === target.mooe}`); // Since PS doesn't have office, this should match MOOE portion

        // TEST 5: PR Filter
        const prStatuses = detail.prs.map(p => p.workflow_status);
        const invalidPrs = prStatuses.filter(s => ['Draft', 'For Review', 'Rejected'].includes(s));
        console.log(`\nTEST 5: PR Filter Check`);
        console.log(`  PR Statuses Found: ${[...new Set(prStatuses)].join(', ')}`);
        console.log(`  Invalid PRs (Draft/Review/Rejected) in detail: ${invalidPrs.length}`);

        // TEST 6: Obligation Sum
        const obSum = detail.obligations.reduce((sum, o) => sum + Number(o.amount), 0);
        console.log(`\nTEST 6: Obligation Sum: ${obSum.toLocaleString()}`);
        console.log(`  Matches Detail Obligated: ${Math.abs(obSum - detail.summary.obligated) < 0.01}`);
    }

    process.exit();
}

verify();
