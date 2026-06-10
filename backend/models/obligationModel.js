const { pool } = require("../config/database");

class ObligationModel {
  // Create new obligation record
  static async create(obligationData) {
    try {
      const query = `
        INSERT INTO obligation (activities_id, prno, obrno, transaction_date, particular, amount, amount_unobligated)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await pool.execute(query, [
        obligationData.activities_id,
        obligationData.prno,
        obligationData.obrno,
        obligationData.transaction_date,
        obligationData.particular,
        obligationData.amount || 0,
        obligationData.amount_unobligated || 0,
      ]);
      return result;
    } catch (error) {
      throw new Error(`Error creating obligation record: ${error.message}`);
    }
  }

  // Get all obligation records
  static async getAll() {
    try {
      const query =
        "SELECT * FROM obligation ORDER BY transaction_date DESC, created_at DESC";
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching obligation records: ${error.message}`);
    }
  }

  // Get obligation records by activities_id
  static async getByActivitiesId() {
    try {
      const query = `
      SELECT obligation.*, activities.*
      FROM obligation
      JOIN activities ON obligation.activities_id = activities.id
    `;
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching obligation records: ${error.message}`);
    }
  }

  // Update obligation record
  static async update(id, obligationData) {
    try {
      const query = `
        UPDATE obligation 
        SET activities_id = ?, obrno = ?, transaction_date = ?, particular = ?, 
            amount = ?, amount_unobligated = ?
        WHERE obrno = ?
      `;
      const [result] = await pool.execute(query, [
        obligationData.activities_id,
        obligationData.obrno,
        obligationData.transaction_date,
        obligationData.particular,
        obligationData.amount || 0,
        obligationData.amount_unobligated || 0,
        id,
      ]);
      return result;
    } catch (error) {
      throw new Error(`Error updating obligation record: ${error.message}`);
    }
  }

  // Delete obligation record
  static async delete(id) {
    try {
      const query = "DELETE FROM obligation WHERE id = ?";
      const [result] = await pool.execute(query, [id]);
      return result;
    } catch (error) {
      throw new Error(`Error deleting obligation record: ${error.message}`);
    }
  }

  // Get next OBR number - Year & Month from Frontend
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
      SELECT MAX(obrno) as latest_obrno 
      FROM obligation
    `;

      const [rows] = await pool.execute(query);
      const latestObrNo = rows[0]?.latest_obrno;

      let nextSeq = 1;

      // Kunin ang last 3 digits at i-increment kung may record
      if (latestObrNo) {
        const match = latestObrNo.match(/-(\d{3})$/);

        if (match) {
          nextSeq = parseInt(match[1], 10) + 1;
        }
      }

      const paddedSeq = String(nextSeq).padStart(3, "0");
      const nextObrNo = `OBR-${year}-${month}-${paddedSeq}`;

      return {
        success: true,
        nextObrNo,
        year,
        month,
        sequence: paddedSeq,
      };
    } catch (error) {
      console.error("getNextNo Error:", error);
      throw new Error(`Failed to generate next OBR number: ${error.message}`);
    }
  }
}

module.exports = ObligationModel;
