const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const MonitoringEngine = require("../engines/MonitoringEngine");
const FinancialEngine = require("../engines/FinancialEngine");
const FiscalYearContext = require("../engines/FiscalYearContext");

async function test() {
    try {
        console.log("--- UAT Test: Backend Engines ---");

        const year = "2026";
        console.log(`Testing for Year: ${year}`);

        const planId = await FiscalYearContext.resolvePlanId(year);
        console.log(`Resolved Plan ID: ${planId}`);

        console.log("\n1. Testing MonitoringEngine.getOverview...");
        const monitoringData = await MonitoringEngine.getOverview(planId);
        console.log("Monitoring Overview Result:", JSON.stringify(monitoringData, null, 2));

        console.log("\n2. Testing FinancialEngine.getExecutiveSummary...");
        const execSummary = await FinancialEngine.getExecutiveSummary(planId);
        console.log("Executive Summary Result:", JSON.stringify(execSummary, null, 2));

        console.log("\n3. Testing FinancialEngine.getPapSummary...");
        const papSummary = await FinancialEngine.getPapSummary(planId);
        console.log(`PAP Summary Count: ${papSummary.length}`);
        if (papSummary.length > 0) {
            console.log("First PAP Item Sample:", JSON.stringify(papSummary[0], null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
}

test();
