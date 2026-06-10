const PrSoModel = require("../models/prSoModel");

class PrSoController {
  // Create new PR/SO record
  static async create(req, res) {
    try {
      const prSoData = req.body;

      // Validate required fields
      if (!prSoData.activities_id || !prSoData.prno) {
        return res.status(400).json({
          error: "Missing required fields: activities_id, prno",
        });
      }

      const result = await PrSoModel.create(prSoData);
      res.status(201).json({
        message: "PR/SO record created successfully",
        data: { id: result.insertId, ...prSoData },
      });
    } catch (error) {
      console.error("Error in PrSoController.create:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all PR/SO records
  static async getAll(req, res) {
    try {
      const prSoRecords = await PrSoModel.getAll();
      res.json({ data: prSoRecords });
    } catch (error) {
      console.error("Error in PrSoController.getAll:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/pr-so/activity - Get all PR/SO records with activities
  static async getByActivitiesId(req, res) {
    try {
      const prSoRecords = await PrSoModel.getByActivitiesId();
      res.json({ data: prSoRecords });
    } catch (error) {
      console.error("Error in PrSoController.getByActivitiesId:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update PR/SO record
  static async update(req, res) {
    try {
      const { id } = req.params;
      const prSoData = req.body;

      // Validate required fields
      if (!prSoData.activities_id || !prSoData.prno) {
        return res.status(400).json({
          error: "Missing required fields: activities_id, prno",
        });
      }

      const result = await PrSoModel.update(id, prSoData);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "PR/SO record not found" });
      }

      res.json({
        message: "PR/SO record updated successfully",
        data: { id, ...prSoData },
      });
    } catch (error) {
      console.error("Error in PrSoController.update:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Delete PR/SO record
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await PrSoModel.delete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "PR/SO record not found" });
      }

      res.json({ message: "PR/SO record deleted successfully" });
    } catch (error) {
      console.error("Error in PrSoController.delete:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update unobligated amount by PR number
  static async updateUnobligatedAmount(req, res) {
    try {
      const { prno } = req.params;
      const { obligated, unobligated } = req.body;

      // Validate required fields
      if (!prno || obligated === undefined || unobligated === undefined) {
        return res.status(400).json({
          error:
            "Missing required fields: prno (in params), obligated, unobligated (in body)",
        });
      }

      // Validate obligated/unoblligated is a number
      if (isNaN(parseFloat(obligated)) || isNaN(parseFloat(unobligated))) {
        return res.status(400).json({
          error: "Obligated and Unobligated must be a valid number",
        });
      }

      const result = await PrSoModel.updateUnobligatedAmount(
        prno,
        obligated,
        unobligated,
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "PR/SO record not found" });
      }

      res.json({
        message: "PR/SO obligated/unobligated amount updated successfully",
        prno,
        obligated,
        unobligated,
      });
    } catch (error) {
      console.error("Error in PrSoController.updateUnobligatedAmount:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get next transaction number
  static async getNextNo(req, res) {
    try {
      const result = await PrSoModel.getNextNo(req, res);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Palitan ang pangalan nito:
  static async getWithBalance(req, res) {
    try {
      const prSoRecords = await PrSoModel.getWithBalance();
      res.json({ data: prSoRecords });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/pr-so/activity/:id - Get PR/SO records by activity ID
  static async getByRecordsId(req, res) {
    try {
      const { id } = req.params; 

      if (!id) {
        return res.status(400).json({ error: "Activity ID is required" });
      }

      const prSoRecords = await PrSoModel.getByRecordsId(id); 
      res.json({ data: prSoRecords });
    } catch (error) {
      console.error("Error in PrSoController.getByRecordsId:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = PrSoController;
