import React, { createContext, useContext, useState, useMemo } from 'react';
import { useFiscalYear } from './FiscalYearContext';

const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
  const { selectedYear } = useFiscalYear();

  const [budgetData, setBudgetData] = useState({
    '2024': {
      paps: [
        {
          id: '2024-GAS-GMS',
          code: '100000100001000',
          type: 'GAS',
          description: 'General Management and Supervision',
          ps: {
            operations: 35146000.00,
            rlip: 0,
            items: [{ code: '50101010', description: 'Basic Salary', allocation: 35146000, obligated: 0 }]
          },
          mooe: {
            allocation: 13789000.00,
            items: [{ code: '50203010', description: 'Office Supplies', allocation: 13789000, obligated: 0 }]
          }
        },
        {
          id: '2024-GAS-HRD',
          code: '100000100002000',
          type: 'GAS',
          description: 'Human Resource Development',
          ps: {
            operations: 1500000.00,
            rlip: 0,
            items: [{ code: '50101010', description: 'Basic Salary', allocation: 1500000, obligated: 0 }]
          },
          mooe: {
            allocation: 500000.00,
            items: [{ code: '50202010', description: 'Training Expenses', allocation: 500000, obligated: 0 }]
          }
        },
        {
          id: '2024-POLICY',
          code: '310100100001000',
          type: 'Policy',
          description: 'Nutrition policy, standards, plan and program development and coordination',
          ps: {
            operations: 5626000.00,
            rlip: 0,
            items: [{ code: '50101010', description: 'Basic Salary', allocation: 5626000, obligated: 0 }]
          },
          mooe: {
            allocation: 391000.00,
            items: [{ code: '50201010', description: 'Travel Expenses', allocation: 391000, obligated: 0 }]
          }
        },
        {
          id: '2024-PFNSS',
          code: '310100100002000',
          type: 'PFNSS',
          description: 'Philippine food and nutrition surveillance',
          ps: {
            operations: 5707000.00,
            rlip: 0,
            items: [{ code: '50101010', description: 'Basic Salary', allocation: 5707000, obligated: 0 }]
          },
          mooe: {
            allocation: 7279000.00,
            items: [{ code: '50203010', description: 'Supplies', allocation: 7279000, obligated: 0 }]
          }
        },
        {
          id: '2024-PGN',
          code: '310100100003000',
          type: 'PGN',
          description: 'Promotion of good nutrition',
          ps: {
            operations: 4990000.00,
            rlip: 0,
            items: [{ code: '50101010', description: 'Basic Salary', allocation: 4990000, obligated: 0 }]
          },
          mooe: {
            allocation: 50064000.00,
            items: [{ code: '50203010', description: 'Advocacy Materials', allocation: 50064000, obligated: 0 }]
          }
        },
        {
          id: '2024-ASSISTANCE',
          code: '310100100004000',
          type: 'Assistance',
          description: 'Assistance to national, local nutrition and related programs',
          ps: {
            operations: 43291000.00,
            rlip: 0,
            items: [{ code: '50101010', description: 'Basic Salary', allocation: 43291000, obligated: 0 }]
          },
          mooe: {
            allocation: 138263000.00,
            items: [{ code: '50203010', description: 'Program Assistance', allocation: 138263000, obligated: 0 }]
          }
        }
      ],
      // Global RLIP as per Excel Sheet structure (often handled centrally)
      rlipTotal: 7210000.00
    }
  });

  // Aggregated Values for Dashboard
  const totals = useMemo(() => {
    const yearData = budgetData[selectedYear] || { paps: [], rlipTotal: 0 };

    const baseTotals = yearData.paps.reduce((acc, pap) => {
      acc.totalPsOps += pap.ps.operations;
      acc.totalMooe += pap.mooe.allocation;

      const psObligated = pap.ps.items.reduce((sum, item) => sum + item.obligated, 0);
      const mooeObligated = pap.mooe.items.reduce((sum, item) => sum + item.obligated, 0);
      acc.totalObligated += (psObligated + mooeObligated);

      return acc;
    }, {
      totalPsOps: 0,
      totalMooe: 0,
      totalObligated: 0
    });

    return {
      ...baseTotals,
      totalRlip: yearData.rlipTotal,
      totalAllocation: baseTotals.totalPsOps + baseTotals.totalMooe + yearData.rlipTotal
    };
  }, [budgetData, selectedYear]);

  const value = {
    budgetData: budgetData[selectedYear],
    totals,
    setBudgetData
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
