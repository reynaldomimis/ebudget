const MOOERepository = require("../repositories/MOOERepository");
const PSRepository = require("../repositories/PSRepository");
const PRRepository = require("../repositories/PRRepository");
const ObligationRepository = require("../repositories/ObligationRepository");
const FiscalYearContext = require("./FiscalYearContext");
const { pool } = require("../config/database");

class FinancialEngine {
  static async getPapDescriptionSummary(plan_id) {
    let year;
    if (plan_id) {
      const parts = String(plan_id).split('-');
      const yearPart = parts.find(p => /^20\d{2}$/.test(p));
      year = yearPart || plan_id;
    } else {
      year = await FiscalYearContext.getActiveYear();
    }

    const [rows] = await pool.query(
      "SELECT * FROM vw_pap_financial_summary WHERE fiscal_year = ? ORDER BY pap_type_code, pap_des_code",
      [year]
    );

    return rows.map(r => ({
      pap_des: r.pap_description,
      type: r.pap_type,
      code: r.pap_des_code,
      ps: Number(r.ps || 0),
      rlip: Number(r.rlip || 0),
      mooe: Number(r.mooe || 0),
      co: 0,
      total: Number(r.total_allocation || 0),
      obligated: Number(r.obligated || 0),
      balance: Number(r.unobligated || 0),
      utilization: r.total_allocation > 0 ? (Number(r.obligated || 0) / Number(r.total_allocation)) * 100 : 0
    }));
  }

  static async getExecutiveSummary(plan_id) {
    // Resolve fiscal year from plan_id or use current
    let year;
    if (plan_id) {
      const parts = String(plan_id).split('-');
      // Try to find a part that looks like a year
      const yearPart = parts.find(p => /^20\d{2}$/.test(p));
      year = yearPart || plan_id;
    } else {
      year = await FiscalYearContext.getActiveYear();
    }

    // 1. Get Program Level Totals
    const [programRows] = await pool.query(
      "SELECT * FROM vw_program_financial_summary WHERE fiscal_year = ?",
      [year]
    );

    // 2. Get PAP Level Composition
    const [papRows] = await pool.query(
      "SELECT * FROM vw_pap_financial_summary WHERE fiscal_year = ? ORDER BY pap_type_code, pap_des_code",
      [year]
    );

    // 3. Get Workflow Counts (Filtered by Year)
    const [countRows] = await pool.query(`
      SELECT
        SUM(CASE WHEN workflow_status = 'Draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN workflow_status = 'For Review' THEN 1 ELSE 0 END) as forReview,
        SUM(CASE WHEN workflow_status = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN workflow_status = 'Partially Obligated' THEN 1 ELSE 0 END) as partiallyObligated,
        SUM(CASE WHEN workflow_status = 'Obligated' THEN 1 ELSE 0 END) as obligated,
        SUM(CASE WHEN workflow_status = 'Rejected' THEN 1 ELSE 0 END) as rejected
      FROM vw_pr_details
      WHERE fiscal_year = ?
    `, [year]);

    const totals = programRows.reduce((acc, row) => {
      acc.psTotal += Number(row.total_ps || 0);
      acc.rlipTotal += Number(row.total_rlip || 0);
      acc.mooeTotal += Number(row.total_mooe || 0);
      acc.grandTotal += Number(row.grand_total_allocation || 0);
      acc.obligatedTotal += Number(row.total_obligated || 0);
      return acc;
    }, { psTotal: 0, rlipTotal: 0, mooeTotal: 0, grandTotal: 0, obligatedTotal: 0 });

    const counts = countRows[0] || { draft: 0, forReview: 0, approved: 0, partiallyObligated: 0, obligated: 0, rejected: 0 };

    return {
      ps: totals.psTotal,
      rlip: totals.rlipTotal,
      psTotal: totals.psTotal,
      rlipTotal: totals.rlipTotal,
      personnelTotal: totals.psTotal + totals.rlipTotal,
      mooe: totals.mooeTotal,
      grandTotal: totals.grandTotal,
      papComposition: papRows.map(r => ({
        pap_des: r.pap_description,
        pap_code: r.pap_des_code,
        type: r.pap_type,
        type_code: r.pap_type_code,
        ps: Number(r.ps || 0),
        rlip: Number(r.rlip || 0),
        mooe: Number(r.mooe || 0),
        co: 0,
        total: Number(r.total_allocation || 0),
        obligated: Number(r.obligated || 0),
        balance: Number(r.unobligated || 0)
      })),
      obligated: { total: totals.obligatedTotal },
      balance: { total: totals.grandTotal - totals.obligatedTotal },
      counts: {
        draft: Number(counts.draft || 0),
        forReview: Number(counts.forReview || 0),
        approved: Number(counts.approved || 0),
        partiallyObligated: Number(counts.partiallyObligated || 0),
        obligated: Number(counts.obligated || 0),
        rejected: Number(counts.rejected || 0),
      },
      utilization: totals.grandTotal > 0 ? (totals.obligatedTotal / totals.grandTotal) * 100 : 0
    };
  }

  static async getPapSummary(plan_id) {
    return await this.getPapDescriptionSummary(plan_id);
  }

  static async getPapDetail(plan_id, pap_type, pap_des) {
    if (!plan_id) plan_id = await FiscalYearContext.getActivePlanId();
    const all = await this.getPapDescriptionSummary(plan_id);
    const pap = all.find(p => p.pap_des === pap_des);

    const [mooeItems] = await pool.query("SELECT * FROM vw_mooe_excel_full_report WHERE (plan_id = ? OR plan_year = ?) AND pap_des = ?", [plan_id, plan_id, pap_des]);
    const [psRecords] = await pool.query("SELECT * FROM vw_ps_details WHERE (plan_id = ? OR fiscal_year = ?) AND pap_des = ?", [plan_id, plan_id, pap_des]);
    const [allObligations] = await pool.query("SELECT * FROM vw_obligation_details");
    const [allPRs] = await pool.query("SELECT * FROM vw_pr_details");

    const mooeIds = mooeItems.map(m => m.id);
    const psIds = psRecords.map(p => p.id);
    const papObligations = allObligations.filter(o => (o.allotment_class === 'MOOE' && mooeIds.includes(o.id)) || (o.allotment_class === 'PS' && psIds.includes(o.id)));

    const offices = ["AD", "OED", "NPPD", "NSD", "NIED", "FMD"];
    const officeBreakdown = offices.map(off => {
      const offMOOE = mooeItems.filter(m => m.office === off);
      const alloc = offMOOE.reduce((sum, m) => sum + Number(m.total_amount), 0);
      const offMooeIds = offMOOE.map(m => m.id);
      const oblig = papObligations.filter(o => o.allotment_class === 'MOOE' && offMooeIds.includes(o.id)).reduce((sum, o) => sum + Number(o.amount), 0);
      return { office: off, allocation: alloc, obligated: oblig, balance: alloc - oblig, utilization: alloc > 0 ? (oblig / alloc) * 100 : 0 };
    });

    return {
      summary: {
        allocation: pap ? pap.total : 0,
        ps: pap ? pap.ps : 0,
        rlip: pap ? pap.rlip : 0,
        mooe: pap ? pap.mooe : 0,
        obligated: pap ? pap.obligated : 0,
        balance: pap ? pap.balance : 0,
        utilization: pap ? pap.utilization : 0
      },
      officeBreakdown,
      prs: allPRs.filter(p => p.mooe_id && mooeIds.includes(p.mooe_id) && ['Approved', 'Partially Obligated', 'Obligated'].includes(p.workflow_status)),
      obligations: papObligations,
      psRecords: psRecords
    };
  }

  static async getBudgetRegistry(plan_id) {
    if (!plan_id) plan_id = await FiscalYearContext.getActivePlanId();
    const [mooeItems] = await pool.query("SELECT * FROM vw_mooe_excel_full_report WHERE plan_id = ? OR plan_year = ?", [plan_id, plan_id]);
    const [psRecords] = await pool.query("SELECT * FROM vw_ps_details WHERE plan_id = ? OR fiscal_year = ?", [plan_id, plan_id]);
    const [allPRs] = await pool.query("SELECT * FROM vw_pr_details");
    const [allObligations] = await pool.query("SELECT * FROM vw_obligation_details");
    const registry = [];

    for (const item of mooeItems) {
      if (item.row_type === 'SUBTOTAL') continue;
      const prs = allPRs.filter(p => p.mooe_id === item.id);
      const prSummaries = prs.map(pr => {
        const obligations = allObligations.filter(o => o.prno === pr.prno);
        const obligated = obligations.reduce((sum, o) => sum + Number(o.amount), 0);
        return { ...pr, obligated_amount: obligated, remaining_amount: Number(pr.pr_amount) - obligated };
      });
      const directObligations = allObligations.filter(o => o.allotment_class === 'MOOE' && o.id === item.id && !o.prno);
      const totalObligated = prSummaries.reduce((sum, p) => sum + p.obligated_amount, 0) + directObligations.reduce((sum, o) => sum + Number(o.amount), 0);
      registry.push({ ...item, allotment_class: 'MOOE', prs: prSummaries, directObligations, totalObligated, remainingBalance: Number(item.total_amount) - totalObligated });
    }

    for (const record of psRecords) {
      const directObligations = allObligations.filter(o => o.allotment_class === 'PS' && o.id === record.id);
      const totalObligated = directObligations.reduce((sum, o) => sum + Number(o.amount), 0);
      registry.push({ ...record, allotment_class: 'PS', prs: [], directObligations, totalObligated, remainingBalance: Number(record.amount) - totalObligated });
    }
    return registry;
  }
}

module.exports = FinancialEngine;
