const { pool } = require("../config/database");

class PRRepository {
  static async create(prData, connection = pool) {
    const query = `INSERT INTO pr_so (mooe_id, prno, amount, purpose, workflow_status) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await connection.execute(query, [
      prData.mooe_id,
      prData.prno,
      prData.amount,
      prData.purpose,
      prData.workflow_status || 'Draft'
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

  static async update(id, prData, connection = pool) {
    const query = `
      UPDATE pr_so
      SET mooe_id = ?, prno = ?, amount = ?, purpose = ?, workflow_status = ?
      WHERE id = ?
    `;
    const [result] = await connection.execute(query, [
      prData.mooe_id,
      prData.prno,
      prData.amount || 0,
      prData.purpose,
      prData.workflow_status || 'Draft',
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

  static async delete(id, connection = pool) {
    const query = "UPDATE pr_so SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?";
    const [result] = await connection.execute(query, [id]);
    return result;
  }
}

module.exports = PRRepository;
