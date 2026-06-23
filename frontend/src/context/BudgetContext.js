import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useFiscalYear } from './FiscalYearContext';
import { financialAPI, dashboardAPI, monitoringAPI } from '../services/api';

const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
  const { selectedYear } = useFiscalYear();
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [papSummary, setPapSummary] = useState([]);
  const [monitoringOverview, setMonitoringOverview] = useState(null);
  const [auditFeed, setAuditFeed] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshBudgetData = useCallback(async () => {
    if (!selectedYear) return;

    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        dashboardAPI.getExecutiveSummary(selectedYear),
        financialAPI.getPapSummary(selectedYear),
        monitoringAPI.getOverview(selectedYear),
        dashboardAPI.getAuditFeed(selectedYear),
        dashboardAPI.getRecentTransactions(selectedYear)
      ]);

      const [execRes, papRes, monitorRes, auditRes, transRes] = results;

      if (execRes.status === 'fulfilled' && execRes.value.success) setExecutiveSummary(execRes.value.data);
      if (papRes.status === 'fulfilled' && papRes.value.success) setPapSummary(papRes.value.data);
      if (monitorRes.status === 'fulfilled' && monitorRes.value.success) setMonitoringOverview(monitorRes.value.data);
      if (auditRes.status === 'fulfilled' && auditRes.value.success) setAuditFeed(auditRes.value.data);
      if (transRes.status === 'fulfilled' && transRes.value.success) setRecentTransactions(transRes.value.data);

      // Check for errors in critical calls
      if (execRes.status === 'rejected') {
        const errorDetail = execRes.reason?.message || execRes.reason?.error || "Executive Summary failed to load";
        setError(String(errorDetail));
      }

    } catch (err) {
      console.error("Failed to fetch budget data:", err);
      let msg = "Failed to load budget data";

      if (typeof err === 'string') {
        msg = err;
      } else if (err && typeof err === 'object') {
        msg = err.message || err.error || "An error occurred";
      }

      setError(String(msg));
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
    monitoringOverview,
    auditFeed,
    recentTransactions,
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
