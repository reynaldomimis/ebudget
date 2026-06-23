const FinancialEngine = require("../engines/FinancialEngine");
const MonitoringEngine = require("../engines/MonitoringEngine");
const CacheEngine = require("../engines/CacheEngine");
const FiscalYearContext = require("../engines/FiscalYearContext");
const { pool } = require("../config/database");

class DashboardService {
  static async getExecutiveSummary(planId) {
    planId = await FiscalYearContext.resolvePlanId(planId);

    const cacheKey = `exec_summary_final_${planId}`;
    const cachedData = CacheEngine.get(cacheKey);
    if (cachedData) return cachedData;

    const finSummary = await FinancialEngine.getExecutiveSummary(planId);
    const monOverview = await MonitoringEngine.getOverview(planId);

    const mooeTotal = finSummary.mooe || 0;
    const obligatedTotal = finSummary.obligated.total || 0;

    const result = {
      fiscalYear: planId,
      totalBudget: mooeTotal,
      totalObligated: obligatedTotal,
      remainingBudget: mooeTotal - obligatedTotal,
      utilizationRate: mooeTotal > 0 ? (obligatedTotal / mooeTotal) * 100 : 0,

      ps: finSummary.ps,
      rlip: finSummary.rlip,
      personnelTotal: finSummary.personnelTotal,
      mooe: mooeTotal,
      co: finSummary.co || 0,
      typeSummary: finSummary.typeSummary,
      papComposition: finSummary.papComposition,
      workflow: {
        draft: monOverview.counts.draft || 0,
        review: monOverview.counts.forReview || 0,
        approved: monOverview.counts.approved || 0,
        partiallyObligated: monOverview.counts.partiallyObligated || 0,
        obligated: monOverview.counts.obligated || 0,
        rejected: monOverview.counts.rejected || 0
      },
      health: {
        status: monOverview.fiscalYearHealth,
        score: mooeTotal > 0 ? (obligatedTotal / mooeTotal) * 100 : 0
      },
      activePRs: monOverview.activePRs,
      activeObligations: monOverview.totalObligations
    };

    CacheEngine.set(cacheKey, result);
    return result;
  }

  static async getAuditFeed(planId) {
    const year = planId ? (String(planId).includes('-') ? planId.split('-')[1] : planId) : null;

    let query = "SELECT * FROM audit_logs";
    const params = [];

    if (year && /^20\d{2}$/.test(year)) {
      query += " WHERE YEAR(timestamp) = ?";
      params.push(year);
    }

    query += " ORDER BY timestamp DESC LIMIT 50";
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async getRecentTransactions(planId, limit = 15) {
    const year = planId ? (String(planId).includes('-') ? planId.split('-')[1] : planId) : new Date().getFullYear();

    const [rows] = await pool.query(`
      SELECT
        id,
        prno as reference,
        'PR' as type,
        amount,
        workflow_status as status,
        created_at as date,
        purpose as description
      FROM pr_so
      WHERE is_deleted = 0 AND YEAR(created_at) = ?
      UNION ALL
      SELECT
        id,
        obrno as reference,
        'OBLIGATION' as type,
        amount,
        'Obligated' as status,
        transaction_date as date,
        particular as description
      FROM obligation
      WHERE is_deleted = 0 AND YEAR(transaction_date) = ?
      ORDER BY date DESC
      LIMIT ?
    `, [year, year, limit]);
    return rows;
  }
}

module.exports = DashboardService;
