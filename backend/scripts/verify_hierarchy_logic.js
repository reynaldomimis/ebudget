const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const FilterEngine = require("../engines/FilterEngine");

async function verify() {
  try {
    const filters = await FilterEngine.getHierarchicalFilters();
    const mooe = filters.mooe;

    const noiseName = "Supply and Property management and disposal improved";
    let foundAt = [];

    function search(obj, path = []) {
      if (typeof obj !== 'object' || obj === null) return;
      if (Array.isArray(obj)) return;

      for (const key in obj) {
        if (key === noiseName) {
          foundAt.push([...path, key]);
        }
        search(obj[key], [...path, key]);
      }
    }

    search(mooe);

    if (foundAt.length > 0) {
      console.log(`[FAIL] Found noise name at:`);
      foundAt.forEach(p => console.log(p.join(" -> ")));
    } else {
      console.log(`[PASS] Noise name correctly filtered.`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

verify();
