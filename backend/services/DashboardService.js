const FinancialEngine = require("../engines/FinancialEngine");
const MonitoringEngine = require("../engines/MonitoringEngine");
const CacheEngine = require("../engines/CacheEngine");
const FiscalYearContext = require("../engines/FiscalYearContext");

class DashboardService {
  static async getExecutiveSummary(planId) {
    planId = await FiscalYearContext.resolvePlanId(planId);

    const cacheKey = `exec_summary_final_${planId}`;
    const cachedData = CacheEngine.get(cacheKey);
    if (cachedData) return cachedData;

    const finSummary = await FinancialEngine.getExecutiveSummary(planId);
    const monOverview = await MonitoringEngine.getOverview(planId);

    const result = {
      fiscalYear: planId,
      totalBudget: finSummary.grandTotal,
      totalObligated: finSummary.obligated.total,
      remainingBudget: finSummary.balance.total,
      utilizationRate: finSummary.utilization,
      // Breakdown for regression fix
      ps: finSummary.ps,
      rlip: finSummary.rlip,
      personnelTotal: finSummary.personnelTotal,
      mooe: finSummary.mooe,
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
        score: finSummary.utilization
      },
      activePRs: monOverview.activePRs,
      activeObligations: monOverview.totalObligations
    };

    CacheEngine.set(cacheKey, result);
    return result;
  }
}

module.exports = DashboardService;
