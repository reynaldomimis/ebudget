import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';

const AppLayout = ({ children, activeRoute, onNavigate, pageTitle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden font-sans text-neutral-800">
      <Sidebar
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        isCollapsed={isCollapsed}
        onCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          pageTitle={pageTitle}
          user={user}
          isCollapsed={isCollapsed}
          onCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        <main className="flex-1 overflow-y-auto px-3 py-4">
          <div className="w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
