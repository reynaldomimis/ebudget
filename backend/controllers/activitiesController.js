const ActivitiesModel = require("../models/activitiesModel");

class ActivitiesController {
  static async createPlanWithActivities(req, res) {
    try {
      const { title, range_label, activities } = req.body;

      if (!title || !range_label || !activities || !Array.isArray(activities)) {
        return res.status(400).json({
          error:
            "Missing required fields: title, range_label, activities (array)",
        });
      }

      const result = await ActivitiesModel.createPlanWithActivities(
        { title, range_label },
        activities,
      );

      res.status(201).json({
        message: "Plan and activities created successfully",
        plan_id: result.plan_id,
        activities: result.activities,
      });
    } catch (error) {
      console.error("Error in createPlanWithActivities:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all activities
  static async getAll(req, res) {
    try {
      const activities = await ActivitiesModel.getAll();
      res.json({ data: activities });
    } catch (error) {
      console.error("Error in ActivitiesController.getAll:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // // Update activity
  // static async update(req, res) {
  //   try {
  //     const { id } = req.params;
  //     const activityData = req.body;

  //     // Validate required fields
  //     if (!activityData.plan_id || !activityData.name) {
  //       return res.status(400).json({
  //         error: "Missing required fields: plan_id, name",
  //       });
  //     }

  //     const result = await ActivitiesModel.update(id, activityData);

  //     if (result.affectedRows === 0) {
  //       return res.status(404).json({ error: "Activity not found" });
  //     }

  //     res.json({
  //       message: "Activity updated successfully",
  //       data: { id, ...activityData },
  //     });
  //   } catch (error) {
  //     console.error("Error in ActivitiesController.update:", error);
  //     res.status(500).json({ error: error.message });
  //   }
  // }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const activityData = req.body;
      const result = await ActivitiesModel.update(id, activityData);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Activity not found" });
      }

      res.json({
        message: "Activity updated successfully",
        data: result.updatedFields,
      });
    } catch (error) {
      console.error("Error in ActivitiesController.update:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Delete activity
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await ActivitiesModel.delete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Activity not found" });
      }

      res.json({ message: "Activity deleted successfully" });
    } catch (error) {
      console.error("Error in ActivitiesController.delete:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Delete activities by plan_id
  static async deleteByPlanId(req, res) {
    try {
      const { plan_id } = req.params;
      const result = await ActivitiesModel.deleteByPlanId(plan_id);

      res.json({
        message: "Activities deleted successfully",
        deletedCount: result.affectedRows,
      });
    } catch (error) {
      console.error("Error in ActivitiesController.deleteByPlanId:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get distinct values for a specific field
  static async getDistinctValues(req, res) {
    try {
      const { field } = req.params;

      if (!field) {
        return res.status(400).json({
          error: "Missing required parameter: field",
        });
      }

      const distinctValues = await ActivitiesModel.getDistinctValues(field);
      res.json({
        field,
        data: distinctValues,
        count: distinctValues.length,
      });
    } catch (error) {
      console.error("Error in ActivitiesController.getDistinctValues:", error);
      res.status(500).json({ error: error.message });
    }
  }

  //Update only totalFQ amount
  static async updateTotalFq(req, res) {
    try {
      const { id } = req.params;
      const { totalFq } = req.body;

      if (totalFq == null) {
        return res.status(400).json({
          error: "totalFq is required",
        });
      }

      const result = await ActivitiesModel.updateTotalFq(id, totalFq);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Activity not found" });
      }

      res.json({
        message: "totalFq updated successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error in updateTotalFq:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ActivitiesController;
