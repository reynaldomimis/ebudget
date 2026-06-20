const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const FilterEngine = require("../engines/FilterEngine");

async function simulate() {
  try {
    const filters = await FilterEngine.getHierarchicalFilters();
    const mooe = filters.mooe;

    const gas = mooe["GENERAL ADMINISTRATION AND SUPPORT"];
    if (!gas) {
        console.log("GAS not found");
        return;
    }

    const gms = gas["General Management and Supervision"];
    if (!gms) {
        console.log("GMS not found");
        return;
    }

    const ad = gms["AD"];
    if (!ad) {
        console.log("AD not found");
        return;
    }

    console.log("Keys under GAS -> GMS -> AD (Names):");
    console.log(Object.keys(ad));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

simulate();
