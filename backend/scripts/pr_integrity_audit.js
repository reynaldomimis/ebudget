const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function runAudit() {
    console.log("=== PURCHASE REQUEST INTEGRITY AUDIT ===");
    try {
        const query = `
            SELECT p.id,
                   p.prno,
                   p.amount AS header_amount,
                   COALESCE(SUM(i.total), 0) AS items_total,
                   (p.amount - COALESCE(SUM(i.total), 0)) AS variance
            FROM pr_so p
            LEFT JOIN pr_items i ON i.pr_id = p.id
            GROUP BY p.id, p.prno, p.amount
            HAVING variance <> 0 OR header_amount = 0;
        `;
        const [mismatches] = await pool.execute(query);

        if (mismatches.length === 0) {
            console.log("SUCCESS: All PR headers match their item totals.");
        } else {
            console.log(`WARNING: Found ${mismatches.length} mismatches!`);
            console.table(mismatches);
        }

        // Test Delete Cascade
        console.log("\n=== TESTING DELETE CASCADE ===");
        const testPrNo = `TEST-DEL-${Date.now()}`;
        const [insHeader] = await pool.execute(
            "INSERT INTO pr_so (mooe_id, prno, transaction_date, amount, purpose) VALUES (4496, ?, CURDATE(), 100, 'Delete Test')",
            [testPrNo]
        );
        const newPrId = insHeader.insertId;
        await pool.execute(
            "INSERT INTO pr_items (pr_id, description, quantity, unit, unit_cost, total) VALUES (?, 'Test Item', 1, 'unit', 100, 100)",
            [newPrId]
        );

        console.log(`Created Test PR ID ${newPrId}. Deleting...`);
        await pool.execute("DELETE FROM pr_so WHERE id = ?", [newPrId]);

        const [remainingItems] = await pool.execute("SELECT * FROM pr_items WHERE pr_id = ?", [newPrId]);
        if (remainingItems.length === 0) {
            console.log("SUCCESS: Delete Cascade working. Orphaned items removed.");
        } else {
            console.log("FAILURE: Orphaned items found in pr_items!");
        }

    } catch (err) {
        console.error("Audit failed:", err);
    } finally {
        process.exit();
    }
}

runAudit();
