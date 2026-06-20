const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function audit() {
  try {
    const pap_type = 'GENERAL ADMINISTRATION AND SUPPORT';
    const pap_des = 'General Management and Supervision';

    console.log(`Audit for Hierarchy: ${pap_type} -> ${pap_des}`);

    // 1. Raw DISTINCT offices in DB for this hierarchy (Ignoring structural filters)
    const [rawOffices] = await pool.execute(`
      SELECT DISTINCT office
      FROM mooe
      WHERE pap_type = ? AND pap_des = ?
    `, [pap_type, pap_des]);

    console.log("\n2. SQL Result set for raw DISTINCT offices:");
    console.table(rawOffices);

    // 2. Actionable offices (What the dropdown logic should see)
    // The query used by getByPlan: WHERE is_subtotal = 0 AND expense_items IS NOT NULL AND expense_items != ''
    const [actionableOffices] = await pool.execute(`
      SELECT DISTINCT office
      FROM mooe
      WHERE pap_type = ? AND pap_des = ?
        AND is_subtotal = 0
        AND expense_items IS NOT NULL AND expense_items != ''
    `, [pap_type, pap_des]);

    console.log("\n3. SQL Result set for ACTIONABLE offices (matching getByPlan logic):");
    console.table(actionableOffices);

    // 3. Check for specific offices that might be missing
    const expected = ['AD', 'OED', 'NPPD', 'NSD', 'NTED', 'FMD'];
    console.log("\nChecking distribution of expected offices:");
    for (const off of expected) {
        const [rows] = await pool.execute(`
            SELECT pap_type, pap_des, office, COUNT(*) as count,
                   SUM(CASE WHEN is_subtotal = 0 AND expense_items != '' THEN 1 ELSE 0 END) as actionable_count
            FROM mooe
            WHERE office = ?
            GROUP BY pap_type, pap_des, office
        `, [off]);

        const matchingHierarchy = rows.filter(r => r.pap_type === pap_type && r.pap_des === pap_des);
        if (matchingHierarchy.length > 0) {
            console.log(`- Office ${off}: FOUND in hierarchy. Total Rows: ${matchingHierarchy[0].count}, Actionable Rows: ${matchingHierarchy[0].actionable_count}`);
        } else if (rows.length > 0) {
            console.log(`- Office ${off}: FOUND in DB but NOT in this hierarchy. It belongs to: ${rows[0].pap_type} -> ${rows[0].pap_des}`);
        } else {
            console.log(`- Office ${off}: NOT FOUND in DB at all.`);
        }
    }

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

audit();
