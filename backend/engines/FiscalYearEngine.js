const FiscalYearRepository = require("../repositories/FiscalYearRepository");

class FiscalYearEngine {
  static async getFiscalYears() {
    return await FiscalYearRepository.getAll();
  }

  static async getFiscalYearDetails(plan_id) {
    return await FiscalYearRepository.getById(plan_id);
  }

  static async validateFiscalYear(plan_id, year) {
    const fy = await FiscalYearRepository.getById(plan_id);
    if (!fy) return false;
    if (year && fy.year !== year) return false;
    return true;
  }
}

module.exports = FiscalYearEngine;
