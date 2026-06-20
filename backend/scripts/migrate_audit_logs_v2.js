const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function migrate() {
    console.log("=== AUDIT LOG ENHANCEMENT MIGRATION ===");
    try {
        await pool.execute(`
            ALTER TABLE audit_logs
            ADD COLUMN ref_type VARCHAR(50) AFTER action,
            ADD COLUMN ref_id INT AFTER ref_type
        `);
        console.log("SUCCESS: audit_logs table updated.");
    } catch (err) {
        console.error("FAILURE:", err.message);
    }
    process.exit();
}

migrate();
