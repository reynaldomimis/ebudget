import React, { useMemo, useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import PageHeader from '../../components/common/PageHeader';
import {
  Activity,
  AlertCircle,
  Clock,
  LayoutGrid,
  Search,
  Filter,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Table as TableIcon,
  BarChart3,
  TrendingDown
} from 'lucide-react';

const MonitoringDashboard = () => {
  const { budgetData } = useBudget();
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useMemo(() => {
    if (!budgetData || !budgetData.paps) return { healthy: 0, warning: 0, critical: 0 };
    let healthy = 0, warning = 0, critical = 0;
    budgetData.paps.forEach(pap => {
      const totalAlloc = pap.ps.operations + pap.ps.rlip + pap.mooe.allocation;
      const totalObligated = pap.ps.items.reduce((s, i) => s + i.obligated, 0) +
                             pap.mooe.items.reduce((s, i) => s + i.obligated, 0);
      const util = totalAlloc > 0 ? (totalObligated / totalAlloc) * 100 : 0;
      if (util > 85) critical++;
      else if (util > 70) warning++;
      else healthy++;
    });
    return { healthy, warning, critical };
  }, [budgetData]);

  const groupedPAPs = useMemo(() => {
    if (!budgetData || !budgetData.paps) return {};
    const filtered = budgetData.paps.filter(p =>
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const groups = {};
    filtered.forEach(pap => {
      if (!groups[pap.type]) groups[pap.type] = [];
      groups[pap.type].push(pap);
    });
    return groups;
  }, [budgetData, searchTerm]);

  const topDepleting = useMemo(() => {
    if (!budgetData || !budgetData.paps) return [];
    return [...budgetData.paps]
      .map(p => {
        const totalAlloc = p.ps.operations + p.ps.rlip + p.mooe.allocation;
        const totalObligated = p.ps.items.reduce((s, i) => s + i.obligated, 0) +
                               p.mooe.items.reduce((s, i) => s + i.obligated, 0);
        return { ...p, util: totalAlloc > 0 ? (totalObligated / totalAlloc) * 100 : 0 };
      })
      .sort((a, b) => b.util - a.util)
      .slice(0, 3);
  }, [budgetData]);

  const agingItems = [
    { pr: 'PR-2024-054', ob: 'OB-2024-102', pap: 'National Nutrition Program', status: 'Technical Review', days: 8 },
    { pr: 'PR-2024-061', ob: 'PENDING', pap: 'Regional Ops - Region VI', status: 'Budget Allocation', days: 6 },
    { pr: 'PR-2024-042', ob: 'OB-2024-088', pap: 'Policy Development Workshop', status: 'Technical Review', days: 12 },
  ];

  return (
    <div className="w-full py-8 px-6 animate-in fade-in duration-700 pb-20">
      {/* Header & Global Stats */}
      <PageHeader
        title="PAP Utilization Monitoring"
        subtitle="Visual health of programs based on budget execution speed."
        actions={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Budget Health</span>
                  <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black">
                          {stats.healthy} OK
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black">
                          {stats.warning} WRN
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black">
                          {stats.critical} CRT
                      </div>
                  </div>
              </div>
            </div>

            <div className="relative group">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                      type="text"
                      placeholder="Search PAPs..."
                      className="pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all w-64 shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
          </div>
        }
      />

      {/* PAP Utilization Cards */}
      <div className="space-y-12 mb-16">
        {Object.keys(groupedPAPs).sort().map(type => (
          <div key={type} className="space-y-6">
            <div className="flex items-center gap-3">
               <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">
                {type} <span className="text-slate-300 italic">PORTFOLIO</span>
               </h3>
               <div className="h-px flex-1 bg-slate-100"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedPAPs[type].map((pap) => {
                const totalAlloc = pap.ps.operations + pap.ps.rlip + pap.mooe.allocation;
                const totalObligated = pap.ps.items.reduce((s, i) => s + i.obligated, 0) +
                                       pap.mooe.items.reduce((s, i) => s + i.obligated, 0);
                const util = totalAlloc > 0 ? (totalObligated / totalAlloc) * 100 : 0;
                const remaining = totalAlloc - totalObligated;

                let color = 'emerald';
                if (util > 85) color = 'rose';
                else if (util > 70) color = 'amber';

                return (
                  <div key={pap.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pap.code}</span>
                        <h4 className="text-sm font-black text-slate-900 uppercase leading-tight group-hover:text-emerald-600 transition-colors">{pap.description}</h4>
                      </div>
                      <div className={`w-3 h-3 rounded-full bg-${color}-500 shadow-lg shadow-${color}-500/20`}></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-3 bg-slate-50 rounded-2xl">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Budget</p>
                            <p className="text-xs font-black font-mono text-slate-900">₱{totalAlloc.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-emerald-50/50 rounded-2xl">
                            <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Obligated</p>
                            <p className="text-xs font-black font-mono text-emerald-700">₱{totalObligated.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">Remaining Allotment</p>
                                <p className="text-sm font-black font-mono text-slate-900">₱{remaining.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-900">{util.toFixed(1)}%</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Utilized</p>
                            </div>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full bg-${color}-500 transition-all duration-1000`} style={{ width: `${util}%` }}></div>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Depleting */}
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <TrendingDown size={18} className="text-rose-500" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">TOP DEPLETING <span className="text-slate-300 italic">PAPS</span></h3>
            </div>
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-50">
                    {topDepleting.map((p, idx) => (
                        <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 text-xs font-black">
                                    0{idx + 1}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-rose-600 uppercase mb-0.5">{p.code}</p>
                                    <h5 className="text-xs font-black text-slate-900 uppercase truncate w-64">{p.description}</h5>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-rose-600 italic">{p.util.toFixed(1)}%</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Critical Utilization</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Workflow Aging */}
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Clock size={18} className="text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">WORKFLOW AGING <span className="text-slate-300 italic">REGISTER</span></h3>
            </div>
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                            <th className="px-8 py-5">Reference</th>
                            <th className="px-8 py-5">PAP Context</th>
                            <th className="px-8 py-5 text-right">Age</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {agingItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-8 py-4">
                                    <p className="text-[10px] font-black text-blue-600 font-mono">{item.pr}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{item.status}</p>
                                </td>
                                <td className="px-8 py-4">
                                    <p className="text-[10px] font-black text-slate-900 uppercase truncate w-48">{item.pap}</p>
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <span className={`text-sm font-black font-mono ${item.days > 5 ? 'text-rose-600' : 'text-slate-900'}`}>
                                        {item.days}d
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
