const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function backfill() {
  try {
    // We process by plan_id and sort_order to ensure correct inheritance
    const [plans] = await pool.execute("SELECT DISTINCT plan_id FROM mooe");

    let totalUpdated = 0;

    for (const plan of plans) {
      const plan_id = plan.plan_id;
      const [rows] = await pool.execute(
        "SELECT id, pap_type, pap_des, office, name, expense_items, expense_items_sub FROM mooe WHERE plan_id = ? ORDER BY sort_order ASC, id ASC",
        [plan_id]
      );

      let lastPapType = "";
      let lastPapDes = "";
      let lastOffice = "";
      let lastName = "";
      let lastExpenseItem = "";

      for (const row of rows) {
        let updateNeeded = false;
        const updates = {};

        // Inherit PAP Type
        if (!row.pap_type && lastPapType) {
          updates.pap_type = lastPapType;
          updateNeeded = true;
        } else if (row.pap_type) {
          lastPapType = row.pap_type;
        }

        // Inherit PAP Des
        if (!row.pap_des && lastPapDes) {
          updates.pap_des = lastPapDes;
          updateNeeded = true;
        } else if (row.pap_des) {
          lastPapDes = row.pap_des;
        }

        // Inherit Office
        if (!row.office && lastOffice) {
          updates.office = lastOffice;
          updateNeeded = true;
        } else if (row.office) {
          lastOffice = row.office;
        }

        // Inherit Name (Activity)
        if (!row.name && lastName) {
          updates.name = lastName;
          updateNeeded = true;
        } else if (row.name) {
          if (row.name !== lastName) {
            lastExpenseItem = ""; // Reset expense item on name change
          }
          lastName = row.name;
        }

        // Inherit Expense Item
        if (!row.expense_items && lastExpenseItem && row.expense_items_sub) {
          updates.expense_items = lastExpenseItem;
          updateNeeded = true;
        } else if (row.expense_items) {
          lastExpenseItem = row.expense_items;
        }

        if (updateNeeded) {
          const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(", ");
          const values = [...Object.values(updates), row.id];
          await pool.execute(`UPDATE mooe SET ${setClauses} WHERE id = ?`, values);
          totalUpdated++;
        }
      }
    }

    console.log(`Backfill complete. Updated ${totalUpdated} rows.`);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

backfill();
