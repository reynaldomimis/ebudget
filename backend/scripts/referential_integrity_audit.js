const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function runAudit() {
    console.log("=== REFERENTIAL INTEGRITY AUDIT ===");

    const reports = {
        orphans: {},
        constraints: []
    };

    try {
        // 1. Orphan Checks

        // A. PRs without MOOE
        const [prsWithoutMooe] = await pool.execute(`
            SELECT COUNT(*) as count FROM pr_so p
            LEFT JOIN mooe m ON p.mooe_id = m.id
            WHERE m.id IS NULL
        `);
        reports.orphans.prs_without_mooe = prsWithoutMooe[0].count;

        // B. PR Items without PR Header
        const [itemsWithoutHeader] = await pool.execute(`
            SELECT COUNT(*) as count FROM pr_items i
            LEFT JOIN pr_so p ON i.pr_id = p.id
            WHERE p.id IS NULL
        `);
        reports.orphans.items_without_header = itemsWithoutHeader[0].count;

        // C. Obligations referencing missing PR (by prno)
        const [obsMissingPR] = await pool.execute(`
            SELECT COUNT(*) as count FROM obligation o
            WHERE o.prno IS NOT NULL AND o.prno != ''
            AND NOT EXISTS (SELECT 1 FROM pr_so p WHERE p.prno = o.prno)
        `);
        reports.orphans.obligations_missing_pr = obsMissingPR[0].count;

        // D. Audit logs referencing missing transactions
        // Note: audit_logs doesn't have a structured transaction_id column, so we skip programmatic check
        reports.orphans.audit_logs_missing_ref = "N/A (Schema is text-based)";

        // 2. Constraint Check (Looking for missing FKs)
        const [constraints] = await pool.execute(`
            SELECT
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE
                REFERENCED_TABLE_SCHEMA = ?
        `, [process.env.DB_NAME || 'test2']);

        console.log("\n--- ORPHAN COUNTS ---");
        console.table(reports.orphans);

        console.log("\n--- EXISTING CONSTRAINTS ---");
        console.table(constraints);

        // Analysis
        console.log("\n--- PRODUCTION VERDICT ---");
        let fail = false;
        if (reports.orphans.prs_without_mooe > 0) { console.log("FAIL: Orphan PRs found."); fail = true; }
        if (reports.orphans.items_without_header > 0) { console.log("FAIL: Orphan PR items found."); fail = true; }
        if (reports.orphans.obligations_missing_pr > 0) { console.log("WARNING: Obligations point to non-existent PR numbers."); }

        // Check for missing FK from obligation to pr_so
        const hasObligationPRFK = constraints.some(c => c.TABLE_NAME === 'obligation' && c.COLUMN_NAME === 'prno');
        if (!hasObligationPRFK) {
            console.log("CRITICAL MISSING CONSTRAINT: obligation.prno -> pr_so.prno (Referential integrity relies on string matching)");
        }

        if (!fail) console.log("PASS: Core relationships are enforced.");
        else console.log("FAIL: Data integrity issues detected.");

    } catch (err) {
        console.error("Audit failed:", err);
    } finally {
        process.exit();
    }
}

runAudit();
