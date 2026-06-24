const { pool } = require("../config/database");

class BalanceEngine {
  static async getMOOEBalance(mooeId, connection = pool) {
    const [rows] = await connection.query("SELECT total_amount FROM vw_mooe_excel_full_report WHERE id = ?", [mooeId]);
    if (rows.length === 0) return 0;

    const [obRows] = await connection.query("SELECT SUM(amount) as total FROM vw_obligation_details WHERE allotment_class = 'MOOE' AND id = ?", [mooeId]);
    const totalObligated = Number(obRows[0].total || 0);

    return Number(rows[0].total_amount || 0) - totalObligated;
  }

  static async getPRBalance(prno, connection = pool) {
    const [rows] = await connection.query("SELECT remaining_balance FROM vw_pr_details WHERE prno = ?", [prno]);
    if (rows.length === 0) return 0;
    return Number(rows[0].remaining_balance || 0);
  }

  static async getPSBalance(psId, connection = pool) {
    const [rows] = await connection.query("SELECT amount FROM vw_ps_details WHERE id = ?", [psId]);
    if (rows.length === 0) return 0;

    const [obRows] = await connection.query("SELECT SUM(amount) as total FROM vw_obligation_details WHERE allotment_class = 'PS' AND id = ?", [psId]);
    const totalObligated = Number(obRows[0].total || 0);

    return Number(rows[0].amount || 0) - totalObligated;
  }

  /**
   * getAvailableAllocation
   * Returns the remaining budget for a specific MOOE line item.
   * Logic: Total Allotment - (Total PRs created against this line) - (Direct Obligations without PR)
   */
  static async getAvailableAllocation(mooeId, connection = pool) {
    // 1. Get the Total Allotment from the report view
    const [viewRows] = await connection.query(
      "SELECT total_amount FROM vw_mooe_excel_full_report WHERE id = ?",
      [mooeId]
    );

    if (viewRows.length === 0) return 0;
    const totalAmount = Number(viewRows[0].total_amount || 0);

    // 2. Get all PRs linked to this MOOE ID (excluding deleted ones via view)
    const [prRows] = await connection.query("SELECT pr_amount FROM vw_pr_details WHERE mooe_id = ?", [mooeId]);
    const totalPRAmount = prRows.reduce((sum, p) => sum + Number(p.pr_amount), 0);

    // 3. Get direct obligations (not linked to any PR)
    const [obRows] = await connection.query("SELECT amount FROM vw_obligation_details WHERE allotment_class = 'MOOE' AND id = ? AND (prno IS NULL OR prno = '')", [mooeId]);
    const directObligations = obRows.reduce((sum, o) => sum + Number(o.amount), 0);

    // 4. Remaining is what's left to be used for NEW PRs
    const available = totalAmount - totalPRAmount - directObligations;

    return available;
  }

  static async getPAPBalance(planId, papDes, connection = pool) {
    const [mooeItems] = await connection.query("SELECT id, total_amount FROM vw_mooe_excel_full_report WHERE (plan_id = ? OR plan_year = ?) AND pap_des = ? AND row_type = 'DETAIL'", [planId, planId, papDes]);

    let totalAllocation = 0;
    let totalObligated = 0;

    for (const item of mooeItems) {
        totalAllocation += Number(item.total_amount);
        const [obRows] = await connection.query("SELECT SUM(amount) as total FROM vw_obligation_details WHERE allotment_class = 'MOOE' AND id = ?", [item.id]);
        totalObligated += Number(obRows[0].total || 0);
    }

    return totalAllocation - totalObligated;
  }
}

module.exports = BalanceEngine;
