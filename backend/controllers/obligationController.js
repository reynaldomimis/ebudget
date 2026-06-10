const ObligationModel = require("../models/obligationModel");

class ObligationController {
  // Create new obligation record
  static async create(req, res) {
    try {
      const obligationData = req.body;

      // Validate required fields
      if (!obligationData.activities_id || !obligationData.obrno) {
        return res.status(400).json({
          error: "Missing required fields: activities_id, obrno",
        });
      }

      const result = await ObligationModel.create(obligationData);
      res.status(201).json({
        message: "Obligation record created successfully",
        data: { id: result.insertId, ...obligationData },
      });
    } catch (error) {
      console.error("Error in ObligationController.create:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all obligation records
  static async getAll(req, res) {
    try {
      const obligationRecords = await ObligationModel.getAll();
      res.json({ data: obligationRecords });
    } catch (error) {
      console.error("Error in ObligationController.getAll:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all obligation records with activities
  static async getByActivitiesId(req, res) {
    try {
      // No need for activities_id parameter
      const obligationRecords = await ObligationModel.getByActivitiesId();
      res.json({ data: obligationRecords });
    } catch (error) {
      console.error("Error in ObligationController.getByActivitiesId:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update obligation record
  static async update(req, res) {
    try {
      const { id } = req.params;
      const obligationData = req.body;

      // Validate required fields
      if (!obligationData.activities_id || !obligationData.obrno) {
        return res.status(400).json({
          error: "Missing required fields: activities_id, obrno",
        });
      }

      const result = await ObligationModel.update(id, obligationData);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Obligation record not found" });
      }

      res.json({
        message: "Obligation record updated successfully",
        data: { id, ...obligationData },
      });
    } catch (error) {
      console.error("Error in ObligationController.update:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Delete obligation record
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await ObligationModel.delete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Obligation record not found" });
      }

      res.json({ message: "Obligation record deleted successfully" });
    } catch (error) {
      console.error("Error in ObligationController.delete:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get next transaction number
  static async getNextNo(req, res) {
    try {
      const result = await ObligationModel.getNextNo(req, res);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = ObligationController;
