import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { financialAPI, monitoringAPI } from '../../services/api';
import { useFiscalYear } from '../../context/FiscalYearContext';
import PageHeader from '../../components/common/PageHeader';
import { formatPHP } from '../../utils/formatters';
import Skeleton from '../../components/common/Skeleton';
import {
  Activity,
  Clock,
  Search,
  TrendingDown,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

const PAPCard = ({ pap, onClick }) => {
  // Utilization thresholds: Healthy < 85%, Amber 85-95%, Critical > 95%
  let statusColor = 'emerald';
  let statusText = 'Healthy';

  if (pap.utilization > 95) {
    statusColor = 'rose';
    statusText = 'Critical';
  } else if (pap.utilization >= 85) {
    statusColor = 'amber';
    statusText = 'Warning';
  }

  // Financial Validation: Allocation = Obligated + Balance
  const variance = Math.abs(pap.totalAllocation - (pap.obligated + pap.balance));
  const hasVariance = variance > 0.01;

  return (
    <div
      onClick={() => onClick(pap)}
      className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all group cursor-pointer active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1 pr-4">
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">
            {pap.name}
          </h4>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{pap.type}</span>
        </div>
        <div className={`flex-shrink-0 px-2 py-1 rounded-lg bg-${statusColor}-50 dark:bg-${statusColor}-900/20 text-${statusColor}-600 dark:text-${statusColor}-400 text-[8px] font-black uppercase tracking-tighter`}>
          {statusText}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Allocation</p>
              <p className="text-xs font-black font-mono text-slate-900 dark:text-white">₱{formatPHP(pap.totalAllocation)}</p>
          </div>
          <div className={`p-3 rounded-2xl border ${statusColor === 'emerald' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700/50'}`}>
              <p className={`text-[8px] font-black uppercase mb-1 ${statusColor === 'emerald' ? 'text-emerald-600' : 'text-slate-400'}`}>Obligated</p>
              <p className={`text-xs font-black font-mono ${statusColor === 'emerald' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>₱{formatPHP(pap.obligated)}</p>
          </div>
      </div>

      <div className="space-y-4">
          <div className="flex justify-between items-end">
              <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Remaining</p>
                  <p className="text-sm font-black font-mono text-slate-900 dark:text-white">₱{formatPHP(pap.balance)}</p>
              </div>
              <div className="text-right">
                  <p className={`text-sm font-black font-mono ${pap.utilization > 95 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                    {pap.utilization.toFixed(1)}%
                  </p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Utilized</p>
              </div>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
             <div
               className={`h-full bg-${statusColor}-500 transition-all duration-1000 ease-out`}
               style={{ width: `${Math.min(pap.utilization, 100)}%` }}
             />
          </div>
      </div>

      {hasVariance && (
        <div className="mt-4 flex items-center gap-1.5 text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-xl border border-rose-100 dark:border-rose-800/50">
          <AlertTriangle size={10} />
          <span className="text-[8px] font-black uppercase tracking-tight">Financial Variance Detected</span>
        </div>
      )}
    </div>
  );
};

const MonitoringDashboard = () => {
  const navigate = useNavigate();
  const { selectedYear } = useFiscalYear();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [papSummary, setPapSummary] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMonitoringData = async () => {
        setLoading(true);
        try {
            const [overviewRes, papRes] = await Promise.all([
                monitoringAPI.getOverview(selectedYear),
                financialAPI.getPapSummary(selectedYear)
            ]);
            if (overviewRes.success) setOverview(overviewRes.data || null);
            if (papRes.success) setPapSummary(papRes.data || []);
        } catch (err) {
            console.error("Failed to load monitoring data", err);
        } finally {
            setLoading(false);
        }
    };
    fetchMonitoringData();
  }, [selectedYear]);

  const groupedPAPs = useMemo(() => {
    const filtered = (papSummary || []).filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const groups = {};
    filtered.forEach(pap => {
      const type = pap.type || 'OTHERS';
      if (!groups[type]) groups[type] = [];
      groups[type].push(pap);
    });
    return groups;
  }, [papSummary, searchTerm]);

  const topDepleting = useMemo(() => {
    return [...(papSummary || [])]
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 3);
  }, [papSummary]);

  const handlePAPClick = (pap) => {
    // Navigate to PAP Detail with parameters
    navigate(`/pap-detail/${encodeURIComponent(pap.name)}?type=${encodeURIComponent(pap.type)}`);
  };

  if (loading) {
    return (
      <div className="w-full py-8 px-6 space-y-12">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-12 w-96 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-[32px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-6 animate-in fade-in duration-700 pb-20">
      <PageHeader
        title="Monitoring Heatmap"
        subtitle={`Live budget execution health for Fiscal Year ${selectedYear}.`}
        actions={
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Warning</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Critical</span>
                </div>
            </div>

            <div className="relative group">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                      type="text"
                      placeholder="Filter by PAP name..."
                      className="pl-11 pr-6 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all w-64 shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
          </div>
        }
      />

      {/* Heatmap Grid */}
      <div className="space-y-16 mb-16">
        {Object.keys(groupedPAPs).length > 0 ? (
          Object.keys(groupedPAPs).sort().map(type => (
            <div key={type} className="space-y-8">
              <div className="flex items-center gap-4">
                 <div className="px-4 py-1.5 bg-slate-900 dark:bg-slate-700 rounded-xl">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    {type}
                   </h3>
                 </div>
                 <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{groupedPAPs[type].length} Programs</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {groupedPAPs[type].map((pap, idx) => (
                  <PAPCard key={idx} pap={pap} onClick={handlePAPClick} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
              <Search size={32} className="opacity-20" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest">No matching PAPs found</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
                <TrendingDown size={18} className="text-rose-500" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">UTILIZATION <span className="text-slate-400 italic font-normal">HOTSPOTS</span></h3>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-50 dark:divide-slate-700">
                    {topDepleting.map((p, idx) => (
                        <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl ${p.utilization > 95 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'} dark:bg-slate-900 flex items-center justify-center text-xs font-black`}>
                                    0{idx + 1}
                                </div>
                                <div>
                                    <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase truncate w-64 md:w-96">{p.name}</h5>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">₱{formatPHP(p.totalAllocation)} ALLOCATION</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-xl font-black italic ${p.utilization > 95 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{p.utilization.toFixed(1)}%</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Execution Rate</p>
                            </div>
                        </div>
                    ))}
                    {topDepleting.length === 0 && <p className="p-10 text-center text-xs text-slate-400 uppercase">Analysis pending...</p>}
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Activity size={18} className="text-primary-500" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">SYSTEM <span className="text-slate-400 italic font-normal">HEALTH</span></h3>
            </div>
            <div className="bg-[#0f172a] rounded-[40px] shadow-xl p-8 text-white border border-slate-800">
                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Procurement</p>
                           <span className="text-xs font-black text-primary-400">{overview?.activePRs || 0}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-primary-500 rounded-full w-2/3"></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unspent Allocation</p>
                           <span className="text-xs font-black text-emerald-400">₱{formatPHP(overview?.remainingAllocation || 0)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500 rounded-full w-1/2"></div>
                        </div>
                    </div>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      Executive Summary <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
