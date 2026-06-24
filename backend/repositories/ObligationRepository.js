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
