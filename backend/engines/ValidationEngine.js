const PRRepository = require("../repositories/PRRepository");
const MOOERepository = require("../repositories/MOOERepository");
const PSRepository = require("../repositories/PSRepository");
const ObligationRepository = require("../repositories/ObligationRepository");
const { AppError } = require("../utils/errorHandler");
const BalanceEngine = require("./BalanceEngine");

class ValidationEngine {
  static validateAmount(amount) {
    if (amount === undefined || amount === null) return false;
    const num = Number(amount);
    return !isNaN(num) && num > 0;
  }

  static async validatePRCreation(allotmentId, amount, type = "MOOE") {
    if (type === "PS") {
      // If business rules change to allow PS PRs, implement PS balance check here
      throw new AppError("INVALID_OPERATION", "Purchase Requests are not allowed for Personal Services (PS) allotment.");
    }

    const { pool } = require("../config/database");
    const [mooeRows] = await pool.query("SELECT id FROM vw_mooe_excel_full_report WHERE id = ?", [allotmentId]);
    if (mooeRows.length === 0) throw new AppError("MOOE_NOT_FOUND", "MOOE record not found", {}, 404);

    const available = await BalanceEngine.getAvailableAllocation(allotmentId);

    if (amount > available) {
      throw new AppError("INSUFFICIENT_ALLOCATION", `Insufficient allocation. Available: ${available}`, { available, requested: amount });
    }
    return true;
  }

  static async validateObligationCreation(data) {
    const { amount, prno, mooe_id, ps_id } = data;
    const { pool } = require("../config/database");

    if (prno) {
      const [prRows] = await pool.query("SELECT workflow_status FROM vw_pr_details WHERE prno = ?", [prno]);
      const pr = prRows[0];
      if (!pr) throw new AppError("PR_NOT_FOUND", "Purchase Request not found");

      const allowedStatuses = ['Approved', 'Partially Obligated'];
      if (!allowedStatuses.includes(pr.workflow_status)) {
        throw new AppError("INVALID_PR_STATUS", `Obligation creation is blocked. PR status is '${pr.workflow_status}', but must be 'Approved' or 'Partially Obligated'.`);
      }

      const remaining = await BalanceEngine.getPRBalance(prno);
      if (amount > remaining) {
        throw new AppError("INSUFFICIENT_PR_BALANCE", `Insufficient PR balance. Remaining: ${remaining}`, { available: remaining, requested: amount });
      }
    } else if (mooe_id) {
      const available = await BalanceEngine.getAvailableAllocation(mooe_id);
      if (amount > available) {
        throw new AppError("INSUFFICIENT_ALLOCATION", `Insufficient MOOE allocation. Available: ${available}`, { available, requested: amount });
      }
    } else if (ps_id) {
      const available = await BalanceEngine.getPSBalance(ps_id);
      if (amount > available) {
        throw new AppError("INSUFFICIENT_PS_ALLOCATION", `Insufficient PS allocation. Available: ${available}`, { available, requested: amount });
      }
    } else {
      throw new AppError("INVALID_SOURCE", "Invalid obligation source");
    }
    return true;
  }
}

module.exports = ValidationEngine;
