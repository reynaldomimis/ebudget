import React, { useMemo, useEffect } from 'react';
import {
  Wallet,
  ArrowDownToLine,
  Clock,
  Activity,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  History,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  PieChart,
  ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip
} from 'recharts';
import { useBudget } from '../../context/BudgetContext';
import { useFiscalYear } from '../../context/FiscalYearContext';
import { formatPHP } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import Skeleton from '../../components/common/Skeleton';

/* ─── Stat Card Component ────────────────────────────────────────── */
const StatCard = ({ title, value, subValue, icon: Icon, variant = 'default', loading }) => {
  const styles = {
    default: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400',
    amber:   'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50 text-amber-600 dark:text-amber-400',
    blue:    'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50 text-blue-600 dark:text-blue-400',
    rose:    'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/50 text-rose-600 dark:text-rose-400',
  }[variant];

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md transition-all duration-300 relative overflow-hidden group ${variant === 'default' ? 'bg-white dark:bg-slate-800' : styles}`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${variant === 'default' ? 'bg-slate-100 dark:bg-slate-700 text-slate-500' : 'bg-white/80 dark:bg-slate-800/80 shadow-sm'}`}>
          <Icon size={20} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
          {value}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">{subValue}</p>
      </div>
    </div>
  );
};

/* ─── PERSONAL SERVICES (PS) TABLE ───────────────────────── */
const PSTableSummary = ({ summary, loading }) => {
  if (loading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!summary || !Array.isArray(summary.psRows)) {
      return (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center text-slate-400 text-xs font-black uppercase">
            No PS Data Available
          </div>
      );
  }

  const cell = (val) =>
    val > 0 ? <span className="font-mono">₱{formatPHP(val)}</span> : <span className="text-slate-300">—</span>;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col h-full shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
        <PieChart size={14} className="text-slate-400" />
        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">PERSONAL SERVICES (PS)</h4>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white dark:bg-slate-800 border-b border-slate-50 dark:border-slate-700">
              <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">PAP Description</th>
              <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* PS Section */}
            {summary.psRows.map((row, idx) => (
              <tr key={`ps-${idx}`} className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-5 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase leading-tight">{row.pap_des}</td>
                <td className="px-5 py-3 text-right text-[11px] text-slate-500 dark:text-slate-400">{cell(row.amount)}</td>
              </tr>
            ))}
            <tr className="bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
              <td className="px-5 py-3 text-[11px] uppercase">Total, PS</td>
              <td className="px-5 py-3 text-right text-[11px] font-mono">{cell(summary.psTotal)}</td>
            </tr>

            {/* RLIP Section */}
            <tr className="bg-slate-100/50 dark:bg-slate-700/30">
              <td colSpan="2" className="px-5 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">Retirement and Life Insurance Premiums (RLIP)</td>
            </tr>
            {summary.rlipRows.map((row, idx) => (
              <tr key={`rlip-${idx}`} className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-5 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase leading-tight italic pl-10">{row.pap_des}</td>
                <td className="px-5 py-3 text-right text-[11px] text-slate-500 dark:text-slate-400 italic">{cell(row.amount)}</td>
              </tr>
            ))}
            <tr className="bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white italic">
              <td className="px-5 py-3 text-[11px] uppercase pl-10">Total, RLIP</td>
              <td className="px-5 py-3 text-right text-[11px] font-mono">{cell(summary.rlipTotal)}</td>
            </tr>

            {/* Grand Total Personnel */}
            <tr className="bg-emerald-50/40 dark:bg-emerald-900/20 border-t-2 border-slate-900 dark:border-slate-600">
              <td className="px-5 py-4 text-[11px] font-black text-emerald-800 dark:text-emerald-300 uppercase">Grand Total, PS + RLIP</td>
              <td className="px-5 py-4 text-right text-[12px] font-black text-emerald-800 dark:text-emerald-300 font-mono underline decoration-double decoration-emerald-500">{cell(summary.personnelTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─── FY ALLOTMENT COMPOSITION MATRIX ─────────────────────── */
const FYSummaryTable = ({ summary, loading }) => {
  if (loading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!summary || !Array.isArray(summary.papComposition)) return null;

  const totalPSBase = summary.psTotal;
  const totalMOOE = summary.mooe;
  const totalCO = summary.co || 0;

  const cell = (val) =>
    val > 0 ? <span className="font-mono">₱{formatPHP(val)}</span> : <span className="text-slate-300">—</span>;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col h-full shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
        <ClipboardList size={14} className="text-slate-400" />
        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">FY ALLOTMENT COMPOSITION</h4>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white dark:bg-slate-800 border-b border-slate-50 dark:border-slate-700">
              <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">PAP Description</th>
              <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">PS</th>
              <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">MOOE</th>
              <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">CO</th>
              <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right font-bold text-slate-700 dark:text-slate-300">Grand Total</th>
            </tr>
          </thead>
          <tbody>
            {summary.papComposition.map((row, idx) => {
              const psVal = Number(row.ps || 0);
              const rlipVal = Number(row.rlip || 0);
              const mooeVal = Number(row.mooe || 0);
              const coVal = Number(row.co || 0);
              const rowGT = psVal + rlipVal + mooeVal + coVal;

              if (psVal === 0 && rlipVal === 0 && mooeVal === 0 && coVal === 0) return null;

              return (
                <tr key={idx} className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase leading-tight">{row.pap_des}</td>
                  <td className="px-5 py-3.5 text-right text-[11px] text-slate-500 dark:text-slate-400">{cell(psVal)}</td>
                  <td className="px-5 py-3.5 text-right text-[11px] text-slate-500 dark:text-slate-400">{cell(mooeVal)}</td>
                  <td className="px-5 py-3.5 text-right text-[11px] text-slate-300">—</td>
                  <td className="px-5 py-3.5 text-right text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-50/30 dark:bg-slate-900/20">{cell(rowGT)}</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-slate-900 dark:border-slate-600">
              <td className="px-5 py-3.5 text-[11px] font-black text-slate-900 dark:text-white uppercase">TOTAL</td>
              <td className="px-5 py-3.5 text-right text-[11px] font-black text-slate-900 dark:text-white">{cell(totalPSBase)}</td>
              <td className="px-5 py-3.5 text-right text-[11px] font-black text-slate-900 dark:text-white">{cell(totalMOOE)}</td>
              <td className="px-5 py-3.5 text-right text-[11px] text-slate-300">—</td>
              <td className="px-5 py-3.5 text-right text-[11px] font-black text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-900/40">{cell(totalPSBase + totalMOOE + totalCO)}</td>
            </tr>
            <tr className="border-b border-slate-50 dark:border-slate-700 bg-slate-50/20">
              <td className="px-5 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 italic uppercase">RLIP CONTRIBUTION</td>
              <td className="px-5 py-4 text-right text-[11px] text-slate-500 dark:text-slate-400 italic">{cell(summary.rlipTotal)}</td>
              <td className="px-5 py-4 text-right text-[11px] text-slate-300 italic">—</td>
              <td className="px-5 py-4 text-right text-[11px] text-slate-300 italic">—</td>
              <td className="px-5 py-4 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 italic bg-slate-50/20 dark:bg-slate-900/20">{cell(summary.rlipTotal)}</td>
            </tr>
            <tr className="bg-emerald-50/40 dark:bg-emerald-900/10">
              <td className="px-5 py-4 text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase">GRAND TOTAL</td>
              <td className="px-5 py-4 text-right text-[11px] font-black text-emerald-700 dark:text-emerald-400">{cell(summary.personnelTotal)}</td>
              <td className="px-5 py-4 text-right text-[11px] font-black text-emerald-700 dark:text-emerald-400">{cell(summary.mooe)}</td>
              <td className="px-5 py-4 text-right text-[11px] text-slate-300">—</td>
              <td className="px-5 py-4 text-right text-[11px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100/20 dark:bg-emerald-900/30">{cell(summary.grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─── Workflow Pulse (Donut Chart) ─────────────────────────────── */
const WorkflowPulse = ({ data, loading }) => {
  const navigate = useNavigate();

  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Draft', value: data.draft || 0, color: '#94a3b8' },
      { name: 'For Review', value: data.review || 0, color: '#f59e0b' },
      { name: 'Approved', value: data.approved || 0, color: '#10b981' },
      { name: 'Partially Obligated', value: data.partiallyObligated || 0, color: '#3b82f6' },
      { name: 'Obligated', value: data.obligated || 0, color: '#6366f1' },
      { name: 'Rejected', value: data.rejected || 0, color: '#f43f5e' },
    ].filter(item => item.value > 0);
  }, [data]);

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 h-full min-h-[350px] flex flex-col">
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="w-48 h-48 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-emerald-500" />
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Workflow Pulse</h3>
        </div>
        <button
          onClick={() => navigate('/review-queue')}
          className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline"
        >
          View Queues
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row items-center gap-6">
        <div className="w-full h-48 md:w-1/2">
          {total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ReTooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">No Active Workflow</p>
            </div>
          )}
        </div>

        <div className="w-full md:w-1/2 grid grid-cols-2 gap-3">
          {chartData.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate">{item.name}</span>
              </div>
              <span className="text-sm font-black text-slate-900 dark:text-white ml-3.5">{item.value}</span>
            </div>
          ))}
          {chartData.length === 0 && (
              <div className="col-span-2 text-center py-4">
                  <p className="text-[10px] text-slate-400">Nothing to track yet.</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Audit Feed Component ─────────────────────────────────────── */
const AuditFeed = ({ logs, loading }) => {
  const navigate = useNavigate();

  const handleAction = (refType, refId) => {
    if (refType === 'PR') {
      navigate('/create-pr');
    } else if (refType === 'OBLIGATION') {
      navigate('/create-obligation');
    }
  };

  const getActionIcon = (action) => {
    if (action.includes('PR')) return <Wallet size={12} className="text-blue-500" />;
    if (action.includes('OBLIGATION')) return <ArrowDownToLine size={12} className="text-emerald-500" />;
    return <Activity size={12} className="text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="bg-[#0f172a] rounded-2xl p-6 h-full flex flex-col">
        <Skeleton className="h-4 w-32 mb-6 bg-slate-800" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-8 h-8 rounded-full bg-slate-800" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-full bg-slate-800" />
                <Skeleton className="h-2 w-24 bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] dark:bg-slate-950 rounded-2xl p-6 text-white flex flex-col h-full shadow-xl shadow-slate-900/20 border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History size={16} className="text-blue-400" />
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Live Audit Feed</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {logs && logs.length > 0 ? (
          logs.slice(0, 10).map((log, idx) => (
            <div key={idx} className="flex gap-4 group cursor-default">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 transition-colors group-hover:bg-slate-700">
                  {getActionIcon(log.action)}
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">{log.action.replace(/_/g, ' ')}</span>
                  <span className="text-[9px] text-slate-500 font-medium">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  {log.ref_type} {log.ref_id ? `#${log.ref_id}` : ''} interaction recorded.
                </p>
                {log.ref_id && (
                  <button
                    onClick={() => handleAction(log.ref_type, log.ref_id)}
                    className="flex items-center gap-1 text-[9px] font-bold text-blue-400 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity uppercase"
                  >
                    Open {log.ref_type} <ExternalLink size={10} />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <History size={32} className="opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No activity recorded</p>
          </div>
        )}
      </div>

      <button className="mt-6 w-full py-3 rounded-xl border border-slate-800 bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all duration-200 flex items-center justify-center gap-2">
        Full Audit Log
      </button>
    </div>
  );
};

/* ─── Main Executive Dashboard ─────────────────────────────────── */
const DashboardOverview = () => {
  const navigate = useNavigate();
  const { executiveSummary, auditFeed, loading, error, refreshBudgetData } = useBudget();
  const { selectedYear, setSelectedYear, availableYears } = useFiscalYear();

  useEffect(() => {
    if (executiveSummary) {
      console.log("psRows", executiveSummary.psRows);
      console.log("rlipRows", executiveSummary.rlipRows);
    }
  }, [executiveSummary]);

  const summary = executiveSummary || {
    totalBudget: 0, totalObligated: 0, remainingBudget: 0, utilizationRate: 0,
    psRows: [], psTotal: 0, rlipRows: [], rlipTotal: 0,
    personnelTotal: 0, mooe: 0, co: 0,
    typeSummary: {},
    papComposition: [],
    workflow: {}, health: { status: 'Healthy', score: 0 }
  };

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title="Executive Dashboard"
        subtitle={`System-wide financial oversight for FY ${selectedYear}.`}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={refreshBudgetData}
              disabled={loading}
              className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={`${loading ? 'animate-spin' : ''} text-slate-500`} />
            </button>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest cursor-pointer focus:outline-none hover:border-primary-500 transition-all shadow-sm"
              >
                {(availableYears || []).map(year => (
                  <option key={year} value={year}>FY {year}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <AlertCircle size={18} />
          <p className="text-xs font-bold uppercase tracking-wide">Sync Error: {error}</p>
        </div>
      )}

      {/* SECTION 1: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Budget"
          value={`₱${formatPHP(summary.totalBudget || summary.grandTotal)}`}
          subValue="Consolidated Allotment"
          icon={Wallet}
          loading={loading}
        />
        <StatCard
          title="Total Obligated"
          value={`₱${formatPHP(summary.totalObligated || (summary.obligated && summary.obligated.total))}`}
          subValue="Processed Obligations"
          icon={ArrowDownToLine}
          variant="emerald"
          loading={loading}
        />
        <StatCard
          title="Remaining Budget"
          value={`₱${formatPHP(summary.remainingBudget || (summary.balance && summary.balance.total))}`}
          subValue="Available for Procurement"
          icon={Clock}
          variant="amber"
          loading={loading}
        />
        <StatCard
          title="Utilization Rate"
          value={`${(summary.utilizationRate || 0).toFixed(1)}%` }
          subValue="Budget Burn Rate"
          icon={TrendingUp}
          variant="blue"
          loading={loading}
        />
      </div>

      {/* SECTION 2: Workflow Pulse & Budget Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WorkflowPulse data={summary.workflow} loading={loading} />
        </div>
        <div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm h-full">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-primary-500" />
                  <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Budget Health</h3>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  summary.health?.status === 'Near Exhausted' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' :
                  summary.health?.status === 'Low Utilization' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                }`}>
                  {summary.health?.status || 'Unknown'}
                </div>
             </div>

             <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Utilization Progress</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white font-mono">{(summary.utilizationRate || 0).toFixed(1)}%</p>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        summary.utilizationRate > 95 ? 'bg-rose-500' :
                        summary.utilizationRate < 30 ? 'bg-blue-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(summary.utilizationRate, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700/50">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Active PRs</p>
                    <p className="text-md font-black text-slate-900 dark:text-white">{summary.activePRs || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700/50">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Obligations</p>
                    <p className="text-md font-black text-slate-900 dark:text-white">{summary.activeObligations || 0}</p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: DYNAMIC PAP DESCRIPTION TABLES (RESTORED SEPARATE SECTIONS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PSTableSummary summary={summary} loading={loading} />
        <FYSummaryTable summary={summary} loading={loading} />
      </div>

      {/* SECTION 4: Operational Pulse */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity size={16} className="text-emerald-500" />
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Operational Pulse</h4>
        </div>

        <div className="bg-slate-50/70 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Avg. PAP Utilization Speed</span>
            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">{(summary.utilizationRate || 0).toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(summary.utilizationRate, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* SECTION 5 & 6: Audit Feed & Monitoring Heatmap Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AuditFeed logs={auditFeed} loading={loading} />
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={16} className="text-primary-500" />
              <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Monitoring Preview</h4>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Track real-time budget depletion across all programs. Identify hotspots and execution delays before they impact delivery.
            </p>
          </div>
          <button
            onClick={() => navigate('/monitoring')}
            className="mt-6 w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary-900/10 flex items-center justify-center gap-2"
          >
            Open Monitoring Heatmap <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
