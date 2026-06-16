const { pool } = require("../config/database");

class ActivityModel {
  static async getNextPlanId(prefix = "") {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0");

    const query = `SELECT plan_id FROM plan_info WHERE plan_id LIKE ? ORDER BY plan_id DESC LIMIT 1`;
    const searchPattern = prefix ? `${prefix}-${year}-${month}-%` : `${year}-${month}-%`;
    const [rows] = await pool.execute(query, [searchPattern]);

    let nextNumber = 1;
    if (rows.length > 0) {
      const parts = rows[0].plan_id.split("-");
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }

    const nextNoStr = nextNumber.toString().padStart(2, "0");
    return prefix
      ? `${prefix}-${year}-${month}-${nextNoStr}`
      : `${year}-${month}-${nextNoStr}`;
  }

  static async createPlan(planData, connection) {
    const query = `INSERT INTO plan_info (plan_id, year, title, range_label) VALUES (?, ?, ?, ?)`;
    await connection.execute(query, [
      planData.plan_id,
      planData.year,
      planData.title,
      planData.range_label,
    ]);
    return planData.plan_id;
  }

  static async createActivity(activity, connection) {
    if (activity.allotment_class === "PS") {
      const query = `INSERT INTO ps (
        title, transaction_date, pap_type, pap_des, pap_des_code,
        expense_items, amount, total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      await connection.execute(query, [
        activity.title || "",
        activity.planDate || new Date(),
        activity.pap_type || "",
        activity.pap_des || "",
        activity.pap_des_code || "",
        activity.expense_items || "",
        activity.total_amount || 0,
        activity.total_amount || 0,
      ]);
      return;
    }

    const query = `INSERT INTO activities (
      plan_id, plan_year, pap_type, pap_des, division,
      ref_main_name, ref_middle_name, ref_center_name, ref_last_name,
      is_subtotal, has_expense_items, numbering, count_type, name,
      performance_indicator, pt1, pt2, pt3, pt4, totalPt,
      expense_items, expense_items_sub, fq1, fq2, fq3, fq4, totalFq,
      total_amount, sub_total_name, sort_order, allotment_class
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await connection.execute(query, [
      activity.plan_id,
      activity.plan_year,
      activity.pap_type || "",
      activity.pap_des || "",
      activity.division || "",
      activity.ref_main_name || "",
      activity.ref_middle_name || "",
      activity.ref_center_name || "",
      activity.ref_last_name || "",
      activity.is_subtotal || 0,
      activity.has_expense_items || 0,
      activity.numbering || "",
      activity.count_type || 0,
      activity.name || "",
      activity.performance_indicator || "",
      activity.pt1 || 0,
      activity.pt2 || 0,
      activity.pt3 || 0,
      activity.pt4 || 0,
      activity.totalPt || 0,
      activity.expense_items || "",
      activity.expense_items_sub || "",
      activity.fq1 || 0,
      activity.fq2 || 0,
      activity.fq3 || 0,
      activity.fq4 || 0,
      activity.totalFq || 0,
      activity.total_amount || 0,
      activity.sub_total_name || "",
      activity.sort_order || 0,
      activity.allotment_class || "MOOE",
    ]);
  }

  static async getAll(filters = {}) {
    const allotmentClass = filters.allotment_class;
    let activitiesRows = [];
    let psRows = [];

    // 1. Kumuha sa activities table (MOOE, etc.)
    // Maliban na lang kung "PS" lang ang hinihingi
    if (!allotmentClass || allotmentClass !== "PS") {
      let query = "SELECT * FROM activities";
      const values = [];
      if (allotmentClass) {
        query += " WHERE allotment_class = ?";
        values.push(allotmentClass);
      }
      query += " ORDER BY sort_order, created_at";
      const [rows] = await pool.execute(query, values);
      activitiesRows = rows;
    }

    // 2. Kumuha sa ps table (Personnel Services)
    // Maliban na lang kung "MOOE" lang ang hinihingi
    if (!allotmentClass || allotmentClass === "PS") {
      try {
        const [rows] = await pool.execute("SELECT * FROM ps ORDER BY id ASC");
        psRows = rows.map(r => ({
          ...r,
          id: `ps-${r.id}`,
          allotment_class: "PS",
          is_ps_expense: true,
          name: r.expense_items,
          total_amount: r.total,
          totalFq: r.total,
          fq4: r.total
        }));
      } catch (err) {
        console.error("DB ERROR (ps table):", err.message);
      }
    }

    // Pag-isahin ang resulta kung walang specific filter
    if (allotmentClass === "PS") return psRows;
    if (allotmentClass) return activitiesRows;

    return [...activitiesRows, ...psRows];
  }

  static async update(id, activityData) {
    if (typeof id === 'string' && id.startsWith('ps-')) {
      const psId = id.replace('ps-', '');
      const query = `UPDATE ps SET expense_items = ?, total = ?, amount = ? WHERE id = ?`;
      const [result] = await pool.execute(query, [
        activityData.expense_items || activityData.name || "",
        activityData.total_amount || activityData.total || 0,
        activityData.total_amount || activityData.amount || 0,
        psId
      ]);
      return { affectedRows: result.affectedRows, id };
    }

    const fqKeys = ["fq1", "fq2", "fq3", "fq4"];
    const fqs = {};
    fqKeys.forEach((k) => {
      fqs[k] = Number(activityData[k]) || 0;
    });
    const totalFq = fqKeys.reduce((sum, k) => sum + fqs[k], 0);

    const allowedFields = [
      "plan_id", "plan_year", "pap_type", "pap_des", "division",
      "ref_main_name", "ref_middle_name", "ref_center_name", "ref_last_name",
      "is_subtotal", "has_expense_items", "numbering", "count_type", "name",
      "performance_indicator", "pt1", "pt2", "pt3", "pt4", "totalPt",
      "expense_items", "expense_items_sub", "total_amount", "sub_total_name", "sort_order", "allotment_class"
    ];

    const setClauses = [];
    const values = [];

    allowedFields.forEach((field) => {
      if (field in activityData) {
        setClauses.push(`${field} = ?`);
        values.push(activityData[field]);
      }
    });

    fqKeys.forEach((k) => {
      setClauses.push(`${k} = ?`);
      values.push(fqs[k]);
    });

    setClauses.push(`totalFq = ?`);
    values.push(totalFq);

    const query = `UPDATE activities SET ${setClauses.join(", ")} WHERE id = ?`;
    values.push(id);

    const [result] = await pool.execute(query, values);
    return { affectedRows: result.affectedRows, id, ...fqs, totalFq };
  }

  static async delete(id) {
    if (typeof id === 'string' && id.startsWith('ps-')) {
      const psId = id.replace('ps-', '');
      const [result] = await pool.execute("DELETE FROM ps WHERE id = ?", [psId]);
      return result;
    }
    const [result] = await pool.execute("DELETE FROM activities WHERE id = ?", [id]);
    return result;
  }

  static async deleteByPlanId(plan_id) {
    const [result] = await pool.execute("DELETE FROM activities WHERE plan_id = ?", [plan_id]);
    return result;
  }

  static async getDistinctValues(field) {
    const allowedFields = [
      "plan_id", "plan_year", "pap_type", "pap_des", "division",
      "ref_main_name", "ref_middle_name", "ref_center_name", "ref_last_name",
      "name", "performance_indicator", "expense_items", "allotment_class"
    ];

    if (!allowedFields.includes(field)) {
      throw new Error(`Invalid field: ${field}`);
    }

    const query = `SELECT DISTINCT ${field} FROM activities WHERE ${field} IS NOT NULL AND ${field} != '' ORDER BY ${field}`;
    const [rows] = await pool.execute(query);

    if (["pap_type", "pap_des", "expense_items"].includes(field)) {
      try {
          const [psRows] = await pool.execute(`SELECT DISTINCT ${field} FROM ps WHERE ${field} IS NOT NULL AND ${field} != ''`);
          const combined = new Set([...rows.map(r => r[field]), ...psRows.map(r => r[field])]);
          return Array.from(combined).sort();
      } catch (e) {
          return rows.map((row) => row[field]);
      }
    }

    return rows.map((row) => row[field]);
  }
}

module.exports = ActivityModel;
