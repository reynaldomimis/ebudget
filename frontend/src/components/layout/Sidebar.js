import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ArrowLeftRight,
  ClipboardList,
  Activity,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'budget',
    label: 'Budget Registry',
    icon: BookOpen,
    section: 'Budget',
    subItems: [
      { id: 'registry', label: 'Overview' },
      { id: 'import', label: 'Import Budget' },
    ],
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: ArrowLeftRight,
    section: 'Transactions',
    subItems: [
      { id: 'create-pr', label: 'Purchase Requests' },
      { id: 'create-obligation', label: 'Obligation Register' },
    ],
  },
  {
    id: 'workflow',
    label: 'Workflow',
    icon: ClipboardList,
    badge: 5,
    subItems: [
      { id: 'review-queue', label: 'Review Queue' },
      { id: 'approval-queue', label: 'Approval Queue' },
    ],
  },
  { id: 'monitoring', label: 'Monitoring', icon: Activity, dividerBefore: true },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'admin', label: 'Administration', icon: ShieldCheck },
];

const SubItem = ({ id, label, isActive, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`
      w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left
      text-[12px] font-medium transition-all duration-150
      ${isActive
        ? 'text-emerald-400 bg-emerald-500/10'
        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
    `}
  >
    <span className={`w-1 h-1 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
    {label}
  </button>
);

const NavItem = ({ item, isActive, isOpen, onToggle, onNavigate, collapsed, currentPath }) => {
  const { id, label, icon: Icon, subItems = [], badge } = item;
  const hasSubItems = subItems.length > 0;

  return (
    <div>
      <button
        onClick={hasSubItems ? onToggle : () => onNavigate(id)}
        className={`
          w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[9px]
          text-[13px] font-medium transition-all duration-150
          ${collapsed ? 'justify-center' : ''}
          ${isActive && !hasSubItems
            ? 'bg-emerald-500/10 text-emerald-400'
            : isActive && hasSubItems
              ? 'text-slate-200 bg-white/5'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
        `}
        title={collapsed ? label : undefined}
      >
        <Icon
          size={16}
          className={`flex-shrink-0 ${
            isActive ? 'text-emerald-400' : 'text-slate-600'
          }`}
        />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{label}</span>
            {badge && (
              <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {badge}
              </span>
            )}
            {hasSubItems && (
              <ChevronRight
                size={12}
                className={`text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
              />
            )}
          </>
        )}
        {collapsed && badge && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
        )}
      </button>

      {!collapsed && hasSubItems && isOpen && (
        <div className="pl-7 mt-0.5 flex flex-col gap-0.5">
          {subItems.map((sub) => (
            <SubItem
              key={sub.id}
              id={sub.id}
              label={sub.label}
              isActive={currentPath === sub.id}
              onClick={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ collapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.substring(1) || 'dashboard';

  const [openMenus, setOpenMenus] = useState(['budget', 'transactions']);

  const toggleMenu = (id) => {
    setOpenMenus((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const isActive = (item) => {
    if (currentPath === item.id) return true;
    if (item.subItems?.some((s) => currentPath === s.id)) return true;
    if (item.id === 'budget' && currentPath.startsWith('pap-detail')) return true;
    return false;
  };

  let lastSection = null;

  return (
    <aside
      className={`
        h-screen flex flex-col transition-all duration-300 z-50
        bg-[#0c0f14] border-r border-white/[0.04]
        ${collapsed ? 'w-16' : 'w-[248px]'}
      `}
    >
      {/* Brand */}
      <div className={`flex items-center gap-3 border-b border-white/[0.05] ${collapsed ? 'justify-center px-0 py-5' : 'px-[18px] py-5'}`}>
        <div className="w-[34px] h-[34px] bg-emerald-500 rounded-[9px] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[13px] font-bold tracking-tight">eB</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white text-[14px] font-semibold tracking-tight leading-tight">eBudget</p>
            <p className="text-slate-600 text-[11px] mt-0.5">Budget Management System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto flex flex-col gap-0.5 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const showSection = !collapsed && item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;

          return (
            <React.Fragment key={item.id}>
              {item.dividerBefore && (
                <div className="h-px bg-white/[0.05] my-1.5 mx-1" />
              )}
              {showSection && (
                <p className="text-[10px] font-medium text-slate-700 uppercase tracking-[0.08em] px-2 pt-2 pb-1">
                  {item.section}
                </p>
              )}
              <div className="relative">
                <NavItem
                  item={item}
                  isActive={isActive(item)}
                  isOpen={openMenus.includes(item.id)}
                  onToggle={() => toggleMenu(item.id)}
                  onNavigate={(id) => navigate(`/${id}`)}
                  collapsed={collapsed}
                  currentPath={currentPath}
                />
              </div>
            </React.Fragment>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-2.5 border-t border-white/[0.05]">
        <div
          className={`
            flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] cursor-pointer
            hover:bg-white/5 transition-all duration-150 group
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <div className="w-[30px] h-[30px] rounded-lg bg-emerald-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
            JR
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 overflow-hidden">
                <p className="text-slate-300 text-[12px] font-medium truncate">Juan Reyes</p>
                <p className="text-slate-600 text-[10px] mt-0.5">Administrator</p>
              </div>
              <button
                className="w-6 h-6 rounded-[7px] flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 flex-shrink-0"
                title="Logout"
                onClick={(e) => { e.stopPropagation(); }}
              >
                <LogOut size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
