const MOOERepository = require("../repositories/MOOERepository");
const PSRepository = require("../repositories/PSRepository");
const PRRepository = require("../repositories/PRRepository");
const ObligationRepository = require("../repositories/ObligationRepository");
const FiscalYearContext = require("./FiscalYearContext");

class FinancialEngine {
  /**
   * RULE: CENTRALIZED AGGREGATION BY PAP DESCRIPTION
   */
  static async getPapDescriptionSummary(plan_id) {
    if (!plan_id) plan_id = await FiscalYearContext.getActivePlanId();

    const mooeItems = (await MOOERepository.getByPlan(plan_id)) || [];
    const psRecords = (await PSRepository.getAll({ plan_id })) || [];
    const rlipRecords = (await PSRepository.getRLIPByPlanId(plan_id)) || [];
    const allObligations = (await ObligationRepository.getAll()) || [];

    const summaryMap = {};
    const normalize = (s) => (s || "").trim();

    // Collect all valid PAP Descriptions from all allotment classes
    const allPapDes = [...new Set([
        ...mooeItems.map(m => normalize(m.pap_des)),
        ...psRecords.map(p => normalize(p.pap_des)),
        ...rlipRecords.map(r => normalize(r.pap_des))
    ])].filter(Boolean);

    allPapDes.forEach(des => {
        const mooeMatch = mooeItems.find(m => normalize(m.pap_des) === des);
        const psMatch = psRecords.find(p => normalize(p.pap_des) === des);
        const rlipMatch = rlipRecords.find(r => normalize(r.pap_des) === des);

        const type = (mooeMatch?.pap_type || psMatch?.pap_type || "Unknown").trim();
        const code = mooeMatch?.pap_des_code || psMatch?.pap_des_code || rlipMatch?.pap_des_code || "";
        const sortOrder = mooeMatch?.sort_order ?? 9999;

        // SEPARATION RULE: PS from PS table, RLIP from RLIP table
        const psBase = psRecords
            .filter(p => normalize(p.pap_des) === des && p.cost_category === "PS")
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        const rlipAmount = rlipRecords
            .filter(r => normalize(r.pap_des) === des)
            .reduce((sum, r) => sum + Number(r.amount || 0), 0);

        const mooeAlloc = mooeItems
            .filter(m => normalize(m.pap_des) === des && !m.is_subtotal)
            .reduce((sum, m) => sum + Number(m.totalFq || 0), 0);

        summaryMap[des] = {
            pap_des: des,
            type: type,
            code: code,
            sortOrder: sortOrder,
            ps: psBase,
            rlip: rlipAmount,
            mooe: mooeAlloc,
            co: 0,
            total: psBase + rlipAmount + mooeAlloc,
            obligated: 0,
            balance: 0,
            utilization: 0
        };
    });

    return Object.values(summaryMap).sort((a, b) => {
        if (a.type !== b.type) {
            const order = { "GENERAL ADMINISTRATION AND SUPPORT": 1, "NATIONAL NUTRITION MANAGEMENT PROGRAM": 2 };
            return (order[a.type] || 99) - (order[b.type] || 99);
        }
        return a.sortOrder - b.sortOrder;
    });
  }

  static async getExecutiveSummary(plan_id) {
    if (!plan_id) plan_id = await FiscalYearContext.getActivePlanId();

    const psRecords = (await PSRepository.getAll({ plan_id })) || [];
    const rlipRecords = (await PSRepository.getRLIPByPlanId(plan_id)) || [];
    const mooeItems = (await MOOERepository.getByPlan(plan_id)) || [];
    const allPRs = (await PRRepository.getAll()) || [];
    const allObligations = (await ObligationRepository.getAll()) || [];

    // Aggregate PS separately
    const psRowsRaw = psRecords.filter(r => r.cost_category === 'PS');

    const aggregateByDes = (records) => {
        const map = {};
        records.forEach(r => {
            const des = (r.pap_des || "").trim();
            if (!map[des]) map[des] = { pap_des: des, amount: 0, sort_order: r.sort_order || 999 };
            map[des].amount += Number(r.amount || 0);
        });
        return Object.values(map).sort((a, b) => a.sort_order - b.sort_order);
    };

    const psRows = aggregateByDes(psRowsRaw);
    const rlipRows = aggregateByDes(rlipRecords);

    const psTotal = psRows.reduce((sum, r) => sum + r.amount, 0);
    const rlipTotal = rlipRows.reduce((sum, r) => sum + r.amount, 0);
    const personnelTotal = psTotal + rlipTotal;

    const mooeTotal = mooeItems.filter(m => !m.is_subtotal).reduce((sum, m) => sum + Number(m.totalFq || 0), 0);
    const grandTotal = personnelTotal + mooeTotal;

    // Build papComposition
    const papCompositionMap = {};
    const normalize = (s) => (s || "").trim();

    psRecords.filter(r => r.cost_category === 'PS').forEach(item => {
        const des = normalize(item.pap_des);
        if (!des) return;
        if (!papCompositionMap[des]) papCompositionMap[des] = { pap_des: des, ps: 0, rlip: 0, mooe: 0, co: 0, total: 0 };
        papCompositionMap[des].ps += Number(item.amount || 0);
    });

    rlipRecords.forEach(item => {
        const des = normalize(item.pap_des);
        if (!des) return;
        if (!papCompositionMap[des]) papCompositionMap[des] = { pap_des: des, ps: 0, rlip: 0, mooe: 0, co: 0, total: 0 };
        papCompositionMap[des].rlip += Number(item.amount || 0);
    });

    mooeItems.filter(m => !m.is_subtotal).forEach(item => {
        const des = normalize(item.pap_des);
        if (!des) return;
        if (!papCompositionMap[des]) papCompositionMap[des] = { pap_des: des, ps: 0, rlip: 0, mooe: 0, co: 0, total: 0 };
        papCompositionMap[des].mooe += Number(item.totalFq || 0);
    });

    Object.values(papCompositionMap).forEach(v => {
        v.total = v.ps + v.rlip + v.mooe + v.co;
    });

    return {
      psRows,
      psTotal,
      rlipRows,
      rlipTotal,
      personnelTotal,
      mooe: mooeTotal,
      grandTotal,
      papComposition: Object.values(papCompositionMap),
      obligated: { total: allObligations.reduce((sum, o) => sum + Number(o.amount || 0), 0) },
      balance: { total: grandTotal - allObligations.reduce((sum, o) => sum + Number(o.amount || 0), 0) },
      counts: {
        forReview: allPRs.filter(p => p.workflow_status === 'For Review').length,
        approved: allPRs.filter(p => p.workflow_status === 'Approved').length,
        partiallyObligated: allPRs.filter(p => p.workflow_status === 'Partially Obligated').length,
        obligated: allPRs.filter(p => p.workflow_status === 'Obligated').length,
      },
      utilization: grandTotal > 0 ? (allObligations.reduce((sum, o) => sum + Number(o.amount || 0), 0) / grandTotal) * 100 : 0
    };
  }

  static async getPapSummary(plan_id) {
    return await this.getPapDescriptionSummary(plan_id);
  }

  static async getPapDetail(plan_id, pap_type, pap_des) {
    if (!plan_id) plan_id = await FiscalYearContext.getActivePlanId();
    const all = await this.getPapDescriptionSummary(plan_id);
    const pap = all.find(p => p.pap_des === pap_des);

    const mooeItems = (await MOOERepository.getByPlan(plan_id, { pap_des })) || [];
    const psRecords = (await PSRepository.getAll({ plan_id, pap_des })) || [];
    const allObligations = (await ObligationRepository.getAll()) || [];
    const allPRs = (await PRRepository.getAll()) || [];

    const mooeIds = mooeItems.map(m => m.id);
    const psIds = psRecords.map(p => p.id);
    const papObligations = allObligations.filter(o => (o.mooe_id && mooeIds.includes(o.mooe_id)) || (o.ps_id && psIds.includes(o.ps_id)));

    const offices = ["AD", "OED", "NPPD", "NSD", "NIED", "FMD"];
    const officeBreakdown = offices.map(off => {
      const offMOOE = mooeItems.filter(m => m.office === off);
      const alloc = offMOOE.reduce((sum, m) => sum + Number(m.totalFq), 0);
      const offMooeIds = offMOOE.map(m => m.id);
      const oblig = papObligations.filter(o => o.mooe_id && offMooeIds.includes(o.mooe_id)).reduce((sum, o) => sum + Number(o.amount), 0);
      return { office: off, allocation: alloc, obligated: oblig, balance: alloc - oblig, utilization: alloc > 0 ? (oblig / alloc) * 100 : 0 };
    });

    return {
      summary: {
        allocation: pap.total,
        ps: pap.ps,
        rlip: pap.rlip,
        mooe: pap.mooe,
        obligated: pap.obligated,
        balance: pap.balance,
        utilization: pap.utilization
      },
      officeBreakdown,
      prs: allPRs.filter(p => p.mooe_id && mooeIds.includes(p.mooe_id) && ['Approved', 'Partially Obligated', 'Obligated'].includes(p.workflow_status)),
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

    for (const item of mooeItems) {
      if (item.is_subtotal) continue;
      const prs = allPRs.filter(p => p.mooe_id === item.id);
      const prSummaries = prs.map(pr => {
        const obligations = allObligations.filter(o => o.prno === pr.prno);
        const obligated = obligations.reduce((sum, o) => sum + Number(o.amount), 0);
        return { ...pr, obligated_amount: obligated, remaining_amount: Number(pr.amount) - obligated };
      });
      const directObligations = allObligations.filter(o => o.mooe_id === item.id && !o.prno);
      const totalObligated = prSummaries.reduce((sum, p) => sum + p.obligated_amount, 0) + directObligations.reduce((sum, o) => sum + Number(o.amount), 0);
      registry.push({ ...item, allotment_class: 'MOOE', prs: prSummaries, directObligations, totalObligated, remainingBalance: Number(item.totalFq) - totalObligated });
    }

    for (const record of psRecords) {
      const directObligations = allObligations.filter(o => o.ps_id === record.id);
      const totalObligated = directObligations.reduce((sum, o) => sum + Number(o.amount), 0);
      registry.push({ ...record, allotment_class: 'PS', prs: [], directObligations, totalObligated, remainingBalance: Number(record.amount) - totalObligated });
    }
    return registry;
  }
}

module.exports = FinancialEngine;
