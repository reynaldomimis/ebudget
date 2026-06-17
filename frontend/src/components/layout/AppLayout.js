import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { FiscalYearProvider } from '../../context/FiscalYearContext';
import { BudgetProvider } from '../../context/BudgetContext';

const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <FiscalYearProvider>
      <BudgetProvider>
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
          <Sidebar
            collapsed={sidebarCollapsed}
            onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Topbar
              onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-[1600px] mx-auto">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </BudgetProvider>
    </FiscalYearProvider>
  );
};

export default AppLayout;
