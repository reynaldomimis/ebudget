const FinancialEngine = require("../engines/FinancialEngine");
const FinancialHealthEngine = require("../engines/FinancialHealthEngine");
const MonitoringEngine = require("../engines/MonitoringEngine");
const FiscalYearContext = require("../engines/FiscalYearContext");
const CacheEngine = require("../engines/CacheEngine");

class AIController {
  static async getContext(req, res) {
    try {
      const planId = await FiscalYearContext.getActivePlanId();
      const cacheKey = `ai_context_${planId}`;

      const cached = CacheEngine.get(cacheKey);
      if (cached) return res.json({ success: true, data: cached });

      const executiveSummary = await FinancialEngine.getExecutiveSummary(planId);
      const papSummary = await FinancialEngine.getPapSummary(planId);
      const budgetHealth = await FinancialHealthEngine.getHealthMetrics(planId);
      const monitoring = await MonitoringEngine.getOverview(planId);

      // AI Token Optimization: Return only critical summaries
      const aiContext = {
        summary: {
          allocation: executiveSummary.grandTotal,
          obligated: executiveSummary.obligated.total,
          balance: executiveSummary.balance.total,
          utilization: executiveSummary.utilization
        },
        health: budgetHealth.status,
        topPaps: papSummary.slice(0, 5).map(p => ({ name: p.name, utilization: p.utilization })),
        alerts: utilizationAlerts(executiveSummary)
      };

      CacheEngine.set(cacheKey, aiContext);
      res.json({ success: true, data: aiContext });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

function utilizationAlerts(summary) {
    const alerts = [];
    if (summary.utilization > 90) alerts.push("Budget is almost fully utilized.");
    if (summary.balance.mooe < 100000) alerts.push("MOOE balance is critically low.");
    return alerts;
}

module.exports = AIController;
