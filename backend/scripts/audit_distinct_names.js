const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const FilterEngine = require("../engines/FilterEngine");

async function audit() {
  try {
    console.log("=== AUDITING DISTINCT NAMES ===");

    // Simulate fetching names for a specific office
    const filters = {
        pap_type: 'GENERAL ADMINISTRATION AND SUPPORT',
        pap_des: 'General Management and Supervision',
        office: 'AD'
    };

    const names = await FilterEngine.getDistinctValues('mooe', 'name', filters);

    console.log("Count of unique Names in dropdown array:", names.length);

    const noiseNames = [
      "Supply and Property management and disposal improved",
      "Office supplies, materials, furniture and fixtures procured on a timely and expeditious manner",
      "Repair and maintenance"
    ];

    console.log("\nChecking for specific noise names in dropdown source:");
    noiseNames.forEach(noise => {
      if (names.includes(noise)) {
        console.log(`[FAIL] "${noise}" IS PRESENT in the dropdown list.`);
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

audit();
