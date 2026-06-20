const { pool } = require("../config/database");

class PSRepository {
  static async create(psData, connection = pool) {
    const query = `INSERT INTO ps (
      plan_id, plan_year, pap_type, pap_des, pap_des_code, aggregation_level, cost_category,
      is_subtotal, subtotal_label, expense_items, amount, total, report_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await connection.execute(query, [
      psData.plan_id,
      psData.plan_year,
      psData.pap_type || "",
      psData.pap_des || "",
      psData.pap_des_code || "",
      psData.aggregation_level || "ITEM",
      psData.cost_category || "PS",
      psData.is_subtotal || 0,
      psData.subtotal_label || "",
      psData.expense_items || "",
      psData.amount || 0,
      psData.total || 0,
      psData.report_order || 0
    ]);
    return result;
  }

  static async getAll(filters = {}) {
    let query = "SELECT * FROM ps WHERE is_deleted = 0";
    const values = [];

    if (filters.plan_id) {
        query += " AND plan_id = ?";
        values.push(filters.plan_id);
    }

    if (filters.pap_type) {
        query += " AND pap_type = ?";
        values.push(filters.pap_type);
    }

    if (filters.pap_des) {
        query += " AND pap_des = ?";
        values.push(filters.pap_des);
    }

    query += " ORDER BY id ASC";
    const [rows] = await pool.execute(query, values);
    return rows;
  }

  static async getById(id, connection = pool) {
    const [rows] = await connection.execute("SELECT * FROM ps WHERE id = ? AND is_deleted = 0", [id]);
    return rows[0];
  }

  static async update(id, data, connection = pool) {
    const allowedFields = [
      "plan_id", "plan_year", "pap_type", "pap_des", "pap_des_code", "aggregation_level", "cost_category",
      "is_subtotal", "subtotal_label", "expense_items", "amount", "total", "report_order"
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

    const query = `UPDATE ps SET ${setClauses.join(", ")} WHERE id = ?`;
    values.push(id);

    const [result] = await connection.execute(query, values);
    return result;
  }

  static async delete(id, connection = pool) {
    const [result] = await connection.execute("UPDATE ps SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
    return result;
  }
}

module.exports = PSRepository;
