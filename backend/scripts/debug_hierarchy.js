const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const FilterEngine = require("../engines/FilterEngine");

async function debug() {
  try {
    const result = await FilterEngine.getHierarchicalFilters();

    // Drill down to the specific branch
    const branch = result.mooe
      ?.["GENERAL ADMINISTRATION AND SUPPORT"]
      ?.["General Management and Supervision"]
      ?.["AD"]
      ?.["Non-Procurement Service"]
      ?.["Supplies and Materials Expenses"];

    console.log("Branch (Supplies and Materials Expenses):", branch);

    if (branch && branch.includes("Other Supplies and Materials Expenses")) {
      console.log("SUCCESS: Other Supplies and Materials Expenses IS PRESENT.");
    } else {
      console.log("FAILURE: Other Supplies and Materials Expenses IS STILL MISSING.");
    }

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

debug();
