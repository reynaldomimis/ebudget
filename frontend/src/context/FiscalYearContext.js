import React, { createContext, useContext, useState } from 'react';

const FiscalYearContext = createContext();

export const FiscalYearProvider = ({ children }) => {
  // Default to current year
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const availableYears = ['2023', '2024', '2025', '2026'];

  const value = {
    selectedYear,
    setSelectedYear,
    availableYears
  };

  return (
    <FiscalYearContext.Provider value={value}>
      {children}
    </FiscalYearContext.Provider>
  );
};

export const useFiscalYear = () => {
  const context = useContext(FiscalYearContext);
  if (!context) {
    throw new Error('useFiscalYear must be used within a FiscalYearProvider');
  }
  return context;
};
