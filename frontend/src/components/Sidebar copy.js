import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ activeComponent, setActiveComponent }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout, hasPermission } = useAuth();

  const menuItems = [
    { id: "import", label: "Import WFP", icon: "📥", requiredRole: "User" },
    { id: "records", label: "Records", icon: "📊", requiredRole: "Viewer" },
    { id: "summary", label: "Summary", icon: "📈", requiredRole: "Viewer" },
  ];

  const handleLogout = () => logout();
  const canAccessMenuItem = (item) => hasPermission(item.requiredRole);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div
      className={`bg-white shadow-lg transition-all duration-300 flex flex-col h-full relative ${isCollapsed ? "w-20" : "w-48"}`}
    >
      {/* Logo & System Name */}
      <div className="p-4 border-b border-gray-200 flex flex-col">
        <div className="flex items-center space-x-3">
          {/* Single Hamburger Button */}
          <div className={`flex-1 flex items-center justify-between min-w-0`}>
            {!isCollapsed && (
              <h1 className="text-xl font-bold text-gray-800 truncate">
                WFP System
              </h1>
            )}
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
              title="Toggle sidebar"
            >
              <svg
                className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${isCollapsed ? "rotate-180" : "rotate-0"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {!isCollapsed && user && (
          <div className="flex items-center space-x-2 text-sm mt-2 min-w-0">
            <span className="text-gray-600 flex-shrink-0">Welcome,</span>
            <span className="font-medium text-gray-800 truncate">
              {user.username}
            </span>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const canAccess = canAccessMenuItem(item);
            const buttonClasses =
              "flex items-center px-3 py-2 rounded-lg transition-all duration-200 w-full " +
              (isCollapsed ? "justify-center " : "space-x-3 ") +
              (activeComponent === item.id
                ? "bg-green-100 text-green-600 font-medium"
                : canAccess
                  ? "text-gray-700 hover:bg-green-50"
                  : "text-gray-400 cursor-not-allowed opacity-50");

            return (
              <li key={item.id}>
                <button
                  onClick={() => canAccess && setActiveComponent(item.id)}
                  disabled={!canAccess}
                  className={buttonClasses}
                  title={
                    isCollapsed
                      ? item.label
                      : !canAccess
                        ? `Requires ${item.requiredRole} role`
                        : ""
                  }
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {!canAccess && !isCollapsed && (
                    <span className="ml-auto text-xs flex-shrink-0">🔒</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`flex items-center justify-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg w-full transition-all duration-200 ${isCollapsed ? "justify-center" : ""}`}
          title="Logout"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
            />
          </svg>
          {!isCollapsed && <span className="ml-3 truncate">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
