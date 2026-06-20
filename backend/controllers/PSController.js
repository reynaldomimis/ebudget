const PSService = require("../services/PSService");
const FiscalYearContext = require("../engines/FiscalYearContext");
const { handleError } = require("../utils/errorHandler");

class PSController {
  static async createPlanWithPS(req, res) {
    console.log("DEBUG: PS IMPORT CONTROLLER HIT");
    try {
      const { title, range_label, psItems, planDate } = req.body;

      if (!title || !psItems || !Array.isArray(psItems)) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await PSService.createPlanWithPS(
        { title, range_label, planDate },
        psItems
      );

      res.status(201).json({
        success: true,
        message: "Plan and PS items created successfully",
        data: result
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getAll(req, res) {
    try {
      const filters = req.query;
      if (!filters.plan_id) {
        filters.plan_id = await FiscalYearContext.getActivePlanId();
      }
      const data = await PSService.getAllPS(filters);
      res.json({ success: true, data });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const result = await PSService.updatePS(id, req.body);
      res.json({ success: true, message: "PS item updated successfully", data: result });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      await PSService.deletePS(id);
      res.json({ success: true, message: "PS item deleted successfully" });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getDistinctValues(req, res) {
    try {
      const { field } = req.params;
      const data = await PSService.getDistinctValues(field);
      res.json({ success: true, data });
    } catch (error) {
      handleError(error, res);
    }
  }
}

module.exports = PSController;
