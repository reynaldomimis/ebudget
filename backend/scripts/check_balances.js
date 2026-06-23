const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function check() {
  const mooeId = 6981;
  try {
    const [viewRows] = await pool.query("SELECT total_amount FROM vw_mooe_excel_full_report WHERE id = ?", [mooeId]);
    console.log("Total Amount from View:", viewRows[0]?.total_amount);

    const [prs] = await pool.query("SELECT * FROM pr_so WHERE mooe_id = ? AND is_deleted = 0", [mooeId]);
    console.log("Active PRs for this MOOE:");
    console.table(prs);
    const totalPR = prs.reduce((sum, p) => sum + Number(p.amount), 0);
    console.log("Total PR Amount:", totalPR);

    const [obligations] = await pool.query("SELECT * FROM obligation WHERE mooe_id = ? AND is_deleted = 0", [mooeId]);
    console.log("Active Obligations for this MOOE:");
    console.table(obligations);
    const directObligations = obligations.filter(o => !o.prno).reduce((sum, o) => sum + Number(o.amount), 0);
    console.log("Direct Obligations Amount:", directObligations);

    const balance = Number(viewRows[0]?.total_amount || 0) - totalPR - directObligations;
    console.log("Calculated Available Allocation:", balance);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
