const DashboardService = require("../services/DashboardService");
const AuditEngine = require("../engines/AuditEngine");
const { pool } = require("../config/database");

class DashboardController {
  static async getExecutiveSummary(req, res) {
    try {
      const { plan_id } = req.query;
      const data = await DashboardService.getExecutiveSummary(plan_id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getAuditFeed(req, res) {
    try {
      const [rows] = await pool.execute(`
        SELECT * FROM audit_logs
        ORDER BY timestamp DESC
        LIMIT 50
      `);
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = DashboardController;
