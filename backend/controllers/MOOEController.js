const MOOEService = require("../services/MOOEService");
const FiscalYearContext = require("../engines/FiscalYearContext");
const { handleError } = require("../utils/errorHandler");

class MOOEController {
  static async createPlanWithMOOE(req, res) {
    console.log("DEBUG: IMPORT CONTROLLER HIT");
    console.log("DEBUG: PAYLOAD RECEIVED:", JSON.stringify(req.body).substring(0, 200) + "...");
    try {
      const { title, range_label, mooeItems, planDate } = req.body;

      if (!title || !mooeItems || !Array.isArray(mooeItems)) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await MOOEService.createPlanWithMOOE(
        { title, range_label, planDate },
        mooeItems
      );

      res.status(201).json({
        success: true,
        message: "Plan and MOOE items created successfully",
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
          filters.plan_id = await FiscalYearContext.getActivePlanId('MOOE');
      }
      const data = await MOOEService.getAllMOOE(filters);
      res.json({ success: true, data });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await MOOEService.getMOOEById(id);
      if (!data) return res.status(404).json({ success: false, message: "MOOE item not found" });

      const BalanceEngine = require("../engines/BalanceEngine");
      const availableAllocation = await BalanceEngine.getAvailableAllocation(id);

      res.json({
        success: true,
        data: {
          ...data,
          availableAllocation
        }
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const result = await MOOEService.updateMOOE(id, req.body);
      res.json({ success: true, message: "MOOE item updated successfully", data: result });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      await MOOEService.deleteMOOE(id);
      res.json({ success: true, message: "MOOE item deleted successfully" });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async deleteByPlanId(req, res) {
    try {
      const { planId } = req.params;
      await MOOEService.deleteByPlanId(planId);
      res.json({ success: true, message: "MOOE items for plan deleted successfully" });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async getDistinctValues(req, res) {
    try {
      const { field } = req.params;
      const filters = req.query;

      if (!filters.plan_id) {
          filters.plan_id = await FiscalYearContext.getActivePlanId('MOOE');
      }

      const data = await MOOEService.getDistinctValues(field, filters);
      res.json({ success: true, data });
    } catch (error) {
      handleError(error, res);
    }
  }
}

module.exports = MOOEController;
