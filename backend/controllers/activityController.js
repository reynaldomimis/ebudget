const ActivityService = require("../services/activityService");

class ActivityController {
  static async createPlanWithActivities(req, res) {
    try {
      const { title, range_label, activities, allotment_class, planDate } = req.body;

      if (!title || !activities || !Array.isArray(activities)) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await ActivityService.createPlanWithActivities(
        { title, range_label, allotment_class, planDate },
        activities
      );

      res.status(201).json({
        message: "Plan and activities created successfully",
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const filters = req.query;
      const data = await ActivityService.getAllActivities(filters);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const result = await ActivityService.updateActivity(id, req.body);
      res.json({ message: "Activity updated successfully", data: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      await ActivityService.deleteActivity(id);
      res.json({ message: "Activity deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteByPlanId(req, res) {
    try {
      const { planId } = req.params;
      await ActivityService.deleteActivitiesByPlanId(planId);
      res.json({ message: "Activities deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getDistinctValues(req, res) {
    try {
      const { field } = req.params;
      const data = await ActivityService.getDistinctFieldValues(field);
      res.json({ field, data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ActivityController;
