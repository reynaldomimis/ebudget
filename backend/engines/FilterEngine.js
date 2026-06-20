const { pool } = require("../config/database");
const DataNormalizationEngine = require("./DataNormalizationEngine");

class FilterEngine {
  static async getDistinctValues(table, field, filters = {}) {
    const allowedTables = ["mooe", "ps", "pr_so", "obligation"];
    const allowedFields = ["pap_type", "pap_des", "office", "name", "expense_items", "expense_items_sub", "ref_main_name"];

    if (!allowedTables.includes(table)) {
      throw new Error(`Invalid table: ${table}`);
    }
    if (!allowedFields.includes(field)) {
        throw new Error(`Invalid field: ${field}`);
    }

    let query = `SELECT DISTINCT ${field} FROM ${table} WHERE ${field} IS NOT NULL AND ${field} != '' AND is_deleted = 0`;
    const values = [];

    if (table === "mooe") {
        query += " AND is_subtotal = 0";

        if (field === 'pap_type' || field === 'pap_des' || field === 'office' || field === 'name') {
            query += ` AND (
                (expense_items IS NOT NULL AND TRIM(expense_items) != '')
                OR
                (expense_items_sub IS NOT NULL AND TRIM(expense_items_sub) != '')
            )`;
        }
    }

    // PS does not have is_subtotal column, we rely on expense_items check
    if (table === "ps") {
        query += " AND expense_items IS NOT NULL AND expense_items != ''";
    }

    Object.keys(filters).forEach(key => {
        if (filters[key]) {
            query += ` AND ${key} = ?`;
            values.push(filters[key]);
        }
    });

    if (table === "mooe") {
        query += ` GROUP BY ${field} ORDER BY MIN(sort_order) ASC`;
    } else {
        query += ` ORDER BY ${field} ASC`;
    }

    const [rows] = await pool.execute(query, values);
    return rows.map(r => DataNormalizationEngine.normalizeLabel(r[field]));
  }

  static async getHierarchicalFilters(plan_id) {
    // STRICT SQL FILTER: Exclude rows that are purely structural (no expense category or sub-category)
    let mooeQuery = `
      SELECT id, pap_type, pap_des, office, name, expense_items, expense_items_sub
      FROM mooe
      WHERE is_subtotal = 0
        AND is_deleted = 0
        AND name IS NOT NULL AND TRIM(name) != ''
        AND (
          (expense_items IS NOT NULL AND TRIM(expense_items) != '')
          OR
          (expense_items_sub IS NOT NULL AND TRIM(expense_items_sub) != '')
        )
    `;
    const mooeValues = [];

    if (plan_id) {
        mooeQuery += " AND plan_id = ?";
        mooeValues.push(plan_id);
    }

    mooeQuery += " ORDER BY sort_order ASC";

    const [mooeRows] = await pool.execute(mooeQuery, mooeValues);

    const hierarchy = {};
    let lastExpenseItem = "";
    let lastRecordKey = "";

    mooeRows.forEach(row => {
      // Normalize labels for consistent matching
      const pap_type = DataNormalizationEngine.normalizeLabel(row.pap_type);
      const pap_des = DataNormalizationEngine.normalizeLabel(row.pap_des);
      const office = DataNormalizationEngine.normalizeLabel(row.office);
      const name = DataNormalizationEngine.normalizeLabel(row.name);
      let expense_items = DataNormalizationEngine.normalizeLabel(row.expense_items);
      const expense_items_sub = DataNormalizationEngine.normalizeLabel(row.expense_items_sub);

      const recordKey = `${pap_type}|${pap_des}|${office}|${name}`;

      // Carry over expense_items category if blank (inherits from previous row in same group)
      if ((!expense_items || expense_items.trim() === "") && recordKey === lastRecordKey) {
          expense_items = lastExpenseItem;
      }

      // FINAL VALIDATION: Discard if we still have no selectable expense item
      if (!expense_items || expense_items.trim() === "") {
          return;
      }

      // Initialize hierarchy nodes only for validated actionable items
      if (!hierarchy[pap_type]) hierarchy[pap_type] = {};
      if (!hierarchy[pap_type][pap_des]) hierarchy[pap_type][pap_des] = {};
      if (!hierarchy[pap_type][pap_des][office]) hierarchy[pap_type][pap_des][office] = {};
      if (!hierarchy[pap_type][pap_des][office][name]) hierarchy[pap_type][pap_des][office][name] = {};

      if (!hierarchy[pap_type][pap_des][office][name][expense_items]) {
          hierarchy[pap_type][pap_des][office][name][expense_items] = [];
      }

      const subItemLabel = (expense_items_sub && expense_items_sub.trim() !== "")
          ? expense_items_sub
          : expense_items;

      hierarchy[pap_type][pap_des][office][name][expense_items].push({
          id: row.id,
          label: subItemLabel
      });

      // Update tracking pointers
      lastExpenseItem = expense_items;
      lastRecordKey = recordKey;
    });

    // PS Hierarchy (keep it simple for now)
    const psPapTypes = await this.getDistinctValues("ps", "pap_type");
    const psHierarchy = {};
    for (const type of psPapTypes) {
        psHierarchy[type] = await this.getDistinctValues("ps", "pap_des", { pap_type: type });
    }

    return {
      mooe: hierarchy,
      ps: psHierarchy
    };
  }
}

module.exports = FilterEngine;
