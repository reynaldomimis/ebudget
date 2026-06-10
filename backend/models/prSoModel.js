const { pool } = require("../config/database");

class PrSoModel {
  // Create new PR/SO record
  static async create(prSoData) {
    try {
      const query = `
        INSERT INTO pr_so (activities_id, prno, transaction_date, amount)
        VALUES (?, ?, ?, ?)
      `;
      const [result] = await pool.execute(query, [
        prSoData.activities_id,
        prSoData.prno,
        prSoData.transaction_date,
        prSoData.amount,
      ]);
      return result;
    } catch (error) {
      throw new Error(`Error creating PR/SO record: ${error.message}`);
    }
  }

  // Get all PR/SO records
  static async getAll() {
    try {
      const query =
        "SELECT * FROM pr_so ORDER BY transaction_date DESC, created_at DESC";
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching PR/SO records: ${error.message}`);
    }
  }

  // Get all PR/SO records with joined activities
  static async getByActivitiesId() {
    try {
      const query = `
        SELECT pr_so.*, activities.*
          FROM pr_so
          JOIN activities ON pr_so.activities_id = activities.id
      `;
      const [rows] = await pool.execute(query); // no parameters
      return rows;
    } catch (error) {
      throw new Error(`Error fetching PR/SO records: ${error.message}`);
    }
  }

  // Update PR/SO record
  static async update(id, prSoData) {
    try {
      const query = `
        UPDATE pr_so 
          SET activities_id = ?, prno = ?, transaction_date = ?, amount = ?, 
            amount_obligated = ?, amount_unobligated = ?
          WHERE prno = ?
      `;
      const [result] = await pool.execute(query, [
        prSoData.activities_id,
        prSoData.prno,
        prSoData.transaction_date,
        prSoData.amount || 0,
        prSoData.amount_obligated || 0,
        prSoData.amount_unobligated || 0,
        id,
      ]);
      return result;
    } catch (error) {
      throw new Error(`Error updating PR/SO record: ${error.message}`);
    }
  }

  // Delete PR/SO record
  static async delete(id) {
    try {
      const query = "DELETE FROM pr_so WHERE id = ?";
      const [result] = await pool.execute(query, [id]);
      return result;
    } catch (error) {
      throw new Error(`Error deleting PR/SO record: ${error.message}`);
    }
  }

  // Update unobligated amount by PR number
  static async updateUnobligatedAmount(prno, obligated, unobligated) {
    try {
      const query = `
        UPDATE pr_so 
          SET amount_obligated = ?, amount_unobligated = ?, is_obligated = ?
          WHERE prno = ?
      `;
      const [result] = await pool.execute(query, [
        obligated,
        unobligated,
        true,
        prno,
      ]);
      return result;
    } catch (error) {
      throw new Error(
        `Error updating obligatedunobligated amount: ${error.message}`,
      );
    }
  }

  // Get next PRNO number - Year & Month from Frontend
  static async getNextNo(req, res) {
    try {
      const { year, month } = req.query;

      // Basic validation
      if (!year || !month) {
        return res.status(400).json({
          success: false,
          error: "Year and month are required (e.g. ?year=26&month=03)",
        });
      }

      // Pure MAX lang - walang WHERE clause
      const query = `
      SELECT MAX(prno) as latest_prno
      FROM pr_so
    `;

      const [rows] = await pool.execute(query);
      const latestPrNo = rows[0]?.latest_prno;

      let nextSeq = 1;

      // Kunin ang last 3 digits at i-increment kung may record
      if (latestPrNo) {
        const match = latestPrNo.match(/-(\d{3})$/);

        if (match) {
          nextSeq = parseInt(match[1], 10) + 1;
        }
      }

      const paddedSeq = String(nextSeq).padStart(3, "0");
      const nextPrNo = `PR-${year}-${month}-${paddedSeq}`;

      return {
        success: true,
        nextPrNo,
        year,
        month,
        sequence: paddedSeq,
      };
    } catch (error) {
      console.error("getNextNo Error:", error);
      throw new Error(`Failed to generate next PRNO number: ${error.message}`);
    }
  }

  static async getWithBalance() {
    const query = `
    SELECT 
      p.id,
      p.activities_id,
      p.prno,
      p.transaction_date,
      p.amount,
      COALESCE(SUM(o.amount), 0) AS amount_obligated,
      (p.amount - COALESCE(SUM(o.amount), 0)) AS balance
    FROM pr_so p
    LEFT JOIN obligation o 
      ON o.prno = p.prno
    GROUP BY p.id, p.activities_id, p.prno, p.transaction_date, p.amount
  `;

    const [rows] = await pool.execute(query);
    return rows;
  }

  // Get all PR/SO records with joined activities
  static async getByRecordsId(activitiesId) {
    try {
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
    } catch (error) {
      throw new Error(`Error fetching PR/SO records: ${error.message}`);
    }
  }
}

module.exports = PrSoModel;
