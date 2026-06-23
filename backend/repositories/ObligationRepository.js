const { pool } = require("../config/database");

class ObligationRepository {
  static async create(obligationData, connection = pool) {
    const query = `
      INSERT INTO obligation (mooe_id, ps_id, pr_id, prno, obrno, transaction_date, particular, payee, amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await connection.execute(query, [
      obligationData.mooe_id || null,
      obligationData.ps_id || null,
      obligationData.pr_id || null,
      obligationData.prno || null,
      obligationData.obrno,
      obligationData.transaction_date,
      obligationData.particular,
      obligationData.payee || null,
      obligationData.amount || 0,
    ]);
    return result;
  }

  static async getAll() {
    const query = `
      SELECT o.*, a.name, a.expense_items, a.expense_items_sub, a.office, a.pap_type, a.pap_des,
             vb.pr_amount, vb.obligated_amount as total_obligated, vb.remaining_balance, vb.budget_status as pr_status
      FROM obligation o
      LEFT JOIN mooe a ON o.mooe_id = a.id
      LEFT JOIN vw_pr_details vb ON o.pr_id = vb.id
      WHERE o.is_deleted = 0
      ORDER BY o.transaction_date DESC, o.created_at DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  }

  static async getByPRNo(prno) {
    const query = "SELECT * FROM obligation WHERE prno = ? AND is_deleted = 0";
    const [rows] = await pool.execute(query, [prno]);
    return rows;
  }

  static async getByMOOEId(mooeId, connection = pool) {
    let query = `
      SELECT o.*, a.name, a.expense_items, a.expense_items_sub, a.office, a.pap_type, a.pap_des
      FROM obligation o
      LEFT JOIN mooe a ON o.mooe_id = a.id
      WHERE o.is_deleted = 0
    `;
    const values = [];
    if (mooeId) {
        query += " AND o.mooe_id = ?";
        values.push(mooeId);
    }
    query += " ORDER BY o.transaction_date DESC";
    const [rows] = await connection.execute(query, values);
    return rows;
  }

  static async getByPSId(psId, connection = pool) {
    const query = "SELECT * FROM obligation WHERE ps_id = ? AND is_deleted = 0";
    const [rows] = await connection.execute(query, [psId]);
    return rows;
  }

  static async update(id, obligationData, connection = pool) {
    const query = `
      UPDATE obligation
      SET mooe_id = ?, ps_id = ?, pr_id = ?, prno = ?, obrno = ?, transaction_date = ?, particular = ?,
          payee = ?, amount = ?
      WHERE id = ?
    `;
    const [result] = await connection.execute(query, [
      obligationData.mooe_id || null,
      obligationData.ps_id || null,
      obligationData.pr_id || null,
      obligationData.prno || null,
      obligationData.obrno,
      obligationData.transaction_date,
      obligationData.particular,
      obligationData.payee || null,
      obligationData.amount || 0,
      id,
    ]);
    return result;
  }

  static async delete(id, connection = pool) {
    const query = "UPDATE obligation SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?";
    const [result] = await connection.execute(query, [id]);
    return result;
  }
}

module.exports = ObligationRepository;
