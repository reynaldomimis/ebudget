const FinancialEngine = require("./FinancialEngine");
const FinancialHealthEngine = require("./FinancialHealthEngine");
const PRRepository = require("../repositories/PRRepository");
const ObligationRepository = require("../repositories/ObligationRepository");
const FiscalYearContext = require("./FiscalYearContext");

class MonitoringEngine {
  static async getOverview(planId) {
    if (!planId) planId = await FiscalYearContext.getActivePlanId();
    const { pool } = require("../config/database");

    const parts = String(planId).split('-');
    const yearPart = parts.find(p => /^20\d{2}$/.test(p));
    const year = yearPart || planId;

    const summary = await FinancialEngine.getExecutiveSummary(planId);
    const health = await FinancialHealthEngine.getHealthMetrics(planId);

    // Efficiently get counts instead of fetching all records
    const [prStats] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN workflow_status != 'Obligated' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN workflow_status = 'Obligated' THEN 1 ELSE 0 END) as fullyObligated
      FROM pr_so
      WHERE is_deleted = 0 AND YEAR(created_at) = ?
    `, [year]);

    const [obStats] = await pool.query(`
      SELECT COUNT(*) as total FROM obligation WHERE is_deleted = 0 AND YEAR(transaction_date) = ?
    `, [year]);

    const stats = prStats[0] || { total: 0, active: 0, fullyObligated: 0 };

    return {
      totalPRs: stats.total,
      activePRs: stats.active,
      fullyObligatedPRs: stats.fullyObligated,
      totalObligations: obStats[0].total,
      budgetUtilization: summary.utilization,
      remainingAllocation: summary.balance.total,
      fiscalYearHealth: health.status,
      counts: summary.counts
    };
  }
}

module.exports = MonitoringEngine;
