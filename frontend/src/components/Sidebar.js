import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FiLogOut } from "react-icons/fi";

const menuItems = [
  { id: "import", label: "Import WFP", icon: "📥", requiredRole: "User" },
  { id: "records", label: "Records", icon: "📊", requiredRole: "Viewer" },
  { id: "summary", label: "Summary", icon: "📈", requiredRole: "Viewer" },
];

const Sidebar = ({ activeComponent, setActiveComponent }) => {
  const { logout, hasPermission } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredItems = menuItems.filter((item) =>
    hasPermission(item.requiredRole)
  );

  return (
    <aside
      className={`h-screen flex flex-col bg-white border-r relative z-50
      overflow-visible
      transition-[width] duration-300 ease-in-out
      ${isCollapsed ? "w-20" : "w-44"}`}
    >
      {/* HEADER */}
      <div className="h-14 flex items-center justify-between px-3 border-b">
        <div className="flex items-center gap-2 overflow-hidden">
          {isCollapsed && (
            <div className="p-1 bg-green-600 text-white rounded-md flex items-center justify-center text-sm font-bold">
              W
            </div>
          )}

          <span
            className={`
              text-sm font-semibold text-gray-800 whitespace-nowrap
              transition-all duration-200 ease-in-out overflow-hidden
              ${
                isCollapsed
                  ? "max-w-0 opacity-0 translate-x-[-5px]"
                  : "max-w-[120px] opacity-100 translate-x-0"
              }
            `}
          >
            WFP System
          </span>
        </div>

        <button
          onClick={() => setIsCollapsed((v) => !v)}
          className="text-gray-500 p-1 text-lg hover:text-gray-800"
        >
          ☰
        </button>
      </div>

      {/* MENU */}
      <nav className="flex-1 py-2">
        {filteredItems.map((item) => {
          const isActive = activeComponent === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveComponent(item.id)}
              className={`group relative w-full flex items-center px-3 py-2 text-sm
              transition-all duration-200
              ${isCollapsed ? "justify-center" : "gap-3"}
              ${
                isActive
                  ? "bg-green-100 text-green-800 font-semibold"
                  : "hover:bg-green-50 text-gray-700"
              }`}
            >
              {/* ICON */}
              <span className="text-lg flex-shrink-0">
                {item.icon}
              </span>

              {/* LABEL */}
              <span
                className={`
                  whitespace-nowrap
                  transition-all duration-200 ease-in-out
                  overflow-hidden
                  ${
                    isCollapsed
                      ? "max-w-0 opacity-0 translate-x-[-6px]"
                      : "max-w-[150px] opacity-100 translate-x-0"
                  }
                `}
              >
                {item.label}
              </span>

              {/* TOOLTIP (FIXED LAYER - NO CLIPPING) */}
              {isCollapsed && (
                <span
                  className="fixed z-[9999]
                  bg-gray-900 text-white text-xs px-2 py-1 rounded
                  opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100
                  transition-all duration-150 pointer-events-none whitespace-nowrap"
                  style={{
                    left: "80px",
                    transform: "translateY(-50%)",
                  }}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <div className="border-t p-2">
        <button
          onClick={logout}
          className={`group relative w-full flex items-center px-3 py-2 text-sm text-red-600
          transition-all duration-200
          ${isCollapsed ? "justify-center" : "gap-3"}
          hover:bg-red-50`}
        >
          <FiLogOut className="text-lg flex-shrink-0" />

          <span
            className={`
              whitespace-nowrap
              transition-all duration-200 ease-in-out overflow-hidden
              ${
                isCollapsed
                  ? "max-w-0 opacity-0 translate-x-[-6px]"
                  : "max-w-[120px] opacity-100 translate-x-0"
              }
            `}
          >
            Logout
          </span>

          {/* TOOLTIP */}
          {isCollapsed && (
            <span
              className="fixed z-[9999]
              bg-gray-900 text-white text-xs px-2 py-1 rounded
              opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100
              transition-all duration-150 pointer-events-none"
              style={{
                left: "80px",
                transform: "translateY(-50%)",
              }}
            >
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;