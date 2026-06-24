const { pool } = require("../config/database");

class PSRepository {
  static async create(psData, connection = pool) {
    const query = `INSERT INTO ps (
      plan_id, activities_id, pap_type, pap_type_code,
      pap_des, pap_des_code, expense_items, amount, total, report_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await connection.execute(query, [
      psData.plan_id || null,
      psData.activities_id || null,
      psData.pap_type || "",
      psData.pap_type_code || "",
      psData.pap_des || "",
      psData.pap_des_code || "",
      psData.expense_items || "",
      psData.amount || 0,
      psData.total || 0,
      psData.report_order || 0
    ]);
    return result;
  }

  static async createRLIP(rlipData, connection = pool) {
    const query = `INSERT INTO rlip (
      ps_id, pap_des_code, pap_des, amount
    ) VALUES (?, ?, ?, ?)`;

    const [result] = await connection.execute(query, [
      rlipData.ps_id,
      rlipData.pap_des_code || "",
      rlipData.pap_des || "",
      rlipData.amount || 0
    ]);
    return result;
  }

  static async update(id, data, connection = pool) {
    const allowedFields = [
      "plan_id", "activities_id", "pap_type", "pap_des", "pap_des_code",
      "expense_items", "amount", "total", "report_order"
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

  static async deleteRLIP(id, userId, connection = pool) {
    const [result] = await connection.execute(
      "UPDATE rlip SET is_deleted = 1, deleted_by = ?, delete_at = CURRENT_TIMESTAMP WHERE id = ?",
      [userId, id]
    );
    return result;
  }
}

module.exports = PSRepository;
