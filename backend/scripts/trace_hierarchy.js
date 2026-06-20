const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const FilterEngine = require("../engines/FilterEngine");

async function trace() {
  try {
    console.log("=== TRACING HIERARCHY GENERATION ===");
    const filters = await FilterEngine.getHierarchicalFilters();
    const mooe = filters.mooe;

    let totalNames = 0;
    const allNames = new Set();

    // Traverse to Name level
    for (const type in mooe) {
      for (const des in mooe[type]) {
        for (const office in mooe[type][des]) {
          const names = Object.keys(mooe[type][des][office]);
          names.forEach(n => allNames.add(n));
        }
      }
    }

    console.log("Count of unique Names in final hierarchy object:", allNames.size);

    const noiseNames = [
      "Supply and Property management and disposal improved",
      "Office supplies, materials, furniture and fixtures procured on a timely and expeditious manner",
      "Repair and maintenance"
    ];

    console.log("\nChecking for specific noise names:");
    noiseNames.forEach(noise => {
      if (allNames.has(noise)) {
        console.log(`[FAIL] "${noise}" IS PRESENT in the hierarchy.`);
      } else {
        console.log(`[PASS] "${noise}" is NOT present.`);
      }
    });

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

trace();
