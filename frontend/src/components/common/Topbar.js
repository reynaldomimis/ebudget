import React from 'react';
import { Bell, Search, User, Menu } from 'lucide-react';

const Topbar = ({ pageTitle, user, onCollapse, isCollapsed }) => {
  return (
    <header className="h-16 bg-white border-b border-neutral-200 px-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onCollapse}
          className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-bold text-neutral-900">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="hidden md:flex items-center relative">
          <Search size={18} className="absolute left-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full border-2 border-white"></span>
        </button>

        {/* User */}
        <div className="flex items-center gap-3 pl-6 border-l border-neutral-200">
          <div className="text-right hidden sm:block">
            <p className="text-[13px] font-bold text-neutral-900 leading-none">{user?.name || 'Guest User'}</p>
            <p className="text-[11px] font-semibold text-neutral-400 mt-1 uppercase tracking-wider">{user?.role || 'Admin'}</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-primary-50 text-primary-700 border-2 border-primary-100 flex items-center justify-center font-bold shadow-sm transition-transform hover:scale-105 active:scale-95">
            {user?.name?.charAt(0) || 'U'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
