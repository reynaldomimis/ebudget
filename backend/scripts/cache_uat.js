const DashboardService = require("../services/DashboardService");
const CacheEngine = require("../engines/CacheEngine");
const PRService = require("../services/prService");

async function testCache() {
    console.log("=== CACHE UAT ===");

    // Clear cache first
    CacheEngine.invalidate();

    const start1 = Date.now();
    await DashboardService.getExecutiveSummary();
    const duration1 = Date.now() - start1;
    console.log(`First call (Cold): ${duration1}ms`);

    const start2 = Date.now();
    await DashboardService.getExecutiveSummary();
    const duration2 = Date.now() - start2;
    console.log(`Second call (Warm): ${duration2}ms`);

    if (duration2 < duration1) {
        console.log("SUCCESS: Cache is working.");
    }

    console.log("\nSimulating PR Update (Invalidation)...");
    // Just call invalidate manually or simulate a PR service call
    CacheEngine.invalidate("exec_summary");

    const start3 = Date.now();
    await DashboardService.getExecutiveSummary();
    const duration3 = Date.now() - start3;
    console.log(`Call after invalidation (Cold again): ${duration3}ms`);

    process.exit();
}

testCache();
