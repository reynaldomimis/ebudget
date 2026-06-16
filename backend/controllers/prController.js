const PrModel = require("../models/prModel");

class PrController {
  static async create(req, res) {
    try {
      const result = await PrModel.create(req.body);
      res.status(201).json({
        message: "PR record created successfully",
        data: { id: result.insertId, ...req.body }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const data = await PrModel.getAll();
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getByActivitiesId(req, res) {
    try {
      const data = await PrModel.getByActivitiesId(req.params.id || req.query.id);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const result = await PrModel.update(id, req.body);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "PR record not found" });
      }
      res.json({ message: "PR record updated successfully", data: { id, ...req.body } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await PrModel.delete(id);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "PR record not found" });
      }
      res.json({ message: "PR record deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getNextNo(req, res) {
    try {
      const { year, month } = req.query;
      if (!year || !month) {
        return res.status(400).json({ error: "Year and month are required" });
      }
      const nextPrNo = await PrModel.getNextNo(year, month);
      res.json({ success: true, nextPrNo, year, month });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateUnobligatedAmount(req, res) {
    try {
      const { prno } = req.params;
      const { obligated, unobligated } = req.body;
      await PrModel.updateUnobligatedAmount(prno, obligated, unobligated);
      res.json({ message: "Unobligated amount updated successfully", prno, obligated, unobligated });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getWithBalance(req, res) {
    try {
      const data = await PrModel.getWithBalance();
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getByRecordsId(req, res) {
    try {
      const { id } = req.params;
      const data = await PrModel.getByRecordsId(id);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = PrController;
