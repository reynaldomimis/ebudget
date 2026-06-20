const PSRepository = require("../repositories/PSRepository");
const FiscalYearRepository = require("../repositories/FiscalYearRepository");
const TransactionEngine = require("../engines/TransactionEngine");
const AuditEngine = require("../engines/AuditEngine");

class PSService {
  static async createPlanWithPS(planInfo, psItems) {
    console.log("DEBUG: PS IMPORT SERVICE HIT");
    return await TransactionEngine.execute(async (connection) => {
      const year = new Date().getFullYear();
      const plan_id = `PLAN-PS-${year}-${Date.now()}`;

      const planData = {
        plan_id,
        year,
        title: planInfo.title,
        range_label: planInfo.range_label || "Annual"
      };

      await FiscalYearRepository.create(planData, connection);

      const DataNormalizationEngine = require("../engines/DataNormalizationEngine");
      for (const item of psItems) {
        const psData = {
          ...item,
          plan_id,
          plan_year: year,
          pap_type: DataNormalizationEngine.normalizeLabel(item.pap_type || ""),
          pap_des: DataNormalizationEngine.normalizeLabel(item.pap_des || ""),
          cost_category: item.cost_category || "PS",
          aggregation_level: item.aggregation_level || "ITEM",
          is_subtotal: item.is_subtotal || 0,
          subtotal_label: item.subtotal_label || "",
          report_order: item.report_order || 0,
          expense_items: DataNormalizationEngine.normalizeLabel(item.expense_items || "")
        };
        await PSRepository.create(psData, connection);
      }

      await AuditEngine.log("PS_PLAN_CREATED", { plan_id, count: psItems.length });
      return { plan_id, psItems };
    });
  }

  static async getAllPS(filters) {
    return await PSRepository.getAll(filters);
  }

  static async updatePS(id, data) {
    const result = await PSRepository.update(id, data);
    const CacheEngine = require("../engines/CacheEngine");
    CacheEngine.invalidate("exec_summary");
    await AuditEngine.log("PS_UPDATED", { id, data }, null, 'PS', id);
    return result;
  }

  static async deletePS(id) {
    const result = await PSRepository.delete(id);
    const CacheEngine = require("../engines/CacheEngine");
    CacheEngine.invalidate("exec_summary");
    await AuditEngine.log("PS_DELETED", { id }, null, 'PS', id);
    return result;
  }

  static async getDistinctValues(field) {
    const FilterEngine = require("../engines/FilterEngine");
    return await FilterEngine.getDistinctValues("ps", field);
  }
}

module.exports = PSService;
