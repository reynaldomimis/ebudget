import React, { useState, useEffect } from 'react';
import { Bell, Menu, UserCircle } from 'lucide-react';
import { useFiscalYear } from '../../context/FiscalYearContext';

const Topbar = ({ onToggleSidebar }) => {
  const { selectedYear } = useFiscalYear();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-6">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 lg:hidden"
        >
          <Menu size={24} />
        </button>

        <div className="flex flex-col">
          <span className="text-base font-black uppercase tracking-[0.25em] text-slate-900 leading-tight">
            Financial Workplan <span className="text-slate-300 italic font-medium ml-1">FY {selectedYear}</span>
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{formatDate(currentTime)}</span>
            <span className="text-slate-200">|</span>
            <span className="text-[10px] font-black text-slate-400 font-mono tracking-wider">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4 border-r border-slate-100 pr-8">
            <div className="text-right">
                <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">Juan Dela Cruz</p>
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-0.5">Budget Officer</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-emerald-400 shadow-lg shadow-slate-200 border border-slate-800">
                <UserCircle size={24} />
            </div>
        </div>

        <button className="relative p-2 text-slate-400 hover:text-slate-900 transition-colors group">
          <Bell size={22} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
