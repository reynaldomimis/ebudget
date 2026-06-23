const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const BalanceEngine = require("../engines/BalanceEngine");

async function test() {
  const mooeId = 6981;
  try {
    const balance = await BalanceEngine.getAvailableAllocation(mooeId);
    console.log(`Available Allocation for ID ${mooeId}:`, balance);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

test();
