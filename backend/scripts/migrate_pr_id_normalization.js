const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function migrate() {
    console.log("=== PR RELATION NORMALIZATION MIGRATION ===");
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        console.log("1. Adding pr_id column to obligation table...");
        await connection.execute(`
            ALTER TABLE obligation
            ADD COLUMN pr_id INT NULL AFTER mooe_id
        `);

        console.log("2. Backfilling pr_id from existing prno...");
        await connection.execute(`
            UPDATE obligation o
            JOIN pr_so p ON o.prno = p.prno
            SET o.pr_id = p.id
            WHERE o.prno IS NOT NULL AND o.prno != ''
        `);

        console.log("3. Creating Foreign Key: obligation.pr_id -> pr_so.id...");
        await connection.execute(`
            ALTER TABLE obligation
            ADD CONSTRAINT fk_obligation_pr_id
            FOREIGN KEY (pr_id) REFERENCES pr_so (id)
            ON DELETE CASCADE
        `);

        await connection.commit();
        console.log("SUCCESS: Migration completed.");
    } catch (err) {
        await connection.rollback();
        console.error("FAILURE: Migration failed:", err.message);
    } finally {
        connection.release();
        process.exit();
    }
}

migrate();
