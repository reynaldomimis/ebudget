const FinancialEngine = require("./FinancialEngine");
const FinancialHealthEngine = require("./FinancialHealthEngine");
const PRRepository = require("../repositories/PRRepository");
const ObligationRepository = require("../repositories/ObligationRepository");
const FiscalYearContext = require("./FiscalYearContext");

class MonitoringEngine {
  static async getOverview(planId) {
    if (!planId) planId = await FiscalYearContext.getActivePlanId();

    const summary = await FinancialEngine.getExecutiveSummary(planId);
    const health = await FinancialHealthEngine.getHealthMetrics(planId);
    const prs = (await PRRepository.getAll()) || [];
    const obligations = (await ObligationRepository.getAll()) || [];

    return {
      totalPRs: prs.length,
      activePRs: prs.filter(p => p.is_fully_obligated === 0).length,
      fullyObligatedPRs: prs.filter(p => p.is_fully_obligated === 1).length,
      totalObligations: obligations.length,
      budgetUtilization: summary.utilization,
      remainingAllocation: summary.balance.total,
      fiscalYearHealth: health.status,
      counts: {
        draft: prs.filter(p => p.workflow_status === 'Draft').length,
        forReview: prs.filter(p => p.workflow_status === 'For Review').length,
        approved: prs.filter(p => p.workflow_status === 'Approved').length,
        partiallyObligated: prs.filter(p => p.workflow_status === 'Partially Obligated').length,
        obligated: prs.filter(p => p.workflow_status === 'Obligated').length,
        rejected: prs.filter(p => p.workflow_status === 'Rejected').length,
      }
    };
  }
}

module.exports = MonitoringEngine;
