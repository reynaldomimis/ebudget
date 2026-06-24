const BalanceEngine = require("./BalanceEngine");
const PRRepository = require("../repositories/PRRepository");
const AuditEngine = require("./AuditEngine");

class PRBalanceResolver {
  static async resolvePRStatus(prno, connection) {
    const { pool } = require("../config/database");
    const [prRows] = await (connection || pool).execute("SELECT id, workflow_status, remaining_balance, pr_amount FROM vw_pr_details WHERE prno = ?", [prno]);
    const pr = prRows[0];
    if (!pr) return null;

    const dynamicStatuses = ['Approved', 'Partially Obligated', 'Obligated'];
    if (!dynamicStatuses.includes(pr.workflow_status)) {
        return {
            prno,
            status: pr.workflow_status,
            remaining: pr.remaining_balance,
            autoTransitioned: false
        };
    }

    const remaining = await BalanceEngine.getPRBalance(prno, connection);
    const prAmount = Number(pr.pr_amount || pr.amount);

    let newStatus = pr.workflow_status;

    if (remaining <= 0) {
      newStatus = 'Obligated';
    } else if (remaining < prAmount) {
      newStatus = 'Partially Obligated';
    } else {
      newStatus = 'Approved';
    }

    if (newStatus !== pr.workflow_status) {
      await PRRepository.updateStatusByPRNo(prno, newStatus, connection);
      await AuditEngine.log("PR_STATUS_AUTO_TRANSITION", { prno, old: pr.workflow_status, next: newStatus }, null, 'PR', pr.id);
    }

    return {
      prNo: prno,
      status: newStatus,
      remainingBalance: remaining,
      autoTransitioned: newStatus !== pr.workflow_status
    };
  }
}

module.exports = PRBalanceResolver;
