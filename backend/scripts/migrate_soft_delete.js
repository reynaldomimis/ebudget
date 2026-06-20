const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function migrate() {
    console.log("=== SOFT DELETE MIGRATION ===");
    const tables = ['pr_so', 'obligation', 'mooe', 'ps'];

    for (const table of tables) {
        console.log(`Updating table: ${table}...`);
        try {
            await pool.execute(`
                ALTER TABLE ${table}
                ADD COLUMN is_deleted TINYINT(1) DEFAULT 0,
                ADD COLUMN deleted_at TIMESTAMP NULL,
                ADD COLUMN deleted_by INT NULL
            `);
            console.log(`Success: ${table} updated.`);
        } catch (err) {
            console.error(`Error updating ${table}:`, err.message);
        }
    }
    process.exit();
}

migrate();
