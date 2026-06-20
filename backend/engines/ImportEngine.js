const FiscalYearRepository = require("../repositories/FiscalYearRepository");
const MOOERepository = require("../repositories/MOOERepository");
const PSRepository = require("../repositories/PSRepository");
const TransactionEngine = require("../engines/TransactionEngine");
const AuditEngine = require("../engines/AuditEngine");

const DataNormalizationEngine = require("../engines/DataNormalizationEngine");

class ImportEngine {
  static async importMOOE(planData, mooeItems) {
    return await TransactionEngine.execute(async (connection) => {
      // 1. Create/Ensure Plan
      await FiscalYearRepository.create(planData, connection);

      // 2. Import MOOE Items
      for (const item of mooeItems) {
        // Ensure office is used instead of division
        const data = {
          ...item,
          plan_id: planData.plan_id,
          office: DataNormalizationEngine.normalizeLabel(item.office || item.division || ""),
          pap_type: DataNormalizationEngine.normalizeLabel(item.pap_type),
          pap_des: DataNormalizationEngine.normalizeLabel(item.pap_des),
          pap_des_code: item.pap_des_code || "",
          aggregation_level: item.aggregation_level || "ITEM",
          name: DataNormalizationEngine.normalizeLabel(item.name),
          is_subtotal: item.is_subtotal || 0,
          subtotal_label: item.subtotal_label || "",
          report_order: item.report_order || 0,
          expense_items: DataNormalizationEngine.normalizeLabel(item.expense_items),
          expense_items_sub: DataNormalizationEngine.normalizeLabel(item.expense_items_sub)
        };
        delete data.division;
        delete data.allotment_class; // Requirement 5: do not save allotment_class

        await MOOERepository.create(data, connection);
      }

      await AuditEngine.log("MOOE_IMPORT", { plan_id: planData.plan_id, count: mooeItems.length });
    });
  }

  static async importPS(psRecords) {
    return await TransactionEngine.execute(async (connection) => {
      const DataNormalizationEngine = require("./DataNormalizationEngine");
      for (const ps of psRecords) {
        const data = {
            ...ps,
            pap_type: DataNormalizationEngine.normalizeLabel(ps.pap_type || ""),
            pap_des: DataNormalizationEngine.normalizeLabel(ps.pap_des || ""),
            cost_category: ps.cost_category || "PS",
            aggregation_level: ps.aggregation_level || "ITEM",
            is_subtotal: ps.is_subtotal || 0,
            subtotal_label: ps.subtotal_label || "",
            report_order: ps.report_order || 0,
            expense_items: DataNormalizationEngine.normalizeLabel(ps.expense_items || "")
        };
        await PSRepository.create(data, connection);
      }
      await AuditEngine.log("PS_IMPORT", { count: psRecords.length });
    });
  }
}

module.exports = ImportEngine;
