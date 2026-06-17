import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  Upload,
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
  const navigate = useNavigate();
  const { budgetData, totals } = useBudget();
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
    const groups = {
      'GAS': {
        label: 'GENERAL ADMINISTRATION AND SUPPORT (GAS)',
        icon: Building2,
        code: '100000000000000',
        items: [],
        totals: { ps: 0, rlip: 0, mooe: 0, total: 0, obligated: 0 }
      },
      'NNMP': {
        label: 'NATIONAL NUTRITION MANAGEMENT PROGRAM (NNMP)',
        icon: Activity,
        code: '310100000000000',
        items: [],
        totals: { ps: 0, rlip: 0, mooe: 0, total: 0, obligated: 0 }
      }
    };

    if (!budgetData || !budgetData.paps) return groups;

    budgetData.paps.forEach(pap => {
      const matchesSearch = pap.code.includes(searchTerm) || pap.description.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return;

      const ps = pap.ps.operations;
      const rlip = pap.ps.rlip;
      const mooe = pap.mooe.allocation;
      const total = ps + rlip + mooe;
      const obligated = pap.ps.items.reduce((s, i) => s + i.obligated, 0) +
                        pap.mooe.items.reduce((s, i) => s + i.obligated, 0);

      const item = { ...pap, total, obligated };
      const groupKey = pap.type === 'GAS' ? 'GAS' : 'NNMP';

      groups[groupKey].items.push(item);
      groups[groupKey].totals.ps += ps;
      groups[groupKey].totals.rlip += rlip;
      groups[groupKey].totals.mooe += mooe;
      groups[groupKey].totals.total += total;
      groups[groupKey].totals.obligated += obligated;
    });

    return groups;
  }, [budgetData, searchTerm]);

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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Layers size={16} /></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PAP Types</p>
              </div>
              <h3 className="text-2xl font-black text-slate-900">2</h3>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Layout size={16} /></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total PAPs</p>
              </div>
              <h3 className="text-2xl font-black text-slate-900">{budgetData?.paps?.length || 0}</h3>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><BarChart4 size={16} /></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total PS</p>
              </div>
              <h3 className="text-lg font-black text-emerald-600 font-mono">₱{formatPHP(totals.totalPsOps)}</h3>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Activity size={16} /></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total RLIP</p>
              </div>
              <h3 className="text-lg font-black text-amber-600 font-mono">₱{formatPHP(totals.totalRlip)}</h3>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><ChevronRightSquare size={16} /></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total MOOE</p>
              </div>
              <h3 className="text-lg font-black text-purple-600 font-mono">₱{formatPHP(totals.totalMooe)}</h3>
          </div>
      </div>

      {/* Main Registry View */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-10 py-6 bg-slate-50 border-b border-slate-100 items-center">
            <div className="col-span-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">PAP Type / Description</span>
            </div>
            <div className="col-span-1 text-right text-[8px] font-black text-slate-400 uppercase">PS Ops</div>
            <div className="col-span-1 text-right text-[8px] font-black text-slate-400 uppercase">RLIP</div>
            <div className="col-span-1 text-right text-[8px] font-black text-slate-400 uppercase">MOOE</div>
            <div className="col-span-1 text-right text-[8px] font-black text-slate-400 uppercase">Total Budget</div>
            <div className="col-span-1 text-right text-[8px] font-black text-slate-400 uppercase">Obligated</div>
            <div className="col-span-1 text-right text-[8px] font-black text-slate-400 uppercase">Remaining</div>
            <div className="col-span-1 text-center text-[8px] font-black text-slate-400 uppercase">Utilization</div>
            <div className="col-span-2 text-right pr-4 text-[8px] font-black text-slate-400 uppercase">Action</div>
        </div>

        {/* Grouped Content */}
        <div className="divide-y divide-slate-100">
            {Object.keys(groupedPAPs).map(key => {
                const group = groupedPAPs[key];
                const isExpanded = expandedSections[key];
                const Icon = group.icon;

                return (
                    <div key={key} className="flex flex-col">
                        {/* Parent Group Header */}
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
                                        PAP Code: {group.code} • {group.items.length} PAPs Found
                                    </p>
                                </div>
                            </div>

                            {!isExpanded && (
                                <div className="flex items-center gap-8 border-r border-slate-100 pr-10">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Section Budget</p>
                                        <p className="text-xs font-black font-mono text-slate-900">₱{formatPHP(group.totals.total)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Obligated</p>
                                        <p className="text-xs font-black font-mono text-emerald-600">₱{formatPHP(group.totals.obligated)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Indented PAP Descriptions */}
                        {isExpanded && (
                            <div className="bg-slate-50/30">
                                {group.items.map((pap) => {
                                    const util = pap.total > 0 ? (pap.obligated / pap.total) * 100 : 0;
                                    const remaining = pap.total - pap.obligated;

                                    return (
                                        <div
                                            key={pap.id}
                                            className="grid grid-cols-12 gap-4 px-10 py-6 items-center hover:bg-white transition-all cursor-pointer group"
                                            onClick={() => navigate(`/pap-detail/${pap.id}`)}
                                        >
                                            <div className="col-span-3 flex items-start gap-5 pl-8 border-l-2 border-emerald-500/10 hover:border-emerald-500 transition-colors">
                                                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-500 transition-colors" />
                                                <div className="space-y-0.5">
                                                    <p className="text-[11px] font-black text-slate-800 uppercase leading-tight group-hover:text-emerald-600">
                                                        {pap.description}
                                                    </p>
                                                    <p className="text-[9px] font-mono font-bold text-slate-400">
                                                        PAP Code: {pap.code}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="col-span-1 text-right font-mono text-[10px] font-bold text-slate-500 italic">₱{formatPHP(pap.ps.operations)}</div>
                                            <div className="col-span-1 text-right font-mono text-[10px] font-bold text-slate-400">₱{formatPHP(pap.ps.rlip)}</div>
                                            <div className="col-span-1 text-right font-mono text-[10px] font-bold text-slate-400">₱{formatPHP(pap.mooe.allocation)}</div>
                                            <div className="col-span-1 text-right font-mono text-[11px] font-black text-slate-900 italic">₱{formatPHP(pap.total)}</div>
                                            <div className="col-span-1 text-right font-mono text-[11px] font-black text-emerald-600 italic">₱{formatPHP(pap.obligated)}</div>
                                            <div className="col-span-1 text-right font-mono text-[11px] font-black text-slate-900 italic">₱{formatPHP(remaining)}</div>

                                            <div className="col-span-1 flex flex-col items-center gap-1">
                                                <HealthBadge util={util} />
                                                <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${util}%` }} />
                                                </div>
                                            </div>

                                            <div className="col-span-2 text-right pr-4">
                                                <button className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all opacity-0 group-hover:opacity-100 shadow-xl shadow-slate-900/20">
                                                    View Details
                                                </button>
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

      {/* Info Card */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-[32px] p-6 flex items-start gap-4 shadow-sm">
        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Info size={18} /></div>
        <p className="text-xs font-medium text-emerald-800/80 leading-relaxed">
            The <strong>Budget Registry</strong> master inventory provides real-time visibility into the allotment distribution and utilization status of each PAP.
            All financial transactions (Purchase Requests and Obligations) are linked directly to these records for accurate balance tracking.
        </p>
      </div>
    </div>
  );
};

export default PAPRegistryList;
