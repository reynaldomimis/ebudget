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

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const { pool } = require("../config/database");

      const [header] = await pool.execute("SELECT * FROM vw_pr_details WHERE id = ?", [id]);
      if (header.length === 0) return res.status(404).json({ success: false, message: "PR not found" });

      const [items] = await pool.execute("SELECT * FROM pr_items WHERE pr_id = ?", [id]);

      res.json({
        success: true,
        data: { ...header[0], items }
      });
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
