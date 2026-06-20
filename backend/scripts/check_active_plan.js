const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const FiscalYearContext = require("../engines/FiscalYearContext");

async function check() {
  try {
    const activeId = await FiscalYearContext.getActivePlanId('MOOE');
    console.log("Active Plan ID for MOOE:", activeId);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
