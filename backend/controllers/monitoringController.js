const MonitoringEngine = require("../engines/MonitoringEngine");
const FinancialEngine = require("../engines/FinancialEngine");
const CacheEngine = require("../engines/CacheEngine");
const FiscalYearContext = require("../engines/FiscalYearContext");

class MonitoringController {
  static async getOverview(req, res) {
    try {
      let { plan_id } = req.query;
      plan_id = await FiscalYearContext.resolvePlanId(plan_id);

      const data = await MonitoringEngine.getHierarchicalOverview(plan_id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getPapSummary(req, res) {
    try {
      let { plan_id } = req.query;
      plan_id = await FiscalYearContext.resolvePlanId(plan_id);

      const cacheKey = `pap_summary_${plan_id}`;
      const cached = CacheEngine.get(cacheKey);
      if (cached) return res.json({ success: true, data: cached });

      const data = await FinancialEngine.getPapSummary(plan_id);
      CacheEngine.set(cacheKey, data);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getWorkflowSummary(req, res) {
    try {
      let { plan_id } = req.query;
      plan_id = await FiscalYearContext.resolvePlanId(plan_id);

      const data = await MonitoringEngine.getOverview(plan_id);
      res.json({ success: true, data: data.counts });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = MonitoringController;
