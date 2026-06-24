import { mooeAPI, psAPI, financialAPI } from './api';
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
  static async getAvailableAllocation({ allotmentClass, mooeId }) {
    try {
      if (!mooeId) return 0;

      // Use the centralized balance API
      const response = await financialAPI.getBalance(mooeId, allotmentClass);

      if (response.success) {
        return parseFloat(response.data.balance) || 0;
      }

      return 0;
    } catch (error) {
      console.error(`Error fetching Available Allocation for ${allotmentClass}:`, error);
      return 0;
    }
  }
}

export default TransactionFilterEngine;
