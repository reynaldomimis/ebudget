const { pool } = require("../config/database");

class AuditEngine {
  static async log(action, details, userId = null, refType = null, refId = null) {
    try {
      const allowedActions = [
        "PR_CREATED", "PR_UPDATED", "PR_DELETED",
        "PR_SUBMITTED", "PR_APPROVED", "PR_REJECTED", "PR_OBLIGATED",
        "OBLIGATION_CREATED", "OBLIGATION_UPDATED", "OBLIGATION_DELETED",
        "PLAN_CREATED", "MOOE_PLAN_CREATED", "PS_PLAN_CREATED",
        "ACTIVITY_UPDATED", "ACTIVITY_DELETED",
        "IMPORT", "EXPORT", "FISCAL_YEAR_CHANGE",
        "LOGIN", "LOGOUT", "APPROVAL", "REJECT", "REVIEW",
        "PR_STATUS_AUTO_TRANSITION"
      ];

      if (!allowedActions.includes(action)) {
        console.warn(`[AUDIT] Unknown action logged: ${action}`);
      }

      console.log(`[AUDIT][${new Date().toISOString()}] ${action} [${refType}:${refId}]:`, JSON.stringify(details));

      try {
        await pool.execute(
          "INSERT INTO audit_logs (action, ref_type, ref_id, details, user_id, timestamp) VALUES (?, ?, ?, ?, ?, NOW())",
          [action, refType, refId, JSON.stringify(details), userId]
        );
      } catch (e) {
        console.error("Audit DB insert failed:", e.message);
      }
    } catch (error) {
      console.error("Audit logging failed:", error);
    }
  }
}

module.exports = AuditEngine;
