const FinancialEngine = require("./FinancialEngine");

class FinancialHealthEngine {
  static async getHealthMetrics(planId) {
    const summary = await FinancialEngine.getExecutiveSummary(planId);

    const utilizationRate = summary.utilization;
    let status = "Healthy";

    if (utilizationRate > 95) status = "Near Exhausted";
    else if (utilizationRate < 30) status = "Low Utilization";

    // Simplified metrics for now
    return {
      budgetUtilization: utilizationRate,
      obligationRate: utilizationRate,
      remainingAllocation: summary.balance.total,
      status: status,
      planId: planId
    };
  }
}

module.exports = FinancialHealthEngine;
