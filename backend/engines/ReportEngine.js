const FinancialEngine = require("./FinancialEngine");
const BalanceEngine = require("./BalanceEngine");
const FiscalYearContext = require("./FiscalYearContext");

class ReportEngine {
  static async getStandardReport(planId) {
    if (!planId) planId = await FiscalYearContext.getActivePlanId();

    const summary = await FinancialEngine.getExecutiveSummary(planId);
    const papSummary = await FinancialEngine.getPapSummary(planId);

    return {
      metadata: {
        generatedAt: new Date(),
        planId: planId
      },
      summary,
      papSummary
    };
  }
}

module.exports = ReportEngine;
