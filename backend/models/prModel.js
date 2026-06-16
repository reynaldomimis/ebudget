const { pool } = require("../config/database");

class PrModel {
  static async create(prData) {
    const query = `INSERT INTO pr_so (activities_id, prno, transaction_date, amount) VALUES (?, ?, ?, ?)`;
    const [result] = await pool.execute(query, [
      prData.activities_id,
      prData.prno,
      prData.transaction_date,
      prData.amount,
    ]);
    return result;
  }

  static async getAll() {
    const query = "SELECT * FROM pr_so ORDER BY transaction_date DESC, created_at DESC";
    const [rows] = await pool.execute(query);
    return rows;
  }

  static async getByActivitiesId(activitiesId) {
    const query = `
      SELECT
        p.id, p.activities_id, p.prno, p.transaction_date, p.amount,
        a.name, a.expense_items, a.expense_items_sub, a.pap_type, a.pap_des, a.division
      FROM pr_so p
      JOIN activities a ON p.activities_id = a.id
      WHERE p.activities_id = ?
    `;
    const [rows] = await pool.execute(query, [activitiesId]);
    return rows;
  }

  static async getNextNo(year, month) {
    const query = `SELECT MAX(prno) as latest_prno FROM pr_so`;
    const [rows] = await pool.execute(query);
    const latestPrNo = rows[0]?.latest_prno;

    let nextSeq = 1;
    if (latestPrNo) {
      const match = latestPrNo.match(/-(\d{3})$/);
      if (match) {
        nextSeq = parseInt(match[1], 10) + 1;
      }
    }

    const paddedSeq = String(nextSeq).padStart(3, "0");
    return `PR-${year}-${month}-${paddedSeq}`;
  }

  static async update(id, prData) {
    const query = `
      UPDATE pr_so
      SET activities_id = ?, prno = ?, transaction_date = ?, amount = ?,
          amount_obligated = ?, amount_unobligated = ?
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [
      prData.activities_id,
      prData.prno,
      prData.transaction_date,
      prData.amount || 0,
      prData.amount_obligated || 0,
      prData.amount_unobligated || 0,
      id,
    ]);
    return result;
  }

  static async delete(id) {
    const query = "DELETE FROM pr_so WHERE id = ?";
    const [result] = await pool.execute(query, [id]);
    return result;
  }

  static async updateUnobligatedAmount(prno, obligated, unobligated) {
    const query = `UPDATE pr_so SET amount_obligated = ?, amount_unobligated = ?, is_obligated = ? WHERE prno = ?`;
    const [result] = await pool.execute(query, [obligated, unobligated, true, prno]);
    return result;
  }

  static async getWithBalance() {
    const query = `
      SELECT
        p.id, p.activities_id, p.prno, p.transaction_date, p.amount,
        COALESCE(SUM(o.amount), 0) AS amount_obligated,
        (p.amount - COALESCE(SUM(o.amount), 0)) AS balance,
        a.name, a.expense_items, a.expense_items_sub, a.pap_type, a.pap_des, a.division
      FROM pr_so p
      JOIN activities a ON p.activities_id = a.id
      LEFT JOIN obligation o ON o.prno = p.prno
      GROUP BY p.id, p.activities_id, p.prno, p.transaction_date, p.amount,
               a.name, a.expense_items, a.expense_items_sub, a.pap_type, a.pap_des, a.division
    `;
    const [rows] = await pool.execute(query);
    return rows;
  }

  static async getByRecordsId(activitiesId) {
    const query = `
      SELECT
        p.activities_id AS ACTIVITIES_ID,
        a.total_amount AS ALLOCATION,
        p.prno AS PRNO,
        GROUP_CONCAT(o.obrno SEPARATOR ', ') AS OBRNO,
        MAX(p.transaction_date) AS DATE,
        p.amount AS AMOUNT_PR,
        SUM(IFNULL(o.amount, 0)) AS OBLIGATED,
        (a.total_amount - (SELECT SUM(amount) FROM pr_so WHERE activities_id = a.id)) AS UNOBLIGATED_ALLOCATION,
        (p.amount - SUM(IFNULL(o.amount, 0))) AS BALANCE_PR
      FROM activities a
      LEFT JOIN pr_so p ON a.id = p.activities_id
      LEFT JOIN obligation o ON p.prno = o.prno
      WHERE a.id = ?
      GROUP BY p.activities_id, a.id, p.prno, p.amount;
    `;
    const [rows] = await pool.execute(query, [activitiesId]);
    return rows;
  }
}

module.exports = PrModel;
