const { pool } = require("../config/database");

async function test() {
  try {
    console.log("Investigating duplicate MOOE names across ALL plans (is_subtotal=0)");

    const [duplicates] = await pool.execute(`
      SELECT name, COUNT(*) as count
      FROM mooe
      WHERE is_subtotal = 0
      GROUP BY name
      HAVING count > 1
      LIMIT 10
    `);

    console.log("Total Duplicate Names found:", duplicates.length);

    for (const dup of duplicates) {
      const [rows] = await pool.execute(`
        SELECT id, plan_id, office, pap_type, pap_des, name, ref_main_name, expense_items
        FROM mooe
        WHERE name = ? AND is_subtotal = 0
      `, [dup.name]);

      console.log(`\nDetails for duplicate name: "${dup.name}"`);
      console.table(rows);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
