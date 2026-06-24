const PSRepository = require("../repositories/PSRepository");
const FiscalYearRepository = require("../repositories/FiscalYearRepository");
const TransactionEngine = require("../engines/TransactionEngine");
const AuditEngine = require("../engines/AuditEngine");

class PSService {
  static async createPlanWithPS(planInfo, psItems) {
    console.log("DEBUG: PS IMPORT SERVICE HIT");
    return await TransactionEngine.execute(async (connection) => {
      const year = new Date().getFullYear();
      const plan_id = `PS-${year}-${Date.now()}`;

      const planData = {
        plan_id,
        year,
        title: planInfo.title,
        range_label: planInfo.range_label || "Annual"
      };

      await FiscalYearRepository.create(planData, connection);

      const ImportEngine = require("../engines/ImportEngine");
      const recordsWithPlanId = psItems.map(item => ({ ...item, plan_id }));
      await ImportEngine.importPS(recordsWithPlanId, connection);

      await AuditEngine.log("PS_PLAN_CREATED", { plan_id, count: psItems.length });
      return { plan_id, psItems };
    });
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
}

module.exports = PSService;
