const { pool } = require("../config/database");

class MOOERepository {
  static async create(mooeData, connection = pool) {
    console.log("DEBUG: IMPORT REPOSITORY HIT - Saving Record:", mooeData.name);
    const query = `INSERT INTO mooe (
      plan_id, pap_type, pap_type_code, pap_des, pap_des_code, office,
      ref_main_name, ref_middle_name, ref_center_name, ref_last_name,
      count_type, name, performance_indicator, pt1, pt2, pt3, pt4, totalPt,
      expense_items, expense_items_sub, fq1, fq2, fq3, fq4, totalFq,
      total_amount, sub_total_name, is_subtotal, report_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await connection.execute(query, [
      mooeData.plan_id,
      mooeData.pap_type || "",
      mooeData.pap_type_code || "",
      mooeData.pap_des || "",
      mooeData.pap_des_code || "",
      mooeData.office || "",
      mooeData.ref_main_name || "",
      mooeData.ref_middle_name || "",
      mooeData.ref_center_name || "",
      mooeData.ref_last_name || "",
      mooeData.count_type || 0,
      mooeData.name || "",
      mooeData.performance_indicator || "",
      mooeData.pt1 || 0,
      mooeData.pt2 || 0,
      mooeData.pt3 || 0,
      mooeData.pt4 || 0,
      mooeData.totalPt || 0,
      mooeData.expense_items || "",
      mooeData.expense_items_sub || "",
      mooeData.fq1 || 0,
      mooeData.fq2 || 0,
      mooeData.fq3 || 0,
      mooeData.fq4 || 0,
      mooeData.totalFq || 0,
      mooeData.total_amount || 0,
      mooeData.sub_total_name || "",
      mooeData.is_subtotal || 0,
      mooeData.report_order || 0
    ]);
    return result;
  }

  static async getByPlan(plan_id, filters = {}) {
    let query = "SELECT id, pap_type, pap_des, office, activity as name, object_group as expense_items, sub_object as expense_items_sub, total_amount as totalFq FROM vw_mooe_excel_full_report WHERE 1=1";
    const values = [];

    if (plan_id) {
        query += " AND plan_id = ?";
        values.push(plan_id);
    }

    const filterMap = {
        "id": "id",
        "pap_type": "pap_type",
        "pap_type_code": "pap_type_code",
        "pap_des": "pap_des",
        "pap_des_code": "pap_des_code",
        "office": "office",
        "name": "activity",
        "expense_items": "object_group",
        "expense_items_sub": "sub_object"
    };

    Object.keys(filters).forEach(field => {
        const targetField = filterMap[field];
        if (targetField && filters[field]) {
            query += ` AND ${targetField} = ?`;
            values.push(filters[field]);
        }
    });

    query += " AND row_type = 'DETAIL' AND total_amount > 0";
    query += " ORDER BY report_order";
    const [rows] = await pool.execute(query, values);
    return rows;
  }

  static async getById(id, connection = pool) {
    const [rows] = await connection.execute("SELECT * FROM mooe WHERE id = ? AND is_deleted = 0", [id]);
    return rows[0];
  }

  static async update(id, data, connection = pool) {
    const allowedFields = [
      "plan_id", "pap_type", "pap_type_code", "pap_des", "pap_des_code", "office",
      "ref_main_name", "ref_middle_name", "ref_center_name", "ref_last_name",
      "count_type", "name", "performance_indicator", "pt1", "pt2", "pt3", "pt4", "totalPt",
      "expense_items", "expense_items_sub", "fq1", "fq2", "fq3", "fq4", "totalFq",
      "total_amount", "sub_total_name", "is_subtotal", "report_order"
    ];

    const setClauses = [];
    const values = [];

    allowedFields.forEach((field) => {
      if (field in data) {
        setClauses.push(`${field} = ?`);
        values.push(data[field]);
      }
    });

    if (setClauses.length === 0) return null;

    const query = `UPDATE mooe SET ${setClauses.join(", ")} WHERE id = ?`;
    values.push(id);

    const [result] = await connection.execute(query, values);
    return result;
  }

  static async delete(id, connection = pool) {
    const [result] = await connection.execute("UPDATE mooe SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
    return result;
  }

  static async deleteByPlan(plan_id) {
    const [result] = await pool.execute("DELETE FROM mooe WHERE plan_id = ?", [plan_id]);
    return result;
  }
}

module.exports = MOOERepository;
