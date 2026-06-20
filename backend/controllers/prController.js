const PRService = require("../services/prService");
const SequenceEngine = require("../engines/SequenceEngine");
const { handleError } = require("../utils/errorHandler");

class PrController {
  static async create(req, res) {
    try {
      const result = await PRService.createPR(req.body);
      res.status(201).json({
        success: true,
        message: "PR record created successfully",
        data: { id: result.insertId, ...req.body }
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getAll(req, res) {
    try {
      const data = await PRService.getAllPRs();
      res.json({ success: true, data });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getByMOOEId(req, res) {
    try {
      const data = await PRService.getPRsByMOOE(req.params.id || req.query.id);
      res.json({ success: true, data });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const result = await PRService.updatePR(id, req.body);
      res.json({ success: true, message: "PR record updated successfully", data: { id, ...req.body } });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      await PRService.deletePR(id);
      res.json({ success: true, message: "PR record deleted successfully" });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getNextNo(req, res) {
    try {
      const { year, month } = req.query;
      const nextPrNo = await SequenceEngine.getNextPRNo(year, month);
      res.json({ success: true, nextPrNo, year, month });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getWithBalance(req, res) {
    try {
      const data = await PRService.getPRWithBalance();
      res.json({ success: true, data });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getByRecordsId(req, res) {
    try {
      const { id } = req.params;
      const data = await PRService.getPRById(id);
      res.json({ success: true, data });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async submit(req, res) {
    try {
      const { id } = req.params;
      const result = await PRService.submitPR(id, req.headers['x-user-id']);
      res.json(result);
    } catch (error) {
      handleError(error, res);
    }
  }

  static async approve(req, res) {
    try {
      const { id } = req.params;
      const result = await PRService.approvePR(id, req.headers['x-user-id']);
      res.json(result);
    } catch (error) {
      handleError(error, res);
    }
  }

  static async reject(req, res) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      const result = await PRService.rejectPR(id, remarks, req.headers['x-user-id']);
      res.json(result);
    } catch (error) {
      handleError(error, res);
    }
  }
}

module.exports = PrController;
