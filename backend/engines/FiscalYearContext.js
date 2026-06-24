const FiscalYearRepository = require("../repositories/FiscalYearRepository");

class FiscalYearContext {
  static async getActivePlanId(type = null) {
    // If no type is specified, return the most recent plan overall
    if (!type) {
      const plans = await FiscalYearRepository.getAll();
      return plans.length > 0 ? plans[0].plan_id : null;
    }

    // If type is specified, return the most recent plan of that type
    // This assumes the 'plan_id' prefix or another field identifies the type.
    // Based on the data, MOOE plans might not have a specific prefix, but PS plans have 'PLAN-PS-'.
    // Or we can query the respective tables to find the most recent plan_id that has data.
    const plans = await FiscalYearRepository.getAll();

    for (const plan of plans) {
        if (type === 'MOOE') {
            // Check if this plan has MOOE data using the view
            const { pool } = require("../config/database");
            const [rows] = await pool.execute("SELECT 1 FROM vw_mooe_excel_full_report WHERE plan_id = ? LIMIT 1", [plan.plan_id]);
            if (rows.length > 0) return plan.plan_id;
        } else if (type === 'PS') {
            const { pool } = require("../config/database");
            const [rows] = await pool.execute("SELECT 1 FROM vw_ps_details WHERE plan_id = ? LIMIT 1", [plan.plan_id]);
            if (rows.length > 0) return plan.plan_id;
        }
    }

    return plans.length > 0 ? plans[0].plan_id : null;
  }

  static async getActiveYear() {
    const plans = await FiscalYearRepository.getAll();
    if (plans && plans.length > 0) {
      return plans[0].year;
    }
    return new Date().getFullYear();
  }

  static async resolvePlanId(input) {
    if (!input) return await this.getActivePlanId();

    // If input is already a full plan_id (e.g. MOOE-2026-..., PS-2026-..., or old PLAN-...)
    if (String(input).includes('-20')) return input;

    // If input is a year (e.g. 2024 or "2024"), find the latest plan for that year
    const plans = await FiscalYearRepository.getByYear(input);
    if (plans && plans.length > 0) {
      return plans[0].plan_id;
    }

    // If input looks like a fiscal year (e.g., "2023"), return it as is
    // so engines can filter by that year (returning empty results instead of falling back to 2026)
    if (/^20\d{2}$/.test(String(input))) {
      return String(input);
    }

    // Fallback to active plan only if input is null or unrecognized
    return await this.getActivePlanId();
  }
}

module.exports = FiscalYearContext;
