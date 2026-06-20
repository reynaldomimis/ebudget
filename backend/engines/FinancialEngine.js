const MOOERepository = require("../repositories/MOOERepository");
const PSRepository = require("../repositories/PSRepository");
const PRRepository = require("../repositories/PRRepository");
const ObligationRepository = require("../repositories/ObligationRepository");
const FiscalYearContext = require("./FiscalYearContext");

class FinancialEngine {
  /**
   * RULE 6: CENTRALIZED AGGREGATION SERVICE
   * Returns summary grouped by PAP DESCRIPTION (pap_des)
   * Consumed by Rule 2, 4, 5
   */
  static async getPapDescriptionSummary(plan_id) {
    if (!plan_id) plan_id = await FiscalYearContext.getActivePlanId();

    const mooeItems = (await MOOERepository.getByPlan(plan_id)) || [];
    const psRecords = (await PSRepository.getAll({ plan_id })) || [];
    const allObligations = (await ObligationRepository.getAll()) || [];

    const summaryMap = {};

    // 1. Collect all unique pap_des (Normalized)
    const normalize = (s) => (s || "").trim();
    const isRLIPRow = (des) => des.toUpperCase().includes("RETIREMENT AND LIFE INSURANCE PREMIUMS") || des.toUpperCase().includes("(RLIP)");

    // Get legitimate PAP descriptions only (Rule 1: Remove Fake RLIP Row)
    const allPapDes = [...new Set([
        ...mooeItems.map(m => normalize(m.pap_des)),
        ...psRecords.filter(p => !isRLIPRow(normalize(p.pap_des))).map(p => normalize(p.pap_des))
    ])].filter(Boolean);

    allPapDes.forEach(des => {
        // Metadata resolve (Inherit pap_type and code from MOOE or PS)
        const mooeMatch = mooeItems.find(m => normalize(m.pap_des) === des);
        const psMatch = psRecords.find(p => normalize(p.pap_des) === des && !isRLIPRow(normalize(p.pap_des)));

        const type = (mooeMatch?.pap_type || psMatch?.pap_type || "Unknown").trim();
        const code = mooeMatch?.pap_des_code || psMatch?.pap_des_code || "";
        const sortOrder = mooeMatch?.sort_order || 9999;

        // PS & RLIP (Rule: Merge RLIP into target PAP)
        const psForDes = psRecords.filter(p => normalize(p.pap_des) === des);
        // Also look for RLIP records where expense_items matches this description (Fallback mapping)
        const rlipMatches = psRecords.filter(p => isRLIPRow(normalize(p.pap_des)) && normalize(p.expense_items) === des);

        const psAmount = psForDes
            .filter(p => p.cost_category === "PS")
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        const rlipAmount = [...psForDes.filter(p => p.cost_category === "RLIP"), ...rlipMatches]
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        // MOOE
        const mooeAlloc = mooeItems
            .filter(m => normalize(m.pap_des) === des && !m.is_subtotal)
            .reduce((sum, m) => sum + Number(m.totalFq || 0), 0);

        // Obligations
        const mooeRowIds = mooeItems.filter(m => normalize(m.pap_des) === des).map(m => m.id);
        const psRowIds = [...psForDes, ...rlipMatches].map(p => p.id);

        const obligated = allObligations
            .filter(o => (o.mooe_id && mooeRowIds.includes(o.mooe_id)) || (o.ps_id && psRowIds.includes(o.ps_id)))
            .reduce((sum, o) => sum + Number(o.amount || 0), 0);

        summaryMap[des] = {
            name: des,
            type: type,
            code: code,
            sortOrder: sortOrder,
            ps: psAmount,
            rlip: rlipAmount,
            mooe: mooeAlloc,
            co: 0,
            totalAllocation: psAmount + rlipAmount + mooeAlloc,
            obligated: obligated,
            balance: (psAmount + rlipAmount + mooeAlloc) - obligated,
            utilization: (psAmount + rlipAmount + mooeAlloc) > 0
                ? (obligated / (psAmount + rlipAmount + mooeAlloc)) * 100 : 0
        };
    });

    // BUG #4: Correct Ordering (Excel-based)
    return Object.values(summaryMap).sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.sortOrder - b.sortOrder || a.code.localeCompare(b.code);
    });
  }

  /**
   * RULE 1: PAP TYPE LEVEL
   * High-level summary where RLIP is integrated into PS
   */
  static async getPapTypeSummary(plan_id) {
    const desSummary = await this.getPapDescriptionSummary(plan_id);
    const typeMap = {};

    desSummary.forEach(item => {
        if (!typeMap[item.type]) {
            typeMap[item.type] = { type: item.type, ps: 0, mooe: 0, co: 0, total: 0 };
        }
        // Rule 1: RLIP MUST NOT be displayed separately (Integrated into PS)
        typeMap[item.type].ps += (item.ps + item.rlip);
        typeMap[item.type].mooe += item.mooe;
        typeMap[item.type].co += item.co;
        typeMap[item.type].total += item.totalAllocation;
    });

    return Object.values(typeMap);
  }

  static async getExecutiveSummary(plan_id) {
    if (!plan_id) plan_id = await FiscalYearContext.getActivePlanId();

    const desSummary = await this.getPapDescriptionSummary(plan_id);
    const allPRs = (await PRRepository.getAll()) || [];

    const totalPS = desSummary.reduce((sum, i) => sum + i.ps, 0);
    const totalRLIP = desSummary.reduce((sum, i) => sum + i.rlip, 0);
    const totalMOOE = desSummary.reduce((sum, i) => sum + i.mooe, 0);
    const totalCO = desSummary.reduce((sum, i) => sum + i.co, 0);
    const totalObligated = desSummary.reduce((sum, i) => sum + i.obligated, 0);
    const grandTotal = totalPS + totalRLIP + totalMOOE + totalCO;

    // Build typeSummary based on Rule 1
    const typeSummaryData = await this.getPapTypeSummary(plan_id);
    const typeSummary = {};
    typeSummaryData.forEach(t => {
        typeSummary[t.type] = {
            ps: t.ps, // This is combined PS+RLIP per Rule 1
            mooe: t.mooe,
            total: t.total
        };
    });

    // Build papComposition based on Rule 2 (Preserve Array for Sorting)
    const papComposition = desSummary.map(d => ({
        pap_des: d.name,
        ps: d.ps,
        rlip: d.rlip,
        mooe: d.mooe,
        co: d.co,
        total: d.totalAllocation
    }));

    return {
      ps: totalPS,
      rlip: totalRLIP,
      personnelTotal: totalPS + totalRLIP,
      mooe: totalMOOE,
      co: totalCO,
      grandTotal: grandTotal,
      typeSummary,
      papComposition,
      obligated: {
        total: totalObligated
      },
      balance: {
        total: grandTotal - totalObligated
      },
      counts: {
        forReview: allPRs.filter(p => p.workflow_status === 'For Review').length,
        approved: allPRs.filter(p => p.workflow_status === 'Approved').length,
        partiallyObligated: allPRs.filter(p => p.workflow_status === 'Partially Obligated').length,
        obligated: allPRs.filter(p => p.workflow_status === 'Obligated').length,
      },
      utilization: grandTotal > 0 ? (totalObligated / grandTotal) * 100 : 0
    };
  }

  // Refactor getPapSummary to use the centralized engine
  static async getPapSummary(plan_id) {
    return await this.getPapDescriptionSummary(plan_id);
  }

  static async getPapDetail(plan_id, pap_type, pap_des) {
    if (!plan_id) plan_id = await FiscalYearContext.getActivePlanId();

    const mooeItems = (await MOOERepository.getByPlan(plan_id, { pap_type, pap_des })) || [];
    const psRecords = (await PSRepository.getAll({ plan_id, pap_type, pap_des })) || [];

    const mooeIds = mooeItems.map(m => m.id);
    const psIds = psRecords.map(p => p.id);

    const allObligations = (await ObligationRepository.getAll()) || [];
    const papObligations = allObligations.filter(o =>
      (o.mooe_id && mooeIds.includes(o.mooe_id)) ||
      (o.ps_id && psIds.includes(o.ps_id))
    );

    const allPRs = (await PRRepository.getAll()) || [];
    const papPRs = allPRs.filter(p => p.mooe_id && mooeIds.includes(p.mooe_id));

    // Summary
    const totalPS = psRecords.filter(p => p.cost_category === "PS").reduce((sum, p) => sum + Number(p.amount), 0);
    const totalRLIP = psRecords.filter(p => p.cost_category === "RLIP").reduce((sum, p) => sum + Number(p.amount), 0);
    const totalMOOE = mooeItems.reduce((sum, m) => sum + Number(m.totalFq), 0);
    const totalAlloc = totalPS + totalRLIP + totalMOOE;
    const totalOblig = papObligations.reduce((sum, o) => sum + Number(o.amount), 0);

    // Office Breakdown
    const offices = ["AD", "OED", "NPPD", "NSD", "NIED", "FMD"];
    const officeBreakdown = offices.map(off => {
      const offMOOE = mooeItems.filter(m => m.office === off);
      const alloc = offMOOE.reduce((sum, m) => sum + Number(m.totalFq), 0);
      const offMooeIds = offMOOE.map(m => m.id);
      const oblig = papObligations.filter(o => (o.mooe_id && offMooeIds.includes(o.mooe_id))).reduce((sum, o) => sum + Number(o.amount), 0);

      return {
        office: off,
        allocation: alloc,
        obligated: oblig,
        balance: alloc - oblig,
        utilization: alloc > 0 ? (oblig / alloc) * 100 : 0
      };
    });

    return {
      summary: {
        allocation: totalAlloc,
        ps: totalPS,
        rlip: totalRLIP,
        mooe: totalMOOE,
        obligated: totalOblig,
        balance: totalAlloc - totalOblig,
        utilization: totalAlloc > 0 ? (totalOblig / totalAlloc) * 100 : 0
      },
      officeBreakdown,
      prs: papPRs.filter(p => ['Approved', 'Partially Obligated', 'Obligated'].includes(p.workflow_status)),
      obligations: papObligations
    };
  }

  static async getBudgetRegistry(plan_id) {
    if (!plan_id) plan_id = await FiscalYearContext.getActivePlanId();

    const mooeItems = (await MOOERepository.getByPlan(plan_id)) || [];
    const psRecords = (await PSRepository.getAll({ plan_id })) || [];
    const allPRs = (await PRRepository.getAll()) || [];
    const allObligations = (await ObligationRepository.getAll()) || [];

    const registry = [];

    // MOOE Registry
    for (const item of mooeItems) {
      if (item.is_subtotal) continue;

      const prs = allPRs.filter(p => p.mooe_id === item.id);
      const prSummaries = prs.map(pr => {
        const obligations = allObligations.filter(o => o.prno === pr.prno);
        const obligated = obligations.reduce((sum, o) => sum + Number(o.amount), 0);
        return {
          ...pr,
          obligated_amount: obligated,
          remaining_amount: Number(pr.amount) - obligated
        };
      });

      const directObligations = allObligations.filter(o => o.mooe_id === item.id && !o.prno);
      const totalObligated = prSummaries.reduce((sum, p) => sum + p.obligated_amount, 0) +
                            directObligations.reduce((sum, o) => sum + Number(o.amount), 0);

      registry.push({
        ...item,
        allotment_class: 'MOOE',
        prs: prSummaries,
        directObligations,
        totalObligated,
        remainingBalance: Number(item.totalFq) - totalObligated
      });
    }

    // PS Registry
    for (const record of psRecords) {
      const directObligations = allObligations.filter(o => o.ps_id === record.id);
      const totalObligated = directObligations.reduce((sum, o) => sum + Number(o.amount), 0);

      registry.push({
        ...record,
        allotment_class: 'PS',
        prs: [],
        directObligations,
        totalObligated,
        remainingBalance: Number(record.amount) - totalObligated
      });
    }

    return registry;
  }
}

module.exports = FinancialEngine;
