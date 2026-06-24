const { pool } = require("../config/database");
const DataNormalizationEngine = require("./DataNormalizationEngine");

class FilterEngine {
  static async getDistinctValues(viewName, field, filters = {}) {
    const allowedViews = [
        "vw_mooe_excel_full_report",
        "vw_obligation_details",
        "vw_pap_financial_summary",
        "vw_pr_details",
        "vw_pr_items_full",
        "vw_program_financial_summary",
        "vw_ps_details"
    ];

    if (!allowedViews.includes(viewName)) {
      throw new Error(`Invalid view: ${viewName}. Data fetching must strictly use approved views.`);
    }

    const fieldMap = {
        'name': 'activity',
        'expense_items': 'object_group',
        'expense_items_sub': 'sub_object'
    };

    const targetField = fieldMap[field] || field;

    // Standardize result selection
    let selectClause = `DISTINCT ${targetField}`;
    if (viewName === "vw_mooe_excel_full_report") {
        if (targetField === 'pap_type') selectClause = `DISTINCT CONCAT(pap_type_code, '|', pap_type) as result`;
        else if (targetField === 'pap_des') selectClause = `DISTINCT CONCAT(pap_des_code, '|', pap_des) as result`;
        else selectClause = `DISTINCT ${targetField} as result`;
    } else {
        selectClause = `DISTINCT ${targetField} as result`;
    }

    let query = `SELECT ${selectClause} FROM ${viewName} WHERE 1=1`;

    const values = [];

    if (viewName === "vw_mooe_excel_full_report") {
        query += " AND row_type = 'DETAIL'";
    }

    Object.keys(filters).forEach(key => {
        let targetKey = fieldMap[key] || key;
        let filterValue = filters[key];

        if (viewName === "vw_mooe_excel_full_report") {
            if (key === 'pap_type') targetKey = 'pap_type_code';
            if (key === 'pap_des') targetKey = 'pap_des_code';

            if (String(filterValue).includes('|')) {
                filterValue = filterValue.split('|')[0];
            }
        }

        if (filterValue) {
            query += ` AND ${targetKey} = ?`;
            values.push(filterValue);
        }
    });

    if (viewName === "vw_mooe_excel_full_report") {
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
        AND object_group IS NOT NULL
        AND object_group != ''
        AND object_group != '-'
    `;
    const mooeValues = [];

    if (plan_id) {
        if (/^20\d{2}$/.test(String(plan_id))) {
             mooeQuery += " AND plan_id LIKE ?";
             mooeValues.push(`%${plan_id}%`);
        } else {
             mooeQuery += " AND plan_id = ?";
             mooeValues.push(plan_id);
        }
    }

    mooeQuery += " ORDER BY report_order ASC";

    const [mooeRows] = await pool.execute(mooeQuery, mooeValues);

    const hierarchy = {};

    mooeRows.forEach(row => {
      const papTypeCode = row.pap_type_code || '00000';
      const papType = row.pap_type || 'Uncategorized';
      const typeKey = `${papTypeCode}|${papType}`;

      const papDesCode = row.pap_des_code || '00000';
      const papDes = row.pap_des || 'Unnamed PAP';
      const desKey = `${papDesCode}|${papDes}`;

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

    // PS Hierarchy
    let psSql = "SELECT DISTINCT pap_type, pap_des FROM vw_ps_details";
    const psValues = [];
    if (plan_id) {
        if (/^20\d{2}$/.test(String(plan_id))) {
            psSql += " WHERE plan_id LIKE ?";
            psValues.push(`%${plan_id}%`);
        } else {
            psSql += " WHERE plan_id = ?";
            psValues.push(plan_id);
        }
    }

    const [psRows] = await pool.execute(psSql, psValues);
    const psHierarchy = {};
    psRows.forEach(r => {
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
