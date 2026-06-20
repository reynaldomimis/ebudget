const MOOERepository = require("../repositories/MOOERepository");
const PRRepository = require("../repositories/PRRepository");
const ObligationRepository = require("../repositories/ObligationRepository");
const PSRepository = require("../repositories/PSRepository");

class AllocationEngine {
  static async getAvailableAllocation(mooeId) {
    const mooe = await MOOERepository.getById(mooeId);
    if (!mooe) return 0;

    const prs = await PRRepository.getByMOOEId(mooeId);
    const totalPRs = prs.reduce((sum, pr) => sum + Number(pr.amount), 0);

    // Some obligations might be direct (no PR)
    const obligations = await ObligationRepository.getByMOOEId(mooeId);
    const directObligations = obligations
      .filter(o => !o.prno)
      .reduce((sum, o) => sum + Number(o.amount), 0);

    return Number(mooe.totalFq) - totalPRs - directObligations;
  }

  static async getRemainingPRBalance(prno) {
    const pr = await PRRepository.getByPRNo(prno);
    if (!pr) return 0;

    const obligations = await ObligationRepository.getByPRNo(prno);
    const totalObligated = obligations.reduce((sum, o) => sum + Number(o.amount), 0);

    return Number(pr.amount) - totalObligated;
  }

  static async validatePR(mooeId, requestedAmount) {
    const available = await this.getAvailableAllocation(mooeId);
    return requestedAmount <= available;
  }

  static async validateObligation(sourceType, sourceId, requestedAmount, prno = null) {
    if (prno) {
      const remainingPR = await this.getRemainingPRBalance(prno);
      return requestedAmount <= remainingPR;
    }

    if (sourceType === "MOOE") {
      const available = await this.getAvailableAllocation(sourceId);
      return requestedAmount <= available;
    } else if (sourceType === "PS") {
      const ps = await PSRepository.getById(sourceId);
      if (!ps) return false;

      const obligations = await ObligationRepository.getByPSId(sourceId);
      const totalObligated = obligations.reduce((sum, o) => sum + Number(o.amount), 0);

      return requestedAmount <= (Number(ps.total) - totalObligated);
    }
    return false;
  }
}

module.exports = AllocationEngine;
