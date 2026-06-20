const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function update() {
    const sql = `
        CREATE OR REPLACE VIEW vw_pr_balances AS
        SELECT
            pr.id AS id,
            pr.mooe_id AS mooe_id,
            pr.prno AS prno,
            pr.transaction_date AS transaction_date,
            pr.purpose AS purpose,
            pr.workflow_status AS workflow_status,
            pr.amount AS pr_amount,
            COALESCE(SUM(CASE WHEN ob.is_deleted = 0 THEN ob.amount ELSE 0 END), 0) AS obligated_amount,
            (pr.amount - COALESCE(SUM(CASE WHEN ob.is_deleted = 0 THEN ob.amount ELSE 0 END), 0)) AS remaining_balance,
            (CASE WHEN ((pr.amount - COALESCE(SUM(CASE WHEN ob.is_deleted = 0 THEN ob.amount ELSE 0 END), 0)) <= 0) THEN 1 ELSE 0 END) AS is_fully_obligated,
            (CASE
                WHEN (COALESCE(SUM(CASE WHEN ob.is_deleted = 0 THEN ob.amount ELSE 0 END), 0) = 0) THEN 'NOT_OBLIGATED'
                WHEN ((pr.amount - COALESCE(SUM(CASE WHEN ob.is_deleted = 0 THEN ob.amount ELSE 0 END), 0)) > 0) THEN 'PARTIALLY_OBLIGATED'
                ELSE 'FULLY_OBLIGATED'
            END) AS budget_status
        FROM pr_so pr
        LEFT JOIN obligation ob ON pr.id = ob.pr_id
        WHERE pr.is_deleted = 0
        GROUP BY
            pr.id, pr.mooe_id, pr.prno, pr.transaction_date, pr.purpose, pr.workflow_status, pr.amount
    `;
    try {
        await pool.execute(sql);
        console.log("View updated successfully with soft delete logic.");
    } catch (err) {
        console.error("Failed to update view:", err.message);
    } finally {
        process.exit();
    }
}

update();
