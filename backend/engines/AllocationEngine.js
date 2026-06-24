const BalanceEngine = require("./BalanceEngine");

/**
 * @deprecated Use BalanceEngine instead. This class is maintained for legacy compatibility
 * but now strictly uses Views through BalanceEngine.
 */
class AllocationEngine {
  static async getAvailableAllocation(mooeId) {
    return await BalanceEngine.getAvailableAllocation(mooeId);
  }

  static async getRemainingPRBalance(prno) {
    return await BalanceEngine.getPRBalance(prno);
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
      const available = await BalanceEngine.getPSBalance(sourceId);
      return requestedAmount <= available;
    }
    return false;
  }
}

module.exports = AllocationEngine;
