const ReportEngine = require("../engines/ReportEngine");

class ReportController {
  static async getStandardReport(req, res) {
    try {
      const { plan_id } = req.query;
      const data = await ReportEngine.getStandardReport(plan_id);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ReportController;
