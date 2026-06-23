import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Wallet,
  ShieldCheck,
  PieChart,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { monitoringAPI } from '../../services/api';
import { useFiscalYear } from '../../context/FiscalYearContext';
import { formatPHP } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import Skeleton from '../../components/common/Skeleton';

/* ─── Compact Stat Card ────────────────────────────────────── */
const MonitorCard = ({ title, value, icon: Icon, colorClass = "text-emerald-600", bgClass = "bg-emerald-50", loading }) => {
  if (loading) return <Skeleton className="h-24 rounded-xl" />;

  return (
    <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className="flex items-center gap-4 relative z-10">
        <div className={`p-3 ${bgClass} ${colorClass} rounded-lg transition-transform group-hover:scale-110 duration-500`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-xl font-black text-slate-900 font-mono tracking-tight">₱{formatPHP(value)}</p>
        </div>
      </div>
      <div className={`absolute -right-2 -bottom-2 opacity-[0.03] ${colorClass} group-hover:opacity-[0.08] transition-opacity`}>
        <Icon size={80} strokeWidth={3} />
      </div>
    </div>
  );
};

/* ─── Program Row Component ────────────────────────────────── */
const ProgramRow = ({ program, isExpanded, onToggle }) => {
  const getHealthColor = (util) => {
    if (util > 100) return { bg: 'bg-rose-50', text: 'text-rose-600', label: 'CRITICAL' };
    if (util > 90) return { bg: 'bg-amber-50', text: 'text-amber-600', label: 'WARNING' };
    return { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'HEALTHY' };
  };

  const health = getHealthColor(program.utilization);

  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer transition-all duration-300 ${isExpanded ? 'bg-emerald-500 text-white shadow-lg z-10' : 'hover:bg-slate-50 text-slate-900'}`}
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white/50' : 'text-slate-300'}`}>
               {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
            <div className={`p-2 rounded-xl flex-shrink-0 ${isExpanded ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'}`}>
              <Activity size={18} />
            </div>
            <div className="min-w-0">
              <p className={`text-[12px] font-black uppercase tracking-tight truncate ${isExpanded ? 'text-white' : 'text-slate-900'}`}>{program.name}</p>
              <p className={`text-[9px] font-bold ${isExpanded ? 'text-emerald-100' : 'text-slate-400'}`}>{program.paps.length} PAPs Found</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-4 text-right">
           <p className={`text-[10px] font-black font-mono ${isExpanded ? 'text-white' : 'text-slate-500'}`}>₱{formatPHP(program.ps || 0)}</p>
        </td>
        <td className="px-4 py-4 text-right">
           <p className={`text-[10px] font-black font-mono ${isExpanded ? 'text-white' : 'text-slate-500'}`}>₱{formatPHP(program.rlip || 0)}</p>
        </td>
        <td className="px-4 py-4 text-right">
           <p className={`text-[10px] font-black font-mono ${isExpanded ? 'text-white' : 'text-slate-500'}`}>₱{formatPHP(program.mooe || 0)}</p>
        </td>
        <td className="px-4 py-4 text-right">
           <p className={`text-[11px] font-black font-mono ${isExpanded ? 'text-white' : 'text-slate-900'}`}>₱{formatPHP(program.totalAllocation)}</p>
        </td>
        <td className="px-4 py-4 text-right">
           <p className={`text-[11px] font-black font-mono ${isExpanded ? 'text-white' : 'text-emerald-400'}`}>₱{formatPHP(program.obligated)}</p>
        </td>
        <td className="px-6 py-4 text-right">
           <div className="flex flex-col items-end gap-1">
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${isExpanded ? 'bg-white/20 text-white' : `${health.bg} ${health.text}`}`}>
                {health.label} {program.utilization.toFixed(1)}%
              </span>
              <div className={`w-20 h-1 rounded-full ${isExpanded ? 'bg-white/20' : 'bg-slate-100'} overflow-hidden mt-1`}>
                 <div
                   className={`h-full ${isExpanded ? 'bg-white' : 'bg-emerald-500'}`}
                   style={{ width: `${Math.min(program.utilization, 100)}%` }}
                 />
              </div>
           </div>
        </td>
      </tr>
      {isExpanded && program.paps.map((pap, idx) => (
        <tr key={idx} className="bg-slate-50/30 border-b border-slate-100/50 hover:bg-white transition-colors">
          <td className="px-6 py-3 pl-16">
            <div className="flex items-center gap-3 border-l-2 border-emerald-500/10 pl-4 py-1">
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <p className="text-[10px] font-black text-slate-700 uppercase leading-tight group-hover:text-emerald-600 line-clamp-2">
                {String(pap.description || 'UNNAMED PAP')}
              </p>
            </div>
          </td>
          <td className="px-4 py-3 text-right font-mono text-[10px] text-slate-400 italic">₱{formatPHP(pap.ps)}</td>
          <td className="px-4 py-3 text-right font-mono text-[10px] text-blue-400 italic">₱{formatPHP(pap.rlip)}</td>
          <td className="px-4 py-3 text-right font-mono text-[10px] text-emerald-500 italic">₱{formatPHP(pap.mooe)}</td>
          <td className="px-4 py-3 text-right font-mono text-[10px] text-slate-900 font-bold">₱{formatPHP(pap.total)}</td>
          <td className="px-4 py-3 text-right font-mono text-[10px] text-rose-500 font-bold">₱{formatPHP(pap.obligated)}</td>
          <td className="px-6 py-3 text-right">
             <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded tracking-tighter uppercase">
               UTIL {pap.utilization.toFixed(0)}%
             </span>
          </td>
        </tr>
      ))}
    </>
  );
};

/* ─── Main Component ───────────────────────────────────────── */
const MonitoringOverview = () => {
  const { selectedYear, setSelectedYear, availableYears } = useFiscalYear();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const fetchOverview = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await monitoringAPI.getOverview(selectedYear);
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch monitoring overview:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [selectedYear]);

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const summary = data?.summary || { ps: 0, rlip: 0, mooe: 0, co: 0, grandTotal: 0 };
  const programs = data?.programs || [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">
      <PageHeader
        title="Monitoring Overview"
        subtitle={`Programmatic tracking and utilization audit for Fiscal Year ${selectedYear}.`}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchOverview(true)}
              disabled={loading || refreshing}
              className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-100 transition-all shadow-sm active:scale-95"
            >
              <RefreshCw size={16} className={`${refreshing ? 'animate-spin' : ''} text-emerald-600`} />
            </button>
            <div className="relative group">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-[11px] font-black uppercase tracking-widest cursor-pointer focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm group-hover:border-emerald-500"
              >
                {(availableYears || []).map(year => (
                  <option key={year} value={year}>FY {year}</option>
                ))}
              </select>
              <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-500 transition-colors pointer-events-none" />
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-500 transition-colors pointer-events-none" />
            </div>
          </div>
        }
      />

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MonitorCard
          title="Total Personnel Services"
          value={summary.ps}
          icon={ShieldCheck}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
          loading={loading}
        />
        <MonitorCard
          title="Total MOOE"
          value={summary.mooe}
          icon={Wallet}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
          loading={loading}
        />
        <MonitorCard
          title="Total RLIP"
          value={summary.rlip}
          icon={TrendingUp}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
          loading={loading}
        />
        <MonitorCard
          title="Grand Total Allotment"
          value={summary.grandTotal}
          icon={PieChart}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
          loading={loading}
        />
      </div>

      {/* Main Table Section */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm text-emerald-600">
                <Activity size={18} />
              </div>
              <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Financial Performance Index</h3>
           </div>
           <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="SEARCH PROGRAM..."
                  className="pl-9 pr-4 py-2 rounded-lg border border-slate-100 bg-white text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-emerald-500 transition-all w-64"
                />
              </div>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-400 border-b border-slate-50">
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] w-1/4">PAP TYPE / DESCRIPTION</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-right">PS</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-right">RLIP</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-right">MOOE</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-right">Total Allotment</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-right">Obligated</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-right">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan="7" className="px-6 py-4"><Skeleton className="h-12 rounded-lg" /></td>
                  </tr>
                ))
              ) : programs.length > 0 ? (
                programs.map((prog, idx) => (
                  <ProgramRow
                    key={prog.code}
                    program={prog}
                    isExpanded={!!expandedSections[prog.code]}
                    onToggle={() => toggleSection(prog.code)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <PieChart size={48} />
                      <p className="text-xs font-black uppercase tracking-[0.3em]">No Program Data Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing {programs.length} Major Programs</p>
           <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">System Synchronized</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringOverview;
