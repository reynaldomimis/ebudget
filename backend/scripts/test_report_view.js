const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require("../config/database");

async function test() {
    try {
        console.log("--- Testing vw_mooe_excel_full_report ---");
        const [rows] = await pool.query("SELECT * FROM vw_mooe_excel_full_report LIMIT 20");
        console.log("Sample Rows:", JSON.stringify(rows, null, 2));

        const [counts] = await pool.query("SELECT row_type, COUNT(*) as count FROM vw_mooe_excel_full_report GROUP BY row_type");
        console.log("Row Type Counts:", counts);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
