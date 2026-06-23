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
      const { plan_id } = req.query;
      const data = await DashboardService.getAuditFeed(plan_id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getRecentTransactions(req, res) {
    try {
      const { plan_id } = req.query;
      const data = await DashboardService.getRecentTransactions(plan_id, 15);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = DashboardController;
