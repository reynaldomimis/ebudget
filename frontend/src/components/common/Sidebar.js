import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  FileText,
  ClipboardList,
  BarChart3,
  Users,
  ShieldCheck,
  History,
  Activity,
  UserCircle,
  ChevronRight,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NavItem = ({ item, isActive, isCollapsed, onClick, hasSubItems, isOpen }) => {
  const Icon = item.icon;

  return (
    <div className="px-2 mb-0.5">
      <button
        onClick={() => onClick(item.id)}
        className={`
          w-full flex items-center py-2 px-3 rounded-lg transition-all duration-150
          ${isActive && !hasSubItems
            ? 'bg-primary-600 text-white shadow-md shadow-primary-100'
            : isActive && hasSubItems
              ? 'bg-primary-50 text-primary-700 font-bold'
              : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'}
          ${isCollapsed ? 'justify-center' : ''}
        `}
      >
        <Icon size={18} className={`${isActive && !hasSubItems ? 'text-white' : isActive ? 'text-primary-600' : 'text-neutral-400'}`} />

        {!isCollapsed && (
          <span className="ml-3 flex-1 text-left text-[13px] font-semibold tracking-tight">{item.label}</span>
        )}

        {!isCollapsed && hasSubItems && (
          <div className="transition-transform duration-200" style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
            <ChevronDown size={14} className="opacity-50" />
          </div>
        )}
      </button>

      {!isCollapsed && hasSubItems && isOpen && (
        <div className="mt-1 space-y-0.5 pl-9 pr-2">
          {item.subItems.map(subItem => (
            <button
              key={subItem.id}
              onClick={() => onClick(subItem.id)}
              className={`
                w-full text-left py-1.5 px-3 rounded-md text-[12px] font-medium transition-all duration-150
                ${isActive === subItem.id
                  ? 'text-primary-600 bg-primary-50/50'
                  : 'text-neutral-400 hover:text-primary-600 hover:bg-neutral-50'}
              `}
            >
              {subItem.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ activeRoute, onNavigate, isCollapsed, onCollapse }) => {
  const { user, logout } = useAuth();
  const [openMenus, setOpenMenus] = React.useState(['budget', 'transactions', 'workflow', 'admin']);

  const toggleMenu = (id) => {
    setOpenMenus(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    {
      id: 'budget',
      label: 'Budget',
      icon: Wallet,
      subItems: [
        { id: 'ps-budget', label: 'PS Budget' },
        { id: 'mooe-budget', label: 'MOOE Budget' },
        { id: 'import', label: 'Import Center' }
      ]
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: FileText,
      subItems: [
        { id: 'pr-list', label: 'Procurement Requests' },
        { id: 'obligations', label: 'Obligations' }
      ]
    },
    {
      id: 'workflow',
      label: 'Work Flow',
      icon: ClipboardList
    },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    {
      id: 'admin',
      label: 'Administration',
      icon: ShieldCheck,
      subItems: [
        { id: 'users', label: 'Users' },
        { id: 'roles', label: 'Roles & Permissions' },
        { id: 'audit-trail', label: 'Audit Trail' }
      ]
    }
  ];

  const handleItemClick = (id) => {
    const item = navItems.find(n => n.id === id);
    if (item && item.subItems) {
      toggleMenu(id);
    } else {
      onNavigate(id);
    }
  };

  return (
    <aside
      className={`
        flex flex-col h-screen bg-white border-r border-neutral-200 transition-all duration-300
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Brand */}
      <div className="h-16 flex items-center px-4 border-b border-neutral-100">
        <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-primary-100">
          W
        </div>
        {!isCollapsed && (
          <span className="ml-3 font-bold text-neutral-900 truncate tracking-tight text-lg">WFP System</span>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4">
        {navItems.map(item => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeRoute === item.id || (item.subItems && item.subItems.some(s => s.id === activeRoute))}
            isCollapsed={isCollapsed}
            onClick={handleItemClick}
            hasSubItems={!!item.subItems}
            isOpen={openMenus.includes(item.id)}
          />
        ))}
      </div>

      {/* Bottom */}
      <div className="mt-auto border-t border-neutral-100 p-4">
        <button
          onClick={logout}
          className={`
            w-full flex items-center py-2 px-3 rounded-md text-danger-600 hover:bg-danger-50 transition-all duration-150
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="ml-3 text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
