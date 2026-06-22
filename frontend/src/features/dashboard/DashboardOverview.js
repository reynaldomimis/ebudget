import React, { useMemo, useEffect } from 'react';
import {
  Wallet,
  ArrowDownToLine,
  Clock,
  Activity,
  History,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ClipboardList,
  CheckCircle2,
  AlertCircle
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
import StatusBadge from '../../components/common/StatusBadge';

/* ─── Stat Card Component (Green Theme) ────────────────────────── */
const StatCard = ({ title, value, subValue, icon: Icon, variant = 'default', loading }) => {
  const styles = {
    default: 'bg-white border-slate-200 text-slate-500',
    green:   'bg-emerald-50 border-emerald-100 text-emerald-600',
    primary: 'bg-green-600 border-green-600 text-white',
  }[variant];

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-[32px] p-6 flex flex-col gap-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group ${variant === 'primary' ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-200' : 'bg-white border-slate-100 shadow-sm'}`}>
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 ${variant === 'primary' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
          <Icon size={24} />
        </div>
        {variant !== 'primary' && (
           <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <CheckCircle2 size={14} className="text-emerald-500" />
           </div>
        )}
      </div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${variant === 'primary' ? 'text-green-100' : 'text-slate-400'}`}>{title}</p>
        <p className={`text-2xl font-black tracking-tight leading-none font-mono ${variant === 'primary' ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </p>
        <p className={`text-[11px] mt-3 font-bold uppercase tracking-wider ${variant === 'primary' ? 'text-green-200' : 'text-emerald-600'}`}>{subValue}</p>
      </div>

      {/* Abstract Background Decoration */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-10 transition-all duration-700 group-hover:opacity-20 ${variant === 'primary' ? 'bg-white' : 'bg-green-500'}`} />
    </div>
  );
};

/* ─── FY ALLOTMENT COMPOSITION MATRIX ─────────────────────── */
const FYSummaryTable = ({ summary, loading }) => {
  const groupedData = useMemo(() => {
    if (!summary || !Array.isArray(summary.papComposition)) return [];

    const categories = [
      { name: 'GAS', keywords: ['General Management', 'Human Resource'] },
      { name: 'Policy', keywords: ['Policy'] },
      { name: 'PFNSS', keywords: ['Surveillance'] },
      { name: 'PGN', keywords: ['Good Nutrition'] },
      { name: 'Assistance', keywords: ['Assistance'] }
    ];

    return categories.map(cat => {
      const matches = summary.papComposition.filter(row =>
        cat.keywords.some(key => row.pap_des.includes(key))
      );
      return {
        name: cat.name,
        ps: matches.reduce((sum, r) => sum + r.ps, 0),
        mooe: matches.reduce((sum, r) => sum + r.mooe, 0),
        co: matches.reduce((sum, r) => sum + r.co, 0),
        total: matches.reduce((sum, r) => sum + (r.ps + r.mooe + r.co), 0)
      };
    });
  }, [summary]);

  const totals = useMemo(() => {
    return groupedData.reduce((acc, row) => ({
      ps: acc.ps + row.ps,
      mooe: acc.mooe + row.mooe,
      co: acc.co + row.co,
      total: acc.total + row.total
    }), { ps: 0, mooe: 0, co: 0, total: 0 });
  }, [groupedData]);

  if (loading) return <Skeleton className="h-[450px] rounded-[40px]" />;
  if (!summary) return null;

  const cell = (val, isBold = false) =>
    val > 0 ? (
      <span className={`font-mono ${isBold ? 'font-black' : 'font-bold'}`}>
        ₱{formatPHP(val)}
      </span>
    ) : (
      <span className="text-slate-300">—</span>
    );

  return (
    <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden flex flex-col h-full shadow-sm hover:shadow-xl transition-all duration-500">
      <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
            <ClipboardList size={18} />
          </div>
          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">FY Allotment Summary</h4>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Summary</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">PS</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">MOOE</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">CO</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-900 uppercase tracking-widest text-right">Grand Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {groupedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-emerald-50/30 transition-colors group">
                <td className="px-8 py-4 text-[11px] font-bold text-slate-600 group-hover:text-emerald-700 uppercase">{row.name}</td>
                <td className="px-8 py-4 text-right text-[11px] text-slate-500">{cell(row.ps)}</td>
                <td className="px-8 py-4 text-right text-[11px] text-slate-500">{cell(row.mooe)}</td>
                <td className="px-8 py-4 text-right text-[11px] text-slate-500">{cell(row.co)}</td>
                <td className="px-8 py-4 text-right text-[11px] font-black text-slate-900">{cell(row.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-100">
            <tr className="bg-slate-50/30">
              <td className="px-8 py-4 text-[11px] font-black uppercase text-slate-900">Total</td>
              <td className="px-8 py-4 text-right text-[11px] font-black text-slate-900">{cell(totals.ps, true)}</td>
              <td className="px-8 py-4 text-right text-[11px] font-black text-slate-900">{cell(totals.mooe, true)}</td>
              <td className="px-8 py-4 text-right text-[11px] font-black text-slate-900">{cell(totals.co, true)}</td>
              <td className="px-8 py-4 text-right text-[11px] font-black text-slate-900">{cell(totals.total, true)}</td>
            </tr>
            <tr>
              <td className="px-8 py-4 text-[11px] font-bold uppercase text-slate-500">RLIP</td>
              <td className="px-8 py-4 text-right text-[11px] text-slate-500">{cell(Number(summary.rlip) || 0)}</td>
              <td className="px-8 py-4 text-right text-[11px] text-slate-500">{cell(0)}</td>
              <td className="px-8 py-4 text-right text-[11px] text-slate-500">{cell(0)}</td>
              <td className="px-8 py-4 text-right text-[11px] font-bold text-slate-500">{cell(Number(summary.rlip) || 0)}</td>
            </tr>
            <tr className="bg-emerald-600 text-white">
              <td className="px-8 py-5 text-[11px] font-black uppercase">Grand Total</td>
              <td className="px-8 py-5 text-right text-[11px] font-black">{cell(totals.ps + (Number(summary.rlip) || 0))}</td>
              <td className="px-8 py-5 text-right text-[11px] font-black">{cell(totals.mooe)}</td>
              <td className="px-8 py-5 text-right text-[11px] font-black">{cell(totals.co)}</td>
              <td className="px-8 py-5 text-right text-[13px] font-black bg-emerald-700">{cell(totals.total + (Number(summary.rlip) || 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

/* ─── Workflow Pulse (Donut Chart - Green Theme) ────────────────── */
const WorkflowPulse = ({ data, loading }) => {
  const navigate = useNavigate();

  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Draft', value: data.draft || 0, color: '#e2e8f0' },
      { name: 'For Review', value: data.review || 0, color: '#fbbf24' },
      { name: 'Approved', value: data.approved || 0, color: '#10b981' },
      { name: 'Partial', value: data.partiallyObligated || 0, color: '#3b82f6' },
      { name: 'Obligated', value: data.obligated || 0, color: '#059669' },
      { name: 'Rejected', value: data.rejected || 0, color: '#ef4444' },
    ].filter(item => item.value > 0);
  }, [data]);

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (loading) return <Skeleton className="h-[450px] rounded-[40px]" />;

  return (
    <div className="bg-white border border-slate-100 rounded-[40px] p-8 h-full flex flex-col shadow-sm hover:shadow-xl transition-all duration-500">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
            <Activity size={18} />
          </div>
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">Workflow Pulse</h3>
        </div>
        <button
          onClick={() => navigate('/review-queue')}
          className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-slate-900/10"
        >
          Manage Queues
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="w-full h-56 relative group">
          {total > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ReTooltip
                    contentStyle={{ borderRadius: '24px', border: 'none', padding: '12px 20px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-3xl font-black text-slate-900 font-mono">{total}</span>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total PRs</span>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
              <RefreshCw size={48} className="opacity-20 animate-spin-slow" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting Incoming Workflow</p>
            </div>
          )}
        </div>

        <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
          {chartData.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-1 p-3 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full ring-4 ring-white shadow-sm" style={{ backgroundColor: item.color }} />
                <span className="text-[9px] font-black text-slate-400 uppercase truncate group-hover:text-slate-600 transition-colors">{item.name}</span>
              </div>
              <span className="text-lg font-black text-slate-900 ml-4 font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Recent Transactions Table ────────────────────────────────── */
const RecentTransactionsTable = ({ transactions, loading }) => {
  if (loading) return <Skeleton className="h-[500px] rounded-[40px]" />;

  return (
    <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden flex flex-col h-[580px] shadow-sm hover:shadow-xl transition-all duration-500">
      <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
            <Activity size={18} />
          </div>
          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">Live Transactions</h4>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live Sync</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions && transactions.length > 0 ? (
              transactions.map((trx, idx) => (
                <tr key={idx} className="hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-900 uppercase group-hover:text-emerald-700">{trx.reference}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[200px]">{trx.description}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${trx.type === 'PR' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      {trx.type}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-[11px] font-mono font-bold text-slate-900">₱{formatPHP(trx.amount)}</span>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <StatusBadge status={trx.status} size="sm" />
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-[10px] text-slate-500 font-bold font-mono">
                      {new Date(trx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-20">
                    <Activity size={40} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">No Recent Activity</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-6 mt-auto border-t border-slate-50">
        <button className="w-full py-3 rounded-2xl border border-slate-100 bg-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-300">
          View All Transactions
        </button>
      </div>
    </div>
  );
};

/* ─── Audit Feed Component (Maintained Black Theme) ─────────────── */
const AuditFeed = ({ logs, loading }) => {
  const navigate = useNavigate();

  const getActionIcon = (action) => {
    if (action.includes('PR')) return <Wallet size={12} className="text-blue-400" />;
    if (action.includes('OBLIGATION')) return <ArrowDownToLine size={12} className="text-emerald-400" />;
    return <Activity size={12} className="text-slate-400" />;
  };

  if (loading) return <Skeleton className="h-96 rounded-[40px]" />;

  return (
    <div className="bg-[#0f172a] rounded-[40px] p-8 text-white flex flex-col h-[580px] shadow-2xl shadow-slate-900/50 border border-slate-800">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-xl text-blue-400">
            <History size={18} />
          </div>
          <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em]">Live Audit Intelligence</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Real-time Sync</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-6 max-h-[380px]">
        {logs && logs.length > 0 ? (
          logs.slice(0, 20).map((log, idx) => (
            <div key={idx} className="flex gap-6 group cursor-default relative">
              {idx !== logs.length - 1 && <div className="absolute left-4 top-10 bottom-[-24px] w-px bg-slate-800" />}
              <div className="flex-shrink-0 relative z-10">
                <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 transition-all duration-300 group-hover:border-blue-500 group-hover:scale-110">
                  {getActionIcon(log.action)}
                </div>
              </div>
              <div className="flex-1 flex flex-col pb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest group-hover:text-blue-400 transition-colors">{log.action.replace(/_/g, ' ')}</span>
                  <span className="text-[9px] text-slate-600 font-bold font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-[12px] text-slate-500 group-hover:text-slate-400 transition-colors leading-relaxed">
                  System detected {log.ref_type} <span className="text-slate-300 font-bold">#{log.ref_id || 'ID-TRX'}</span> interaction on financial ledger.
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-4">
            <History size={48} className="opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">System Standby • No Logs</p>
          </div>
        )}
      </div>

      <button className="mt-10 w-full py-4 rounded-2xl border border-slate-800 bg-slate-900/50 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] hover:bg-slate-800 hover:text-white transition-all duration-300">
        Access Full Security Logs
      </button>
    </div>
  );
};

/* ─── Main Executive Dashboard ─────────────────────────────────── */
const DashboardOverview = () => {
  const { executiveSummary, auditFeed, recentTransactions, loading, error, refreshBudgetData } = useBudget();
  const { selectedYear, setSelectedYear, availableYears } = useFiscalYear();

  const summary = executiveSummary || {
    totalBudget: 0, totalObligated: 0, remainingBudget: 0, utilizationRate: 0,
    ps: 0, rlip: 0, personnelTotal: 0, mooe: 0, co: 0,
    typeSummary: {},
    papComposition: [],
    workflow: {}
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <PageHeader
        title="Executive Dashboard"
        subtitle={`Real-time financial intelligence for Fiscal Year ${selectedYear}.`}
        actions={
          <div className="flex items-center gap-4">
            <button
              onClick={refreshBudgetData}
              disabled={loading}
              className="p-3 rounded-2xl border border-slate-100 bg-white hover:bg-emerald-50 hover:border-emerald-100 transition-all duration-300 shadow-sm active:scale-95"
            >
              <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''} text-emerald-600`} />
            </button>
            <div className="relative group">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none pl-6 pr-12 py-3 rounded-2xl border border-slate-100 bg-white text-slate-900 text-[11px] font-black uppercase tracking-[0.1em] cursor-pointer focus:outline-none group-hover:border-emerald-500 transition-all shadow-sm"
              >
                {(availableYears || []).map(year => (
                  <option key={year} value={year}>FY {year}</option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-500 transition-colors pointer-events-none"
              />
            </div>
          </div>
        }
      />

      {error && (
        <div className="p-5 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-rose-600 animate-bounce">
          <AlertCircle size={20} />
          <p className="text-[11px] font-black uppercase tracking-widest">System Sync Error: {error}</p>
        </div>
      )}

      {/* SECTION 1: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Budget"
          value={`₱${formatPHP(summary.totalBudget || summary.grandTotal)}`}
          subValue="Allocated Allotment"
          icon={Wallet}
          variant="primary"
          loading={loading}
        />
        <StatCard
          title="Total Obligated"
          value={`₱${formatPHP(summary.totalObligated || (summary.obligated && summary.obligated.total))}`}
          subValue="Processed Ledger"
          icon={ArrowDownToLine}
          loading={loading}
        />
        <StatCard
          title="Unobligated"
          value={`₱${formatPHP(summary.remainingBudget || (summary.balance && summary.balance.total))}`}
          subValue="Available Fund"
          icon={Clock}
          loading={loading}
        />
        <StatCard
          title="Utilization"
          value={`${(summary.utilizationRate || 0).toFixed(1)}%` }
          subValue="Absorption Rate"
          icon={Activity}
          loading={loading}
        />
      </div>

      {/* SECTION 2: Workflow & Allotment Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
        <div className="lg:col-span-2">
          <WorkflowPulse data={summary.workflow} loading={loading} />
        </div>
        <div className="lg:col-span-3">
          <FYSummaryTable summary={summary} loading={loading} />
        </div>
      </div>

      {/* SECTION 3: Live Audit & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
        <div className="lg:col-span-3">
          <RecentTransactionsTable transactions={recentTransactions} loading={loading} />
        </div>
        <div className="lg:col-span-2">
          <AuditFeed logs={auditFeed} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
