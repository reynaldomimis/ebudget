const MOOERepository = require("../repositories/MOOERepository");
const FiscalYearRepository = require("../repositories/FiscalYearRepository");
const TransactionEngine = require("../engines/TransactionEngine");
const AuditEngine = require("../engines/AuditEngine");
const DataNormalizationEngine = require("../engines/DataNormalizationEngine");

class MOOEService {
  static async createPlanWithMOOE(planInfo, mooeItems) {
    console.log("DEBUG: IMPORT SERVICE HIT");
    return await TransactionEngine.execute(async (connection) => {
      const year = new Date().getFullYear();
      const plan_id = `PLAN-${year}-${Date.now()}`;

      const planData = {
        plan_id,
        year,
        title: planInfo.title,
        range_label: planInfo.range_label || "Annual"
      };

      await FiscalYearRepository.create(planData, connection);

      for (const [index, item] of mooeItems.entries()) {
        const mooeData = {
          ...item,
          plan_id,
          plan_year: year,
          sort_order: item.sort_order ?? index,
          numbering: (index + 1).toString(),
          office: DataNormalizationEngine.normalizeLabel(item.office || ""),
          pap_type: DataNormalizationEngine.normalizeLabel(item.pap_type || ""),
          pap_des: DataNormalizationEngine.normalizeLabel(item.pap_des || ""),
          name: DataNormalizationEngine.normalizeLabel(item.name || ""),
          expense_items: DataNormalizationEngine.normalizeLabel(item.expense_items || ""),
          expense_items_sub: DataNormalizationEngine.normalizeLabel(item.expense_items_sub || "")
        };
        await MOOERepository.create(mooeData, connection);
      }

      await AuditEngine.log("MOOE_PLAN_CREATED", { plan_id, count: mooeItems.length });
      return { plan_id, mooeItems };
    });
  }

  static async getAllMOOE(filters) {
    if (filters.plan_id) {
       return await MOOERepository.getByPlan(filters.plan_id, filters);
    }
    return await MOOERepository.getByPlan(null, filters);
  }

  static async getMOOEById(id) {
    return await MOOERepository.getById(id);
  }

  static async updateMOOE(id, data) {
    const result = await MOOERepository.update(id, data);
    const CacheEngine = require("../engines/CacheEngine");
    CacheEngine.invalidate("exec_summary");
    await AuditEngine.log("MOOE_UPDATED", { id, data }, null, 'MOOE', id);
    return result;
  }

  static async deleteMOOE(id) {
    const result = await MOOERepository.delete(id);
    const CacheEngine = require("../engines/CacheEngine");
    CacheEngine.invalidate("exec_summary");
    await AuditEngine.log("MOOE_DELETED", { id }, null, 'MOOE', id);
    return result;
  }

  static async deleteByPlanId(planId) {
    const result = await MOOERepository.deleteByPlan(planId);
    await AuditEngine.log("MOOE_PLAN_DELETED", { planId });
    return result;
  }

  static async getDistinctValues(field, filters = {}) {
    const FilterEngine = require("../engines/FilterEngine");
    return await FilterEngine.getDistinctValues("mooe", field, filters);
  }
}

module.exports = MOOEService;
