const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const FilterEngine = require("../engines/FilterEngine");

async function test() {
    try {
        console.log("--- UAT: FilterEngine using Report View ---");

        const plan_id = "MOOE-2026-1782118869183";

        console.log("\n1. Testing Hierarchical Filters...");
        const hierarchy = await FilterEngine.getHierarchicalFilters(plan_id);
        const papTypes = Object.keys(hierarchy.mooe);
        console.log("Detected PAP Types:", papTypes);

        if (papTypes.length > 0) {
            const firstType = papTypes[0];
            const descriptions = Object.keys(hierarchy.mooe[firstType]);
            console.log(`Descriptions for ${firstType}:`, descriptions);
        }

        console.log("\n2. Testing getDistinctValues for 'activity' (mapped from 'name')...");
        const names = await FilterEngine.getDistinctValues("mooe", "name", { plan_id });
        console.log(`Distinct Names Count: ${names.length}`);
        if (names.length > 0) console.log("Sample Names:", names.slice(0, 5));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
