const FinancialEngine = require("./FinancialEngine");
const FinancialHealthEngine = require("./FinancialHealthEngine");
const PRRepository = require("../repositories/PRRepository");
const ObligationRepository = require("../repositories/ObligationRepository");
const FiscalYearContext = require("./FiscalYearContext");

class MonitoringEngine {
  static async getOverview(planId) {
    if (!planId) planId = await FiscalYearContext.getActivePlanId();
    const { pool } = require("../config/database");

    const parts = String(planId).split('-');
    const yearPart = parts.find(p => /^20\d{2}$/.test(p));
    const year = yearPart || planId;

    const summary = await FinancialEngine.getExecutiveSummary(planId);

    // Efficiently get counts instead of fetching all records
    const [prStats] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN workflow_status != 'Obligated' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN workflow_status = 'Obligated' THEN 1 ELSE 0 END) as fullyObligated
      FROM pr_so
      WHERE is_deleted = 0 AND YEAR(created_at) = ?
    `, [year]);

    const [obStats] = await pool.query(`
      SELECT COUNT(*) as total FROM obligation WHERE is_deleted = 0 AND YEAR(transaction_date) = ?
    `, [year]);

    const stats = prStats[0] || { total: 0, active: 0, fullyObligated: 0 };

    return {
      totalPRs: stats.total,
      activePRs: stats.active,
      fullyObligatedPRs: stats.fullyObligated,
      totalObligations: obStats[0].total,
      budgetUtilization: summary.utilization,
      remainingAllocation: (summary.balance?.total) || 0,
      fiscalYearHealth: summary.utilization > 70 ? 'CRITICAL' : 'HEALTHY',
      counts: summary.counts
    };
  }

  static async getHierarchicalOverview(planId) {
    if (!planId) planId = await FiscalYearContext.getActivePlanId();
    const { pool } = require("../config/database");

    const parts = String(planId).split('-');
    const yearPart = parts.find(p => /^20\d{2}$/.test(p));
    const year = yearPart || planId;

    // 1. Fetch all records from the view for this year
    const [rows] = await pool.query(
      "SELECT * FROM vw_pap_financial_summary WHERE fiscal_year = ? ORDER BY pap_type_code, pap_des_code",
      [year]
    );

    // 2. Group by pap_type_code for accuracy
    const programMap = new Map();
    let grandPS = 0, grandRLIP = 0, grandMOOE = 0, grandTotal = 0, grandObligated = 0;

    rows.forEach(row => {
      const typeCode = row.pap_type_code || 'Others';
      if (!programMap.has(typeCode)) {
        programMap.set(typeCode, {
          name: row.pap_type || 'Others',
          code: typeCode,
          ps: 0,
          rlip: 0,
          mooe: 0,
          totalAllocation: 0,
          obligated: 0,
          remaining: 0,
          paps: []
        });
      }

      const prog = programMap.get(typeCode);
      const ps = Number(row.ps || 0);
      const rlip = Number(row.rlip || 0);
      const mooe = Number(row.mooe || 0);
      const total = Number(row.total_allocation || 0);
      const oblig = Number(row.obligated || 0);
      const unoblig = Number(row.unobligated || 0);

      // Add to Program totals
      prog.ps += ps;
      prog.rlip += rlip;
      prog.mooe += mooe;
      prog.totalAllocation += total;
      prog.obligated += oblig;
      prog.remaining += unoblig;

      // Add to Grand totals
      grandPS += ps;
      grandRLIP += rlip;
      grandMOOE += mooe;
      grandTotal += total;
      grandObligated += oblig;

      // Add as child PAP
      prog.paps.push({
        code: row.pap_des_code,
        description: row.pap_description || 'Unnamed PAP',
        ps: ps,
        rlip: rlip,
        mooe: mooe,
        total: total,
        obligated: oblig,
        remaining: unoblig,
        utilization: total > 0 ? (oblig / total) * 100 : 0
      });
    });

    // 3. Convert Map to Array and calculate Program utilization
    const programs = Array.from(programMap.values()).map(p => ({
      ...p,
      utilization: p.totalAllocation > 0 ? (p.obligated / p.totalAllocation) * 100 : 0
    }));

    return {
      summary: {
        ps: grandPS,
        rlip: grandRLIP,
        mooe: grandMOOE,
        co: 0,
        grandTotal: grandTotal
      },
      programs,
      health: {
        status: grandTotal > 0 && (grandObligated / grandTotal) > 0.7 ? 'CRITICAL' : 'HEALTHY',
        utilization: grandTotal > 0 ? (grandObligated / grandTotal) * 100 : 0
      }
    };
  }
}

module.exports = MonitoringEngine;
