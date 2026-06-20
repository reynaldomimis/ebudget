const ObligationService = require("../services/obligationService");
const SequenceEngine = require("../engines/SequenceEngine");
const PRBalanceResolver = require("../engines/PRBalanceResolver");
const { handleError } = require("../utils/errorHandler");

class ObligationController {
  static async create(req, res) {
    try {
      const result = await ObligationService.createObligation(req.body);

      let prStatus = null;
      if (req.body.prno) {
          prStatus = await PRBalanceResolver.resolvePRStatus(req.body.prno);
      }

      res.status(201).json({
        success: true,
        message: "Obligation record created successfully",
        data: { id: result.insertId, ...req.body },
        prStatus
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getAll(req, res) {
    try {
      const data = await ObligationService.getAllObligations();
      res.json({ success: true, data });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getByActivitiesId(req, res) {
    try {
      const { id } = req.query;
      const data = await ObligationService.getObligationsByActivity(id);
      res.json({ success: true, data });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const result = await ObligationService.updateObligation(id, req.body);
      res.json({ success: true, message: "Obligation record updated successfully", data: { id, ...req.body } });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      await ObligationService.deleteObligation(id);
      res.json({ success: true, message: "Obligation record deleted successfully" });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getNextNo(req, res) {
    try {
      const { year, month } = req.query;
      const nextObrNo = await SequenceEngine.getNextOBRNo(year, month);
      res.json({ success: true, nextObrNo, year, month });
    } catch (error) {
      handleError(error, res);
    }
  }
}

module.exports = ObligationController;
