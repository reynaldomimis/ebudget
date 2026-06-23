const { pool } = require("../config/database");
const DataNormalizationEngine = require("./DataNormalizationEngine");

class FilterEngine {
  static async getDistinctValues(table, field, filters = {}) {
    const allowedTables = ["mooe", "ps", "pr_so", "obligation", "vw_mooe_excel_full_report"];
    const allowedFields = ["pap_type", "pap_des", "office", "activity", "object_group", "sub_object", "ref_main_name", "name", "expense_items", "expense_items_sub"];

    if (!allowedTables.includes(table)) {
      throw new Error(`Invalid table: ${table}`);
    }

    const fieldMap = {
        'name': 'activity',
        'expense_items': 'object_group',
        'expense_items_sub': 'sub_object'
    };

    const targetField = fieldMap[field] || field;

    let targetTable = table;
    if (table === 'mooe') targetTable = 'vw_mooe_excel_full_report';

    // refactor: if field is pap_type or pap_des, we want the code and label combined
    let selectClause = `DISTINCT ${targetField}`;
    if (targetTable === "vw_mooe_excel_full_report") {
        if (targetField === 'pap_type') selectClause = `DISTINCT CONCAT(pap_type_code, '|', pap_type) as result`;
        else if (targetField === 'pap_des') selectClause = `DISTINCT CONCAT(pap_des_code, '|', pap_des) as result`;
        else selectClause = `DISTINCT ${targetField} as result`;
    } else {
        selectClause = `DISTINCT ${targetField} as result`;
    }

    let query = `SELECT ${selectClause} FROM ${targetTable} WHERE 1=1`;

    if (targetTable !== "vw_mooe_excel_full_report") {
        query += " AND is_deleted = 0";
    }

    const values = [];

    if (targetTable === "vw_mooe_excel_full_report") {
        query += " AND row_type = 'DETAIL' AND total_amount > 0";
    }

    Object.keys(filters).forEach(key => {
        let targetKey = fieldMap[key] || key;
        let filterValue = filters[key];

        if (targetTable === "vw_mooe_excel_full_report") {
            if (key === 'pap_type') targetKey = 'pap_type_code';
            if (key === 'pap_des') targetKey = 'pap_des_code';

            // If the value passed is a combined "code|label", extract only the code
            if (String(filterValue).includes('|')) {
                filterValue = filterValue.split('|')[0];
            }
        }

        if (filterValue) {
            query += ` AND ${targetKey} = ?`;
            values.push(filterValue);
        }
    });

    if (targetTable === "vw_mooe_excel_full_report") {
        query += ` GROUP BY result ORDER BY MIN(report_order) ASC`;
    } else {
        query += ` ORDER BY result ASC`;
    }

    const [rows] = await pool.execute(query, values);
    return rows.map(r => r.result);
  }

  static async getHierarchicalFilters(plan_id) {
    let mooeQuery = `
      SELECT
        id,
        pap_type_code, pap_type,
        pap_des_code, pap_des,
        office, activity as name,
        object_group as expense_items,
        sub_object as expense_items_sub
      FROM vw_mooe_excel_full_report
      WHERE row_type = 'DETAIL'
        AND total_amount > 0
    `;
    const mooeValues = [];

    if (plan_id) {
        mooeQuery += " AND plan_id = ?";
        mooeValues.push(plan_id);
    }

    mooeQuery += " ORDER BY report_order ASC";

    const [mooeRows] = await pool.execute(mooeQuery, mooeValues);

    const hierarchy = {};

    mooeRows.forEach(row => {
      // Create code-aware keys to prevent description-based mismatch
      const typeKey = `${row.pap_type_code}|${row.pap_type}`;
      const desKey = `${row.pap_des_code}|${row.pap_des}`;
      const office = row.office || 'N/A';
      const name = row.name || 'General';
      const expense_items = row.expense_items || 'General';
      const expense_items_sub = row.expense_items_sub;

      if (!hierarchy[typeKey]) hierarchy[typeKey] = {};
      if (!hierarchy[typeKey][desKey]) hierarchy[typeKey][desKey] = {};
      if (!hierarchy[typeKey][desKey][office]) hierarchy[typeKey][desKey][office] = {};
      if (!hierarchy[typeKey][desKey][office][name]) hierarchy[typeKey][desKey][office][name] = {};

      if (!hierarchy[typeKey][desKey][office][name][expense_items]) {
          hierarchy[typeKey][desKey][office][name][expense_items] = [];
      }

      const label = (expense_items_sub && expense_items_sub.trim() !== "")
          ? expense_items_sub
          : expense_items;

      hierarchy[typeKey][desKey][office][name][expense_items].push({
          id: row.id,
          label: label
      });
    });

    // PS Hierarchy remains distinct
    const psRows = await pool.query("SELECT DISTINCT pap_type, pap_des FROM ps WHERE is_deleted = 0");
    const psHierarchy = {};
    psRows[0].forEach(r => {
        const type = r.pap_type;
        if (!psHierarchy[type]) psHierarchy[type] = [];
        psHierarchy[type].push(r.pap_des);
    });

    return {
      mooe: hierarchy,
      ps: psHierarchy
    };
  }
}

module.exports = FilterEngine;
