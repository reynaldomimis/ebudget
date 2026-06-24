const FinancialEngine = require("../engines/FinancialEngine");
const FilterEngine = require("../engines/FilterEngine");
const FiscalYearContext = require("../engines/FiscalYearContext");
const CacheEngine = require("../engines/CacheEngine");
const { handleError } = require("../utils/errorHandler");

class FinancialController {
  static async getExecutiveSummary(req, res) {
    try {
      let { plan_id } = req.query;
      plan_id = await FiscalYearContext.resolvePlanId(plan_id);

      const cacheKey = `exec_summary_${plan_id}`;
      const cached = CacheEngine.get(cacheKey);
      if (cached) return res.json({ success: true, data: cached });

      const data = await FinancialEngine.getExecutiveSummary(plan_id);
      CacheEngine.set(cacheKey, data);
      res.json({ success: true, data });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getPapSummary(req, res) {
    try {
      let { plan_id } = req.query;
      plan_id = await FiscalYearContext.resolvePlanId(plan_id);

      const data = await FinancialEngine.getPapSummary(plan_id);
      res.json({ success: true, data });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getPapDetail(req, res) {
    try {
      let { plan_id, pap_type, pap_des } = req.query;
      plan_id = await FiscalYearContext.resolvePlanId(plan_id);

      const data = await FinancialEngine.getPapDetail(plan_id, pap_type, pap_des);
      res.json({ success: true, data });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getBudgetRegistry(req, res) {
    try {
      let { plan_id } = req.query;
      plan_id = await FiscalYearContext.resolvePlanId(plan_id);

      const data = await FinancialEngine.getBudgetRegistry(plan_id);
      res.json({ success: true, data });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getFilters(req, res) {
    try {
      let { plan_id } = req.query;

      // FIX: Don't resolve to a specific ID if it's just a year
      // This allows FilterEngine to use LIKE '%2026%' to get both MOOE and PS data
      if (plan_id && !/^20\d{2}$/.test(String(plan_id))) {
          plan_id = await FiscalYearContext.resolvePlanId(plan_id);
      }

      const data = await FilterEngine.getHierarchicalFilters(plan_id);
      res.json({ success: true, data });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getBalance(req, res) {
    try {
      const { id, type } = req.query;
      const BalanceEngine = require("../engines/BalanceEngine");
      let balance = 0;
      if (type === 'PS') {
        balance = await BalanceEngine.getPSBalance(id);
      } else {
        balance = await BalanceEngine.getAvailableAllocation(id);
      }
      res.json({ success: true, data: { balance } });
    } catch (error) {
      handleError(error, res);
    }
  }
}

module.exports = FinancialController;
