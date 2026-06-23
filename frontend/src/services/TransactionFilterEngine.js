import { mooeAPI, psAPI } from './api';
import DataNormalizationEngine from '../utils/DataNormalizationEngine';


class TransactionFilterEngine {

  static getAPI(allotmentClass) {
    if (allotmentClass === 'PS') return psAPI;
    return mooeAPI;
  }

  static async getPapTypes(allotmentClass) {
    try {
      const api = this.getAPI(allotmentClass);
      const response = await api.getDistinctValues('pap_type');
      return DataNormalizationEngine.smartDeduplicate(response.data || []);
    } catch (error) {
      console.error(`Error fetching PAP Types for ${allotmentClass}:`, error);
      return [];
    }
  }

  static async getPapDescriptions(allotmentClass, papType) {
    try {
      const api = this.getAPI(allotmentClass);
      // For MOOE, use distinct values with code mapping. For PS, keep original behavior.
      if (allotmentClass === 'MOOE') {
        const response = await api.getDistinctValues('pap_des', { pap_type: papType });
        return response.data || [];
      }

      const response = await api.getAll({ pap_type: papType });
      const records = response.data || [];
      const descriptions = records.map(r => r.pap_des).filter(Boolean);
      return DataNormalizationEngine.smartDeduplicate(descriptions);
    } catch (error) {
      console.error(`Error fetching PAP Descriptions for ${allotmentClass}:`, error);
      return [];
    }
  }

  static async getOffices(allotmentClass, papType, papDes) {
    try {
      if (allotmentClass === 'PS') return [];
      const api = this.getAPI(allotmentClass);

      if (allotmentClass === 'MOOE') {
        const response = await api.getDistinctValues('office', { pap_type: papType, pap_des: papDes });
        return response.data || [];
      }

      const response = await api.getAll({ pap_type: papType, pap_des: papDes });
      const records = response.data || [];
      const offices = records.map(r => r.office).filter(Boolean);
      return DataNormalizationEngine.smartDeduplicate(offices);
    } catch (error) {
      console.error(`Error fetching Offices for ${allotmentClass}:`, error);
      return [];
    }
  }

  static async getMOOE(allotmentClass, filters) {
    try {
      if (allotmentClass === 'PS') return [];

      const api = this.getAPI(allotmentClass);
      const response = await api.getAll(filters);
      const records = response.data || [];

      // Clean names in records
      return records.map(r => ({
        ...r,
        name: DataNormalizationEngine.cleanLabel(r.name)
      }));
    } catch (error) {
      console.error(`Error fetching MOOE for ${allotmentClass}:`, error);
      return [];
    }
  }

  static async getExpenseItems(allotmentClass, filters) {
    try {
      const api = this.getAPI(allotmentClass);
      const response = await api.getAll(filters);
      const records = response.data || [];
      const items = records.map(r => DataNormalizationEngine.cleanLabel(r.expense_items)).filter(Boolean);
      return DataNormalizationEngine.smartDeduplicate(items);
    } catch (error) {
      console.error(`Error fetching Expense Items for ${allotmentClass}:`, error);
      return [];
    }
  }

  static async getExpenseSubItems(allotmentClass, filters) {
    try {
      const api = this.getAPI(allotmentClass);
      const response = await api.getAll(filters);
      const records = response.data || [];
      const items = records.map(r => DataNormalizationEngine.cleanLabel(r.expense_items_sub)).filter(Boolean);
      return DataNormalizationEngine.smartDeduplicate(items);
    } catch (error) {
      console.error(`Error fetching Expense Sub Items for ${allotmentClass}:`, error);
      return [];
    }
  }

  /**
   * getAvailableAllocation
   * Centralized logic for determining budget availability based on source table.
   */
  static async getAvailableAllocation({ allotmentClass, papType, papDes, office, mooeId }) {
    try {
      const api = this.getAPI(allotmentClass);

      if (allotmentClass === 'PS') {
        // PS: SUM(ps.amount) grouped by PAP
        if (!papDes) return 0;
        const response = await api.getAll({ pap_type: papType, pap_des: papDes });
        const records = response.data || [];
        // Summing from ps table: usually uses 'amount' or 'allocation' field
        return records.reduce((sum, r) => sum + (parseFloat(r.amount) || parseFloat(r.allocation) || 0), 0);
      }

      if (allotmentClass === 'MOOE' || allotmentClass === 'CO') {
        // MOOE/CO: Use mooe table
        if (!mooeId) return 0;
        const response = await api.getById(mooeId);
        const data = response.data;

        if (!data) return 0;

        // Use availableAllocation from BalanceEngine via the API
        if (allotmentClass === 'MOOE') return parseFloat(data.availableAllocation) ?? parseFloat(data.totalFq) ?? 0;
        if (allotmentClass === 'CO') return parseFloat(data.total_co_amount) || parseFloat(data.co?.allocation) || 0;
      }

      return 0;
    } catch (error) {
      console.error(`Error fetching Available Allocation for ${allotmentClass}:`, error);
      return 0;
    }
  }
}

export default TransactionFilterEngine;
