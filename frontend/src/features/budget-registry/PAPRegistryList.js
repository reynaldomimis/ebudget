import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  Building2,
  Activity,
  Info,
  ChevronRightSquare,
  BarChart4,
  Layers,
  Layout
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { useBudget } from '../../context/BudgetContext';
import { useFiscalYear } from '../../context/FiscalYearContext';
import { formatPHP } from '../../utils/formatters';

const HealthBadge = ({ util }) => {
  let config = { label: 'Healthy', color: 'text-emerald-700 bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500' };
  if (util > 90) config = { label: 'Critical', color: 'text-rose-700 bg-rose-50 border-rose-100', dot: 'bg-rose-500' };
  else if (util > 75) config = { label: 'Warning', color: 'text-amber-700 bg-amber-50 border-amber-100', dot: 'bg-amber-500' };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${config.color} text-[9px] font-black uppercase tracking-tight`}>
      <div className={`w-1 h-1 rounded-full ${config.dot}`}></div>
      {config.label} {util.toFixed(0)}%
    </div>
  );
};

const PAPRegistryList = () => {
  const { executiveSummary, papSummary, loading } = useBudget();
  const { selectedYear } = useFiscalYear();

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({
      'GAS': true,
      'NNMP': true
  });

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const groupedPAPs = useMemo(() => {
    const groups = {};

    papSummary.forEach(pap => {
      if (searchTerm && !pap.name.toLowerCase().includes(searchTerm.toLowerCase())) return;

      const groupKey = pap.type || 'OTHERS';
      if (!groups[groupKey]) {
        groups[groupKey] = {
          label: groupKey === 'GAS' ? 'GENERAL ADMINISTRATION AND SUPPORT (GAS)' :
                 groupKey === 'NNMP' ? 'NATIONAL NUTRITION MANAGEMENT PROGRAM (NNMP)' : groupKey,
          icon: groupKey === 'GAS' ? Building2 : Activity,
          items: [],
          totals: { allocation: 0, obligated: 0 }
        };
      }

      groups[groupKey].items.push(pap);
      groups[groupKey].totals.allocation += pap.totalAllocation;
      groups[groupKey].totals.obligated += pap.obligated;
    });

    return groups;
  }, [papSummary, searchTerm]);

  if (loading && !executiveSummary) {
      return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Synchronizing Registry...</div>;
  }

  const summary = executiveSummary || { personnelTotal: 0, rlip: 0, mooe: 0, co: 0 };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700 pb-20 px-2">
      <PageHeader
        title="Budget Registry"
        subtitle={`Official inventory of PAPs for Fiscal Year ${selectedYear}.`}
        actions={
          <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition-all active:scale-95">
            <Download size={14} /> Export Registry
          </button>
        }
      />

      {/* Registry Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Layers size={16} /></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Personnel Services</p>
              </div>
              <h3 className="text-lg font-black text-slate-900 font-mono">₱{formatPHP(summary.personnelTotal)}</h3>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><BarChart4 size={16} /></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total MOOE</p>
              </div>
              <h3 className="text-lg font-black text-emerald-600 font-mono">₱{formatPHP(summary.mooe)}</h3>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Activity size={16} /></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total CO</p>
              </div>
              <h3 className="text-lg font-black text-amber-600 font-mono">₱{formatPHP(summary.co)}</h3>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><ChevronRightSquare size={16} /></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grand Total Allotment</p>
              </div>
              <h3 className="text-lg font-black text-purple-600 font-mono">₱{formatPHP(summary.grandTotal)}</h3>
          </div>
      </div>

      {/* Main Registry View */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-10 py-6 bg-slate-50 border-b border-slate-100 items-center">
            <div className="col-span-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">PAP Description</span>
            </div>
            <div className="col-span-2 text-right text-[8px] font-black text-slate-400 uppercase">Total Allotment</div>
            <div className="col-span-2 text-right text-[8px] font-black text-slate-400 uppercase">Obligated</div>
            <div className="col-span-2 text-right text-[8px] font-black text-slate-400 uppercase">Remaining</div>
            <div className="col-span-2 text-center text-[8px] font-black text-slate-400 uppercase">Utilization</div>
        </div>

        {/* Grouped Content */}
        <div className="divide-y divide-slate-100">
            {Object.keys(groupedPAPs).map(key => {
                const group = groupedPAPs[key];
                const isExpanded = expandedSections[key];
                const Icon = group.icon;

                return (
                    <div key={key} className="flex flex-col">
                        <div
                            className={`px-8 py-5 flex items-center justify-between cursor-pointer transition-all duration-500 ${
                                isExpanded ? 'bg-emerald-500 text-white shadow-xl z-10' : 'bg-white hover:bg-slate-50'
                            }`}
                            onClick={() => toggleSection(key)}
                        >
                            <div className="flex items-center gap-5">
                                <div className={`${isExpanded ? 'text-white/50' : 'text-slate-300'}`}>
                                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isExpanded ? 'bg-white/20' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/10'}`}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-black uppercase tracking-wider ${isExpanded ? 'text-white' : 'text-slate-900'}`}>
                                        {group.label}
                                    </h4>
                                    <p className={`text-[10px] font-bold mt-1 ${isExpanded ? 'text-white/60' : 'text-slate-400'}`}>
                                        {group.items.length} PAPs Found
                                    </p>
                                </div>
                            </div>

                            {!isExpanded && (
                                <div className="flex items-center gap-8 border-r border-slate-100 pr-10">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Section Budget</p>
                                        <p className="text-xs font-black font-mono text-slate-900">₱{formatPHP(group.totals.allocation)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Obligated</p>
                                        <p className="text-xs font-black font-mono text-emerald-600">₱{formatPHP(group.totals.obligated)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {isExpanded && (
                            <div className="bg-slate-50/30">
                                {group.items.map((pap, idx) => {
                                    return (
                                        <div
                                            key={idx}
                                            className="grid grid-cols-12 gap-4 px-10 py-6 items-center hover:bg-white transition-all cursor-pointer group"
                                        >
                                            <div className="col-span-4 flex items-start gap-5 pl-8 border-l-2 border-emerald-500/10 hover:border-emerald-500 transition-colors">
                                                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-500 transition-colors" />
                                                <div className="space-y-0.5">
                                                    <p className="text-[11px] font-black text-slate-800 uppercase leading-tight group-hover:text-emerald-600">
                                                        {pap.name}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="col-span-2 text-right font-mono text-[11px] font-black text-slate-900 italic">₱{formatPHP(pap.totalAllocation)}</div>
                                            <div className="col-span-2 text-right font-mono text-[11px] font-black text-emerald-600 italic">₱{formatPHP(pap.obligated)}</div>
                                            <div className="col-span-2 text-right font-mono text-[11px] font-black text-slate-900 italic">₱{formatPHP(pap.balance)}</div>

                                            <div className="col-span-2 flex flex-col items-center gap-1">
                                                <HealthBadge util={pap.utilization} />
                                                <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${pap.utilization}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default PAPRegistryList;
