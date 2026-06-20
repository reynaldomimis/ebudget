const { pool } = require("../config/database");

class SequenceEngine {
  static async getNextPRNo(year, month) {
    const query = `SELECT MAX(prno) as latest_prno FROM pr_so`;
    const [rows] = await pool.execute(query);
    const latestPrNo = rows[0]?.latest_prno;

    let nextSeq = 1;
    if (latestPrNo) {
      const match = latestPrNo.match(/-(\d{3})$/);
      if (match) {
        nextSeq = parseInt(match[1], 10) + 1;
      }
    }

    const paddedSeq = String(nextSeq).padStart(3, "0");
    return `PR-${year}-${month}-${paddedSeq}`;
  }

  static async getNextOBRNo(year, month) {
    const query = `SELECT MAX(obrno) as latest_obrno FROM obligation`;
    const [rows] = await pool.execute(query);
    const latestObrNo = rows[0]?.latest_obrno;

    let nextSeq = 1;
    if (latestObrNo) {
      const match = latestObrNo.match(/-(\d{3})$/);
      if (match) {
        nextSeq = parseInt(match[1], 10) + 1;
      }
    }

    const paddedSeq = String(nextSeq).padStart(3, "0");
    return `OBR-${year}-${month}-${paddedSeq}`;
  }
}

module.exports = SequenceEngine;
