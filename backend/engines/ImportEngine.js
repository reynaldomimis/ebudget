const FiscalYearRepository = require("../repositories/FiscalYearRepository");
const MOOERepository = require("../repositories/MOOERepository");
const PSRepository = require("../repositories/PSRepository");
const TransactionEngine = require("../engines/TransactionEngine");
const AuditEngine = require("../engines/AuditEngine");
const DataNormalizationEngine = require("../engines/DataNormalizationEngine");
const { PAP_MAPPING_BY_LABEL } = require("../config/PapMappingConfig");

class ImportEngine {
  static async getNextReportOrder(connection) {
    const [psRes] = await connection.execute("SELECT MAX(report_order) as maxOrder FROM vw_ps_details");
    const [mooeRes] = await connection.execute("SELECT MAX(report_order) as maxOrder FROM vw_mooe_excel_full_report");

    const maxPS = psRes[0].maxOrder || 0;
    const maxMOOE = mooeRes[0].maxOrder || 0;

    return Math.max(maxPS, maxMOOE) + 1;
  }

  static resolveCodes(label) {
    if (!label) return {};
    const normalized = DataNormalizationEngine.normalizeLabel(label).toUpperCase();

    const mappings = {
      "GENERAL ADMINISTRATION AND SUPPORT": {
        type: "General Administration and Support",
        type_code: "100000000000000"
      },
      "GENERAL MANAGEMENT AND SUPERVISION": {
        code: "100000100001000",
        type: "General Administration and Support",
        type_code: "100000000000000"
      },
      "HUMAN RESOURCE DEVELOPMENT": {
        code: "100000100002000",
        type: "General Administration and Support",
        type_code: "100000000000000"
      },
      "ADMINISTRATION OF PERSONNEL BENEFITS": {
        code: "100000100002000",
        type: "General Administration and Support",
        type_code: "100000000000000"
      },

      "NATIONAL NUTRITION MANAGEMENT PROGRAM": {
        type: "National Nutrition Management Program",
        type_code: "310100000000000"
      },
      "NUTRITION POLICY, STANDARDS, PLAN AND PROGRAM DEVELOPMENT AND COORDINATION": {
        code: "310100100001000",
        type: "National Nutrition Management Program",
        type_code: "310100000000000"
      },
      "PHILIPPINE FOOD AND NUTRITION SURVEILLANCE": {
        code: "310100100002000",
        type: "National Nutrition Management Program",
        type_code: "310100000000000"
      },
      "PROMOTION OF GOOD NUTRITION": {
        code: "310100100003000",
        type: "National Nutrition Management Program",
        type_code: "310100000000000"
      },
      "ASSISTANCE TO NATIONAL, LOCAL NUTRITION AND RELATED PROGRAMS": {
        code: "310100100004000",
        type: "National Nutrition Management Program",
        type_code: "310100000000000"
      }
    };

    // 1. Try match in hardcoded mappings
    for (const key in mappings) {
      if (normalized.includes(key)) {
        return mappings[key];
      }
    }

    // 2. Fallback to Config file
    const labelMatch = DataNormalizationEngine.normalizeLabel(label);
    const mapped = PAP_MAPPING_BY_LABEL[labelMatch] || {};
    return {
      code: mapped.pap_des_code,
      type: mapped.pap_type,
      type_code: mapped.pap_type_code
    };
  }

  static isRlipRow(ps) {
    const normalizedDes = DataNormalizationEngine.normalizeLabel(ps.pap_des || "");
    return (ps.cost_category === 'RLIP') ||
           normalizedDes.toUpperCase().includes("RETIREMENT AND LIFE INSURANCE") ||
           normalizedDes.toUpperCase().includes("(RLIP)");
  }

  static async importMOOE(planData, mooeItems, connection = null) {
    const worker = async (conn) => {
      await FiscalYearRepository.create(planData, conn);
      let nextReportOrder = await this.getNextReportOrder(conn);

      for (const item of mooeItems) {
        const resolvedDes = this.resolveCodes(item.pap_des || "");
        const resolvedType = this.resolveCodes(item.pap_type || "");

        const resolved = {
          type: resolvedDes.type || resolvedType.type,
          type_code: resolvedDes.type_code || resolvedType.type_code,
          code: resolvedDes.code
        };

        const subTotalKeywords = ["SUB-TOTAL", "CEILING", "DIFFERENCE", "TOTAL"];
        const subTotalLabel = String(item.sub_total_name || "").toUpperCase();
        const isSubtotal = item.is_subtotal || (subTotalLabel && subTotalKeywords.some(k => subTotalLabel.includes(k))) ? 1 : 0;

        const data = {
          ...item,
          plan_id: planData.plan_id,
          office: DataNormalizationEngine.normalizeLabel(item.office || item.division || ""),
          pap_type: resolved.type || DataNormalizationEngine.normalizeLabel(item.pap_type),
          pap_type_code: resolved.type_code || item.pap_type_code || "",
          pap_des: DataNormalizationEngine.normalizeLabel(item.pap_des),
          pap_des_code: resolved.code || item.pap_des_code || "",
          name: DataNormalizationEngine.normalizeLabel(item.name),
          report_order: nextReportOrder++,
          expense_items: DataNormalizationEngine.normalizeLabel(item.expense_items),
          expense_items_sub: DataNormalizationEngine.normalizeLabel(item.expense_items_sub),
          sub_total_name: item.sub_total_name || "",
          is_subtotal: isSubtotal
        };

        // Cleanup fields as requested
        delete data.has_expense_items;
        delete data.numbering;
        delete data.aggregation_level;
        delete data.sort_order;

        // Safety cleanup
        delete data.plan_year;
        delete data.cost_category;
        delete data.subtotal_label;
        delete data.title;
        delete data.division;
        delete data.allotment_class;

        await MOOERepository.create(data, conn);
      }
    };

    if (connection) return await worker(connection);
    return await TransactionEngine.execute(worker);
  }

  static async importPS(psRecords, connection = null) {
    const worker = async (conn) => {
      const papDataMap = {};
      let nextReportOrder = await this.getNextReportOrder(conn);

      const preparedRecords = psRecords.map(ps => {
        const resolvedDes = this.resolveCodes(ps.pap_des || "");
        const resolvedType = this.resolveCodes(ps.pap_type || "");
        const isRlip = this.isRlipRow(ps);

        return {
          ...ps,
          isRlip,
          resolved: {
            type: resolvedDes.type || resolvedType.type,
            type_code: resolvedDes.type_code || resolvedType.type_code,
            code: resolvedDes.code
          },
          pap_des: DataNormalizationEngine.normalizeLabel(ps.pap_des || ""),
          pap_des_code: resolvedDes.code || ps.pap_des_code || "",
          report_order: nextReportOrder++
        };
      });

      for (const ps of preparedRecords) {
        if (!ps.isRlip) {
          const data = {
            plan_id: ps.plan_id || null,
            activities_id: ps.activities_id || null,
            pap_type: ps.resolved.type || DataNormalizationEngine.normalizeLabel(ps.pap_type || ""),
            pap_type_code: ps.resolved.type_code || ps.pap_type_code || "",
            pap_des: ps.pap_des,
            pap_des_code: ps.pap_des_code,
            expense_items: DataNormalizationEngine.normalizeLabel(ps.expense_items || ""),
            amount: ps.amount || 0,
            total: ps.total || ps.total_amount || 0,
            report_order: ps.report_order
          };

          const psResult = await PSRepository.create(data, conn);
          papDataMap[ps.pap_des_code] = { id: psResult.insertId };
        }
      }

      for (const ps of preparedRecords) {
        if (ps.isRlip) {
          let parentData = papDataMap[ps.pap_des_code];
          if (!parentData) {
            const [anyPs] = await conn.execute(
              "SELECT id FROM vw_ps_details WHERE pap_des_code = ? ORDER BY id DESC LIMIT 1",
              [ps.pap_des_code]
            );
            if (anyPs.length > 0) parentData = { id: anyPs[0].id };
          }

          if (parentData) {
            await PSRepository.createRLIP({
              ps_id: parentData.id,
              pap_des_code: ps.pap_des_code,
              pap_des: ps.pap_des,
              amount: ps.total_amount || ps.amount || 0
            }, conn);
          } else {
            console.warn(`Warning: No matching PS row found for RLIP PAP ${ps.pap_des_code}. Skipping rlip entry.`);
          }
        }
      }

      await AuditEngine.log("PS_IMPORT", { count: psRecords.length });
    };

    if (connection) return await worker(connection);
    return await TransactionEngine.execute(worker);
  }
}

module.exports = ImportEngine;
