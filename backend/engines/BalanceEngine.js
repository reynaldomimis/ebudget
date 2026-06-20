const PRRepository = require("../repositories/PRRepository");
const ObligationRepository = require("../repositories/ObligationRepository");
const MOOERepository = require("../repositories/MOOERepository");
const PSRepository = require("../repositories/PSRepository");

class BalanceEngine {
  static async getMOOEBalance(mooeId, connection) {
    const mooeItem = await MOOERepository.getById(mooeId, connection);
    if (!mooeItem) return 0;

    const obligations = await ObligationRepository.getByMOOEId(mooeId, connection);
    const totalObligated = obligations.reduce((sum, o) => sum + Number(o.amount), 0);

    return Number(mooeItem.totalFq) - totalObligated;
  }

  static async getPRBalance(prno, connection) {
    const pr = await PRRepository.getByPRNo(prno, connection);
    if (!pr) return 0;
    return Number(pr.remaining_balance);
  }

  static async getPSBalance(psId, connection) {
    const ps = await PSRepository.getById(psId, connection);
    if (!ps) return 0;

    const obligations = await ObligationRepository.getByPSId(psId, connection);
    const totalObligated = obligations.reduce((sum, o) => sum + Number(o.amount), 0);

    return Number(ps.total) - totalObligated;
  }

  static async getAvailableAllocation(mooeId, connection) {
    const mooeItem = await MOOERepository.getById(mooeId, connection);
    if (!mooeItem) return 0;

    const prs = await PRRepository.getByMOOEId(mooeId, connection);
    // Use pr_amount from view
    const totalPRAmount = prs.reduce((sum, p) => sum + Number(p.pr_amount), 0);

    const obligations = await ObligationRepository.getByMOOEId(mooeId, connection);
    const directObligations = obligations.filter(o => !o.prno).reduce((sum, o) => sum + Number(o.amount), 0);

    return Number(mooeItem.totalFq) - totalPRAmount - directObligations;
  }

  static async getPAPBalance(planId, papDes, connection) {
    const mooeItems = await MOOERepository.getByPlan(planId, connection);
    const papMOOEs = mooeItems.filter(a => a.pap_des === papDes && !a.is_subtotal);

    let totalAllocation = 0;
    let totalObligated = 0;

    for (const item of papMOOEs) {
        totalAllocation += Number(item.totalFq);
        const obligations = await ObligationRepository.getByMOOEId(item.id, connection);
        totalObligated += obligations.reduce((sum, o) => sum + Number(o.amount), 0);
    }

    return totalAllocation - totalObligated;
  }
}

module.exports = BalanceEngine;
