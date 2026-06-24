const ObligationRepository = require("../repositories/ObligationRepository");
const PRRepository = require("../repositories/PRRepository");
const ValidationEngine = require("../engines/ValidationEngine");
const AuditEngine = require("../engines/AuditEngine");
const TransactionEngine = require("../engines/TransactionEngine");
const CacheEngine = require("../engines/CacheEngine");
const PRBalanceResolver = require("../engines/PRBalanceResolver");

class ObligationService {
  static async createObligation(obligationData) {
    return await TransactionEngine.execute(async (connection) => {
      // 1. Validate Amount
      if (!ValidationEngine.validateAmount(obligationData.amount)) {
        throw new Error("Invalid obligation amount");
      }

      // 2. Server-side Allocation & PR Balance Validation
      await ValidationEngine.validateObligationCreation(obligationData);

      // Fetch mooe_id and pr_id if it's a PR obligation
      if (obligationData.prno && (!obligationData.mooe_id || !obligationData.pr_id)) {
        const [pr] = await connection.execute("SELECT id, mooe_id FROM vw_pr_details WHERE prno = ?", [obligationData.prno]);
        if (pr && pr.length > 0) {
          if (!obligationData.pr_id) obligationData.pr_id = pr[0].id;
          if (!obligationData.mooe_id) obligationData.mooe_id = pr[0].mooe_id;
        }
      }

      // 3. Save
      const result = await ObligationRepository.create(obligationData, connection);

      // 4. Update PR Status dynamically
      if (obligationData.prno) {
        await PRBalanceResolver.resolvePRStatus(obligationData.prno, connection);
      }

      CacheEngine.invalidate("exec_summary");
      CacheEngine.invalidate("ai_context");

      // 5. Audit
      await AuditEngine.log("OBLIGATION_CREATED", {
        obrno: obligationData.obrno,
        amount: obligationData.amount,
        prno: obligationData.prno
      }, null, 'OBLIGATION', result.insertId);

      return result;
    });
  }

  static async updateObligation(id, obligationData) {
     return await TransactionEngine.execute(async (connection) => {
      const oldOb = await connection.execute("SELECT prno FROM vw_obligation_details WHERE id = ?", [id]);
      const oldPrNo = oldOb[0] && oldOb[0][0] ? oldOb[0][0].prno : null;

      const result = await ObligationRepository.update(id, obligationData, connection);

      if (obligationData.prno) {
        await PRBalanceResolver.resolvePRStatus(obligationData.prno, connection);
      }
      if (oldPrNo && oldPrNo !== obligationData.prno) {
        await PRBalanceResolver.resolvePRStatus(oldPrNo, connection);
      }

      CacheEngine.invalidate("exec_summary");
      CacheEngine.invalidate("workflow_summary");
      await AuditEngine.log("OBLIGATION_UPDATED", { id, obrno: obligationData.obrno }, null, 'OBLIGATION', id);
      return result;
    });
  }

  static async deleteObligation(id) {
    return await TransactionEngine.execute(async (connection) => {
      const [ob] = await connection.execute("SELECT prno FROM vw_obligation_details WHERE id = ?", [id]);
      const prno = ob && ob[0] ? ob[0].prno : null;

      const result = await ObligationRepository.delete(id, connection);

      if (prno) {
        await PRBalanceResolver.resolvePRStatus(prno, connection);
      }

      CacheEngine.invalidate("exec_summary");
      CacheEngine.invalidate("workflow_summary");
      await AuditEngine.log("OBLIGATION_DELETED", { id }, null, 'OBLIGATION', id);
      return result;
    });
  }
}

module.exports = ObligationService;
