import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useFiscalYear } from './FiscalYearContext';
import { financialAPI, dashboardAPI } from '../services/api';

const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
  const { selectedYear } = useFiscalYear();
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [papSummary, setPapSummary] = useState([]);
  const [auditFeed, setAuditFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshBudgetData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [execResponse, papResponse, auditResponse] = await Promise.all([
        dashboardAPI.getExecutiveSummary(selectedYear),
        financialAPI.getPapSummary(selectedYear),
        dashboardAPI.getAuditFeed()
      ]);

      if (execResponse.success) setExecutiveSummary(execResponse.data);
      if (papResponse.success) setPapSummary(papResponse.data);
      if (auditResponse.success) setAuditFeed(auditResponse.data);
    } catch (err) {
      console.error("Failed to fetch budget data:", err);
      setError(err.message || "Failed to load budget data");
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    refreshBudgetData();
  }, [refreshBudgetData]);

  const value = {
    executiveSummary,
    papSummary,
    auditFeed,
    loading,
    error,
    refreshBudgetData
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};
