const ActivityModel = require("../models/activityModel");
const { pool } = require("../config/database");

class ActivityService {
  static async createPlanWithActivities(planInfo, activities) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const prefix = planInfo.allotment_class || "";
      const plan_id = await ActivityModel.getNextPlanId(prefix);

      const planData = {
        plan_id,
        year: new Date().getFullYear(),
        title: planInfo.title,
        range_label: planInfo.range_label || "Annual"
      };

      await ActivityModel.createPlan(planData, connection);

      for (const [index, act] of activities.entries()) {
        const activityData = {
          ...act,
          plan_id,
          plan_year: planData.year,
          sort_order: act.sort_order ?? index,
          numbering: (index + 1).toString(),
          title: planInfo.title,
          planDate: planInfo.planDate
        };
        await ActivityModel.createActivity(activityData, connection);
      }

      await connection.commit();
      return { plan_id, activities };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getAllActivities(filters) {
    return await ActivityModel.getAll(filters);
  }

  static async updateActivity(id, data) {
    return await ActivityModel.update(id, data);
  }

  static async deleteActivity(id) {
    return await ActivityModel.delete(id);
  }

  static async deleteActivitiesByPlanId(planId) {
    return await ActivityModel.deleteByPlanId(planId);
  }

  static async getDistinctFieldValues(field) {
    return await ActivityModel.getDistinctValues(field);
  }
}

module.exports = ActivityService;
