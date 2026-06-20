const { pool } = require("../config/database");

class FiscalYearRepository {
  static async getAll() {
    const [rows] = await pool.execute("SELECT * FROM plan_info ORDER BY year DESC, created_at DESC");
    return rows;
  }

  static async getById(plan_id) {
    const [rows] = await pool.execute("SELECT * FROM plan_info WHERE plan_id = ?", [plan_id]);
    return rows[0];
  }

  static async getByYear(year) {
    const [rows] = await pool.execute("SELECT * FROM plan_info WHERE year = ?", [year]);
    return rows;
  }

  static async create(planData, connection = pool) {
    // Check if plan_id exists to avoid duplicates
    const existing = await this.getById(planData.plan_id);
    if (existing) return existing;

    const query = `INSERT INTO plan_info (plan_id, year, title, range_label) VALUES (?, ?, ?, ?)`;
    const [result] = await connection.execute(query, [
      planData.plan_id,
      planData.year,
      planData.title,
      planData.range_label,
    ]);
    return result;
  }
}

module.exports = FiscalYearRepository;
