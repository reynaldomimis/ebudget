const { pool } = require("../config/database");

class PRRepository {
  static async create(prData, connection = pool) {
    const query = `INSERT INTO pr_so (mooe_id, prno, transaction_date, amount, purpose) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await connection.execute(query, [
      prData.mooe_id,
      prData.prno,
      prData.transaction_date,
      prData.amount,
      prData.purpose
    ]);
    return result;
  }

  static async createItems(prId, items, connection = pool) {
    if (!items || items.length === 0) return;
    const query = `INSERT INTO pr_items (pr_id, description, quantity, unit, unit_cost, total) VALUES (?, ?, ?, ?, ?, ?)`;
    for (const item of items) {
      await connection.execute(query, [
        prId,
        item.description,
        item.quantity,
        item.unit,
        item.unit_cost,
        item.total
      ]);
    }
  }

  static async getAll() {
    const query = "SELECT * FROM vw_pr_balances ORDER BY transaction_date DESC";
    const [rows] = await pool.execute(query);
    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.execute("SELECT * FROM vw_pr_balances WHERE id = ?", [id]);
    return rows[0];
  }

  static async getByPRNo(prno, connection = pool) {
    const [rows] = await connection.execute("SELECT * FROM vw_pr_balances WHERE prno = ?", [prno]);
    return rows[0];
  }

  static async getByMOOEId(mooeId) {
    let query = `SELECT * FROM vw_pr_balances`;
    const values = [];
    if (mooeId) {
        query += " WHERE mooe_id = ?";
        values.push(mooeId);
    }
    query += " ORDER BY transaction_date DESC";
    const [rows] = await pool.execute(query, values);
    return rows;
  }

  static async update(id, prData, connection = pool) {
    const query = `
      UPDATE pr_so
      SET mooe_id = ?, prno = ?, transaction_date = ?, amount = ?, purpose = ?
      WHERE id = ?
    `;
    const [result] = await connection.execute(query, [
      prData.mooe_id,
      prData.prno,
      prData.transaction_date,
      prData.amount || 0,
      prData.purpose,
      id,
    ]);
    return result;
  }

  static async updateStatus(id, status, remarks = null, connection = pool) {
    const query = remarks
      ? `UPDATE pr_so SET workflow_status = ?, remarks = ? WHERE id = ?`
      : `UPDATE pr_so SET workflow_status = ? WHERE id = ?`;
    const params = remarks ? [status, remarks, id] : [status, id];
    const [result] = await connection.execute(query, params);
    return result;
  }

  static async updateStatusByPRNo(prno, status, connection = pool) {
    const query = `UPDATE pr_so SET workflow_status = ? WHERE prno = ?`;
    const [result] = await connection.execute(query, [status, prno]);
    return result;
  }

  static async deleteItems(prId, connection = pool) {
    await connection.execute("DELETE FROM pr_items WHERE pr_id = ?", [prId]);
  }

  static async getItems(prId) {
    const [rows] = await pool.execute("SELECT * FROM pr_items WHERE pr_id = ?", [prId]);
    return rows;
  }

  static async delete(id, connection = pool) {
    const query = "UPDATE pr_so SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?";
    const [result] = await connection.execute(query, [id]);
    return result;
  }

  static async getWithBalances() {
    const [rows] = await pool.execute("SELECT * FROM vw_pr_balances");
    return rows;
  }
}

module.exports = PRRepository;
