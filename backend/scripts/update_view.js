const { pool } = require("../config/database");

async function update() {
  try {
    const query = `
      CREATE OR REPLACE VIEW vw_pr_balances AS
      SELECT
        pr.id,
        pr.mooe_id,
        pr.prno,
        pr.transaction_date,
        pr.purpose,
        pr.workflow_status,
        pr.amount as pr_amount,
        COALESCE(SUM(ob.amount), 0) as obligated_amount,
        (pr.amount - COALESCE(SUM(ob.amount), 0)) as remaining_balance,
        CASE WHEN (pr.amount - COALESCE(SUM(ob.amount), 0)) <= 0 THEN 1 ELSE 0 END as is_fully_obligated,
        CASE
          WHEN COALESCE(SUM(ob.amount), 0) = 0 THEN 'NOT_OBLIGATED'
          WHEN (pr.amount - COALESCE(SUM(ob.amount), 0)) > 0 THEN 'PARTIALLY_OBLIGATED'
          ELSE 'FULLY_OBLIGATED'
        END as budget_status
      FROM pr_so pr
      LEFT JOIN obligation ob ON pr.prno = ob.prno
      GROUP BY pr.id, pr.mooe_id, pr.prno, pr.transaction_date, pr.purpose, pr.workflow_status, pr.amount
    `;
    await pool.execute(query);
    console.log('View vw_pr_balances updated successfully with budget_status and workflow_status');
    process.exit(0);
  } catch (e) {
    console.error('Error: ' + e.message);
    process.exit(1);
  }
}

update();
