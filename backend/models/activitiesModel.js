const { pool } = require("../config/database");

class ActivitiesModel {
  static async getNextPlanId() {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0");

    const query = `SELECT plan_id FROM plan_info WHERE plan_id LIKE ? ORDER BY plan_id DESC LIMIT 1`;
    const [rows] = await pool.execute(query, [`WFP-${year}-${month}-%`]);

    let nextNumber = 1;
    if (rows.length > 0) {
      const parts = rows[0].plan_id.split("-");
      const lastNum = parseInt(parts[3], 10);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }

    return `WFP-${year}-${month}-${nextNumber.toString().padStart(2, "0")}`;
  }

  // Create plan_info + activities in one transaction
  static async createPlanWithActivities(planInfo, activities) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Generate plan_id
      const plan_id = await this.getNextPlanId();
      planInfo.plan_id = plan_id;
      planInfo.year = new Date().getFullYear();

      // Insert plan_info
      await connection.execute(
        `INSERT INTO plan_info (plan_id, year, title, range_label) VALUES (?, ?, ?, ?)`,
        [planInfo.plan_id, planInfo.year, planInfo.title, planInfo.range_label],
      );

      // Insert activities
      for (const [index, act] of activities.entries()) {
        await connection.execute(
          `INSERT INTO activities (
            plan_id, plan_year, pap_type, pap_des, division,
            ref_main_name, ref_middle_name, ref_center_name, ref_last_name,
            is_subtotal, has_expense_items, numbering, count_type, name,
            performance_indicator, pt1, pt2, pt3, pt4, totalPt,
            expense_items, expense_items_sub, fq1, fq2, fq3, fq4, totalFq,
            total_amount, sub_total_name, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            plan_id,
            planInfo.year,
            act.pap_type || "",
            act.pap_des || "",
            act.division || "",
            act.ref_main_name || "",
            act.ref_middle_name || "",
            act.ref_center_name || "",
            act.ref_last_name || "",
            act.is_subtotal || 0,
            act.has_expense_items || 0,
            (index + 1).toString(),
            act.count_type || 0,
            act.name || "",
            act.performance_indicator || "",
            act.pt1 || 0,
            act.pt2 || 0,
            act.pt3 || 0,
            act.pt4 || 0,
            act.totalPt || 0,
            act.expense_items || "",
            act.expense_items_sub || "",
            act.fq1 || 0,
            act.fq2 || 0,
            act.fq3 || 0,
            act.fq4 || 0,
            act.totalFq || 0,
            act.total_amount || 0,
            act.sub_total_name || "",
            act.sort_order || 0,
          ],
        );
      }

      await connection.commit();
      connection.release();
      return { plan_id, activities };
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw new Error("Transaction failed: " + error.message);
    }
  }

  // Get all activities
  static async getAll() {
    try {
      const query = "SELECT * FROM activities ORDER BY sort_order, created_at";
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching activities: ${error.message}`);
    }
  }

  // // Update activity
  // static async update(id, activityData) {
  //   try {
  //     const query = `
  //       UPDATE activities
  //       SET plan_id = ?, plan_year = ?, pap_type = ?, pap_des = ?, division = ?,
  //           ref_main_name = ?, ref_middle_name = ?, ref_center_name = ?, ref_last_name = ?,
  //           is_subtotal = ?, has_expense_items = ?, numbering = ?, count_type = ?, name = ?,
  //           performance_indicator = ?, pt1 = ?, pt2 = ?, pt3 = ?, pt4 = ?, totalPt = ?,
  //           expense_items = ?, expense_items_sub = ?, fq1 = ?, fq2 = ?, fq3 = ?, fq4 = ?, totalFq = ?,
  //           total_amount = ?, sub_total_name = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
  //       WHERE id = ?
  //     `;
  //     const [result] = await pool.execute(query, [
  //       activityData.plan_id,
  //       activityData.plan_year,
  //       activityData.pap_type,
  //       activityData.pap_des,
  //       activityData.division,
  //       activityData.ref_main_name,
  //       activityData.ref_middle_name,
  //       activityData.ref_center_name,
  //       activityData.ref_last_name,
  //       activityData.is_subtotal || 0,
  //       activityData.has_expense_items || 0,
  //       activityData.numbering,
  //       activityData.count_type,
  //       activityData.name,
  //       activityData.performance_indicator,
  //       activityData.pt1 || 0,
  //       activityData.pt2 || 0,
  //       activityData.pt3 || 0,
  //       activityData.pt4 || 0,
  //       activityData.totalPt || 0,
  //       activityData.expense_items,
  //       activityData.expense_items_sub,
  //       activityData.fq1 || 0,
  //       activityData.fq2 || 0,
  //       activityData.fq3 || 0,
  //       activityData.fq4 || 0,
  //       activityData.totalFq || 0,
  //       activityData.total_amount || 0,
  //       activityData.sub_total_name,
  //       activityData.sort_order || 0,
  //       id,
  //     ]);
  //     return result;
  //   } catch (error) {
  //     throw new Error(`Error updating activity: ${error.message}`);
  //   }
  // }

  static async update(id, activityData) {
    try {
      // Normalize FQs (always numbers)
      const fqKeys = ["fq1", "fq2", "fq3", "fq4"];
      const fqs = {};

      fqKeys.forEach((k) => {
        fqs[k] = Number(activityData[k]) || 0;
      });

      // Compute derived totalFq
      const totalFq = fqKeys.reduce((sum, k) => sum + fqs[k], 0);

      // Fields allowed to be updated dynamically
      const allowedFields = [
        "plan_id",
        "plan_year",
        "pap_type",
        "pap_des",
        "division",
        "ref_main_name",
        "ref_middle_name",
        "ref_center_name",
        "ref_last_name",
        "is_subtotal",
        "has_expense_items",
        "numbering",
        "count_type",
        "name",
        "performance_indicator",
        "pt1",
        "pt2",
        "pt3",
        "pt4",
        "totalPt",
        "expense_items",
        "expense_items_sub",
        "total_amount",
        "sub_total_name",
        "sort_order",
      ];

      const setClauses = [];
      const values = [];

      allowedFields.forEach((field) => {
        if (field in activityData) {
          setClauses.push(`${field} = ?`);
          values.push(activityData[field]);
        }
      });

      // add fq fields
      fqKeys.forEach((k) => {
        setClauses.push(`${k} = ?`);
        values.push(fqs[k]);
      });

      // add derived totalFq
      setClauses.push(`totalFq = ?`);
      values.push(totalFq);

      const query = `
      UPDATE activities
      SET ${setClauses.join(", ")}
      WHERE id = ?
    `;

      values.push(id);

      const [result] = await pool.execute(query, values);

      return {
        affectedRows: result.affectedRows,
        updatedFields: {
          id,
          ...fqs,
          totalFq,
        },
      };
    } catch (error) {
      throw new Error(`Error updating activity: ${error.message}`);
    }
  }

  // Delete activity
  static async delete(id) {
    try {
      const query = "DELETE FROM activities WHERE id = ?";
      const [result] = await pool.execute(query, [id]);
      return result;
    } catch (error) {
      throw new Error(`Error deleting activity: ${error.message}`);
    }
  }

  // Delete activities by plan_id
  static async deleteByPlanId(plan_id) {
    try {
      const query = "DELETE FROM activities WHERE plan_id = ?";
      const [result] = await pool.execute(query, [plan_id]);
      return result;
    } catch (error) {
      throw new Error(`Error deleting activities: ${error.message}`);
    }
  }

  // Get distinct values for a specific field
  static async getDistinctValues(field) {
    try {
      // Validate field to prevent SQL injection
      const allowedFields = [
        "plan_id",
        "plan_year",
        "pap_type",
        "pap_des",
        "division",
        "ref_main_name",
        "ref_middle_name",
        "ref_center_name",
        "ref_last_name",
        "is_subtotal",
        "has_expense_items",
        "numbering",
        "count_type",
        "name",
        "performance_indicator",
        "expense_items",
        "expense_items_sub",
      ];

      if (!allowedFields.includes(field)) {
        throw new Error(
          `Invalid field: ${field}. Allowed fields: ${allowedFields.join(", ")}`,
        );
      }

      const query = `SELECT DISTINCT ${field} FROM activities WHERE ${field} IS NOT NULL AND ${field} != '' ORDER BY ${field}`;
      const [rows] = await pool.execute(query);

      // Extract just the field values
      return rows.map((row) => row[field]);
    } catch (error) {
      throw new Error(
        `Error fetching distinct values for ${field}: ${error.message}`,
      );
    }
  }

  static async updateTotalFq(id, totalFq) {
    try {
      const query = `
      UPDATE activities
      SET totalFq = ?
      WHERE id = ?
    `;

      const [result] = await pool.execute(query, [Number(totalFq) || 0, id]);

      return {
        affectedRows: result.affectedRows,
        id,
        totalFq: Number(totalFq) || 0,
      };
    } catch (error) {
      throw new Error(`Error updating totalFq: ${error.message}`);
    }
  }
}

module.exports = ActivitiesModel;
