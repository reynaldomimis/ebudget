const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function backfill() {
  try {
    const [plans] = await pool.execute("SELECT DISTINCT plan_id FROM ps");

    let totalUpdated = 0;

    for (const plan of plans) {
      const plan_id = plan.plan_id;
      // PS doesn't have sort_order, we use id
      const [rows] = await pool.execute(
        "SELECT id, pap_type, pap_des, expense_items FROM ps WHERE plan_id = ? ORDER BY id ASC",
        [plan_id]
      );

      let lastPapType = "";
      let lastPapDes = "";

      for (const row of rows) {
        let updateNeeded = false;
        const updates = {};

        if (!row.pap_type && lastPapType) {
          updates.pap_type = lastPapType;
          updateNeeded = true;
        } else if (row.pap_type) {
          lastPapType = row.pap_type;
        }

        if (!row.pap_des && lastPapDes) {
          updates.pap_des = lastPapDes;
          updateNeeded = true;
        } else if (row.pap_des) {
          lastPapDes = row.pap_des;
        }

        if (updateNeeded) {
          const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(", ");
          const values = [...Object.values(updates), row.id];
          await pool.execute(`UPDATE ps SET ${setClauses} WHERE id = ?`, values);
          totalUpdated++;
        }
      }
    }

    console.log(`PS Backfill complete. Updated ${totalUpdated} rows.`);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

backfill();
