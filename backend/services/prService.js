const PRRepository = require("../repositories/PRRepository");
const ValidationEngine = require("../engines/ValidationEngine");
const AuditEngine = require("../engines/AuditEngine");
const TransactionEngine = require("../engines/TransactionEngine");
const CacheEngine = require("../engines/CacheEngine");

class PRService {
  static async createPR(prData) {
    return await TransactionEngine.execute(async (connection) => {
      // 1. Validation
      if (!ValidationEngine.validateAmount(prData.amount)) {
        throw new Error("Invalid total PR amount");
      }

      // Verify sum of items equals total amount
      if (prData.items && prData.items.length > 0) {
        const itemsTotal = prData.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        if (Math.abs(itemsTotal - prData.amount) > 0.01) {
          throw new Error(`PR amount mismatch. Header: ${prData.amount}, Items Sum: ${itemsTotal}`);
        }
      }

      await ValidationEngine.validatePRCreation(prData.mooe_id, prData.amount);

      // 2. Insert Header
      const result = await PRRepository.create(prData, connection);
      const prId = result.insertId;

      // 3. Insert Items
      if (prData.items && prData.items.length > 0) {
        await PRRepository.createItems(prId, prData.items, connection);
      }

      CacheEngine.invalidate("exec_summary");
      CacheEngine.invalidate("ai_context");

      const action = prData.workflow_status === 'For Review' ? 'PR_SUBMITTED' : 'PR_CREATED';
      await AuditEngine.log(action, { prId, prno: prData.prno, amount: prData.amount }, null, 'PR', prId);

      return result;
    });
  }

  static async updatePR(id, prData) {
    return await TransactionEngine.execute(async (connection) => {
      // 1. Validate total
      if (prData.items && prData.items.length > 0) {
        const itemsTotal = prData.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        if (Math.abs(itemsTotal - prData.amount) > 0.01) {
          throw new Error(`PR amount mismatch on update. Header: ${prData.amount}, Items Sum: ${itemsTotal}`);
        }
      }

      // 2. Update Header
      const result = await PRRepository.update(id, prData, connection);

      // 3. Sync Items (Delete & Re-insert)
      await PRRepository.deleteItems(id, connection);
      if (prData.items && prData.items.length > 0) {
        await PRRepository.createItems(id, prData.items, connection);
      }

      CacheEngine.invalidate("exec_summary");
      CacheEngine.invalidate("workflow_summary");
      await AuditEngine.log("PR_UPDATED", { id, prno: prData.prno }, null, 'PR', id);
      return result;
    });
  }

  static async deletePR(id) {
    const result = await PRRepository.delete(id);
    CacheEngine.invalidate("exec_summary");
    CacheEngine.invalidate("workflow_summary");
    await AuditEngine.log("PR_DELETED", { id }, null, 'PR', id);
    return result;
  }

  static async submitPR(id, userId = null) {
    return await TransactionEngine.execute(async (connection) => {
      const { pool } = require("../config/database");
      const [rows] = await pool.execute("SELECT workflow_status, prno FROM vw_pr_details WHERE id = ?", [id]);
      const pr = rows[0];

      if (!pr) throw new Error("PR not found");
      if (pr.workflow_status !== "Draft" && pr.workflow_status !== "Rejected") {
        throw new Error(`Invalid transition from ${pr.workflow_status} to For Review`);
      }

      await PRRepository.updateStatus(id, "For Review", null, connection);
      CacheEngine.invalidate("exec_summary");
      CacheEngine.invalidate("workflow_summary");
      await AuditEngine.log("PR_SUBMITTED", { id, prno: pr.prno, old_status: pr.workflow_status, new_status: "For Review" }, userId, 'PR', id);
      return { success: true };
    });
  }

  static async approvePR(id, userId = null) {
    return await TransactionEngine.execute(async (connection) => {
      const { pool } = require("../config/database");
      const [rows] = await pool.execute("SELECT workflow_status, prno FROM vw_pr_details WHERE id = ?", [id]);
      const pr = rows[0];

      if (!pr) throw new Error("PR not found");
      if (pr.workflow_status !== "For Review") {
        throw new Error(`Invalid transition from ${pr.workflow_status} to Reviewed`);
      }

      await PRRepository.updateStatus(id, "Reviewed", null, connection);
      CacheEngine.invalidate("exec_summary");
      CacheEngine.invalidate("workflow_summary");
      await AuditEngine.log("PR_REVIEWED", { id, prno: pr.prno, old_status: pr.workflow_status, new_status: "Reviewed" }, userId, 'PR', id);
      return { success: true };
    });
  }

  static async finalizePR(id, userId = null) {
    return await TransactionEngine.execute(async (connection) => {
      const { pool } = require("../config/database");
      const [rows] = await pool.execute("SELECT workflow_status, prno FROM vw_pr_details WHERE id = ?", [id]);
      const pr = rows[0];

      if (!pr) throw new Error("PR not found");
      if (pr.workflow_status !== "Reviewed") {
        throw new Error(`Invalid transition from ${pr.workflow_status} to Approved`);
      }

      await PRRepository.updateStatus(id, "Approved", null, connection);
      CacheEngine.invalidate("exec_summary");
      CacheEngine.invalidate("workflow_summary");
      await AuditEngine.log("PR_APPROVED", { id, prno: pr.prno, old_status: pr.workflow_status, new_status: "Approved" }, userId, 'PR', id);
      return { success: true };
    });
  }

  static async rejectPR(id, remarks, userId = null) {
    return await TransactionEngine.execute(async (connection) => {
      const { pool } = require("../config/database");
      const [rows] = await pool.execute("SELECT workflow_status, prno FROM vw_pr_details WHERE id = ?", [id]);
      const pr = rows[0];

      if (!pr) throw new Error("PR not found");
      if (pr.workflow_status !== "For Review") {
        throw new Error(`Invalid transition from ${pr.workflow_status} to Rejected`);
      }

      await PRRepository.updateStatus(id, "Rejected", remarks, connection);
      CacheEngine.invalidate("exec_summary");
      CacheEngine.invalidate("workflow_summary");
      await AuditEngine.log("PR_REJECTED", { id, prno: pr.prno, old_status: pr.workflow_status, new_status: "Rejected", remarks }, userId, 'PR', id);
      return { success: true };
    });
  }
}

module.exports = PRService;
