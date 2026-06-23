import React, { useMemo } from 'react';
import {
  Wallet,
  ArrowDownToLine,
  Clock,
  Activity,
  History,
  RefreshCw,
  ChevronDown,
  ClipboardList,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBudget } from '../../context/BudgetContext';
import { useFiscalYear } from '../../context/FiscalYearContext';
import { formatPHP } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';

/* ─── Stat Card Component (Compact) ────────────────────────── */
const StatCard = ({ title, value, subValue, icon: Icon, variant = 'default', loading }) => {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-sm">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-2 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 flex flex-col gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-500 relative overflow-hidden group ${variant === 'primary' ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-200' : 'bg-white border-slate-100 shadow-sm'}`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 ${variant === 'primary' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
          <Icon size={20} />
        </div>
        {variant !== 'primary' && (
           <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <CheckCircle2 size={12} className="text-emerald-500" />
           </div>
        )}
      </div>
      <div>
        <p className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1.5 ${variant === 'primary' ? 'text-green-100' : 'text-slate-400'}`}>{title}</p>
        <p className={`text-xl font-black tracking-tight leading-none font-mono ${variant === 'primary' ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </p>
        <p className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${variant === 'primary' ? 'text-green-200' : 'text-emerald-600'}`}>{subValue}</p>
      </div>
      <div className={`absolute -right-3 -bottom-3 w-20 h-20 rounded-full blur-3xl opacity-10 transition-all duration-700 group-hover:opacity-20 ${variant === 'primary' ? 'bg-white' : 'bg-green-500'}`} />
    </div>
  );
};

/* ─── Unified Summary Table ────────────────────────────────── */
const FYSummaryTable = ({ summary, loading, title = "FY Allotment Summary", variant = "FY" }) => {
  const groupedData = useMemo(() => {
    if (!summary || !Array.isArray(summary.papComposition)) return [];

    // strictly mapping by official DBM codes for government accounting accuracy
    const categories = [
      { name: 'GAS', typeCode: '100000000000000' },
      { name: 'Policy', papCode: '310100100001000' },
      { name: 'PFNSS', papCode: '310100100002000' },
      { name: 'PGN', papCode: '310100100003000' },
      { name: 'Assistance', papCode: '310100100004000' }
    ];

    const data = categories.map(cat => {
      const matches = summary.papComposition.filter(row => {
        if (cat.typeCode) return row.type_code === cat.typeCode;
        if (cat.papCode) return row.pap_code === cat.papCode;
        return false;
      });

      return {
        name: cat.name,
        ps: matches.reduce((sum, r) => sum + (r.ps || 0), 0),
        rlip: matches.reduce((sum, r) => sum + (r.rlip || 0), 0),
        mooe: matches.reduce((sum, r) => sum + (r.mooe || 0), 0),
        co: matches.reduce((sum, r) => sum + (r.co || 0), 0),
        total: matches.reduce((sum, r) => sum + ((r.ps || 0) + (r.rlip || 0) + (r.mooe || 0) + (r.co || 0)), 0)
      };
    });

    return data.filter(d => d.total > 0);
  }, [summary]);

  const totals = useMemo(() => {
    return groupedData.reduce((acc, row) => ({
      ps: acc.ps + row.ps,
      rlip: acc.rlip + row.rlip,
      mooe: acc.mooe + row.mooe,
      co: acc.co + row.co,
      total: acc.total + row.total
    }), { ps: 0, rlip: 0, mooe: 0, co: 0, total: 0 });
  }, [groupedData]);

  if (loading) return <Skeleton className="h-[400px] rounded-lg" />;
  if (!summary) return null;

  const cell = (val, isBold = false) =>
    val > 0 ? (
      <span className={`font-mono ${isBold ? 'font-black' : 'font-bold'}`}>
        ₱{formatPHP(val)}
      </span>
    ) : (
      <span className="text-slate-300">—</span>
    );

  const isPS = variant === "PS";

  return (
    <div className="bg-white border border-slate-100 rounded-lg overflow-hidden flex flex-col h-full shadow-sm hover:shadow-lg transition-all duration-500">
      <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-emerald-50 rounded text-emerald-600">
            <ClipboardList size={14} />
          </div>
          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.1em]">{title}</h4>
        </div>
      </div>

      <div className={`overflow-x-auto custom-scrollbar ${isPS ? 'flex-1' : ''}`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Summary</th>
              <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">PS</th>
              {isPS ? (
                <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">RLIP</th>
              ) : (
                <>
                  <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">MOOE</th>
                  <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">CO</th>
                </>
              )}
              <th className="px-2 py-2 text-[8px] font-black text-slate-900 uppercase tracking-widest text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {groupedData.length > 0 ? (
              groupedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-2 py-1.5 text-[10px] font-bold text-slate-600 group-hover:text-emerald-700 uppercase">{row.name}</td>
                  <td className="px-2 py-1.5 text-right text-[10px] text-slate-500">{cell(row.ps)}</td>
                  {isPS ? (
                    <td className="px-2 py-1.5 text-right text-[10px] text-slate-500">{cell(row.rlip)}</td>
                  ) : (
                    <>
                      <td className="px-2 py-1.5 text-right text-[10px] text-slate-500">{cell(row.mooe)}</td>
                      <td className="px-2 py-1.5 text-right text-[10px] text-slate-500">{cell(row.co)}</td>
                    </>
                  )}
                  <td className="px-2 py-1.5 text-right text-[10px] font-black text-slate-900">
                    {cell(isPS ? row.ps + row.rlip : row.total)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isPS ? 4 : 5} className="px-6 py-12 text-center text-slate-400 text-[9px] uppercase font-black">No Data Found</td>
              </tr>
            )}
          </tbody>
          {!isPS && (
            <tfoot className="border-t border-slate-100">
              <tr className="bg-slate-50/30">
                <td className="px-2 py-1.5 text-[9px] font-black uppercase text-slate-900">Total</td>
                <td className="px-2 py-1.5 text-right text-[9px] font-black text-slate-900">{cell(totals.ps, true)}</td>
                <td className="px-2 py-1.5 text-right text-[9px] font-black text-slate-900">{cell(totals.mooe, true)}</td>
                <td className="px-2 py-1.5 text-right text-[9px] font-black text-slate-900">{cell(totals.co, true)}</td>
                <td className="px-2 py-1.5 text-right text-[9px] font-black text-slate-900">{cell(totals.ps + totals.mooe + totals.co, true)}</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 text-[9px] font-bold uppercase text-slate-500">RLIP</td>
                <td className="px-2 py-1.5 text-right text-[9px] text-slate-500">{cell(Number(summary.rlip) || 0)}</td>
                <td className="px-2 py-1.5 text-right text-[9px] text-slate-500">{cell(0)}</td>
                <td className="px-2 py-1.5 text-right text-[9px] text-slate-500">{cell(0)}</td>
                <td className="px-2 py-1.5 text-right text-[9px] font-bold text-slate-500">{cell(Number(summary.rlip) || 0)}</td>
              </tr>
              <tr className="bg-emerald-600 text-white">
                <td className="px-2 py-2 text-[10px] font-black uppercase">Grand Total</td>
                <td className="px-2 py-2 text-right text-[10px] font-black">{cell(totals.ps + (Number(summary.rlip) || 0))}</td>
                <td className="px-2 py-2 text-right text-[10px] font-black">{cell(totals.mooe)}</td>
                <td className="px-2 py-2 text-right text-[10px] font-black">{cell(totals.co)}</td>
                <td className="px-2 py-2 text-right text-[10px] font-black bg-emerald-700">{cell(totals.total + (Number(summary.rlip) || 0))}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {isPS && (
        <div className="mt-auto border-t border-slate-100 bg-emerald-600 text-white">
          <table className="w-full text-left border-collapse">
            <tfoot>
              <tr>
                <td className="px-2 py-2 text-[10px] font-black uppercase w-[25.5%]">Grand Total</td>
                <td className="px-2 py-2 text-right text-[10px] font-black w-[23.5%]">{cell(totals.ps)}</td>
                <td className="px-2 py-2 text-right text-[10px] font-black w-[23.5%]">{cell(totals.rlip)}</td>
                <td className="px-2 py-2 text-right text-[10px] font-black bg-emerald-700">{cell(totals.ps + totals.rlip)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

/* ─── Recent Transactions Table ────────────────────────────────── */
const RecentTransactionsTable = ({ transactions, loading }) => {
  const { selectedYear } = useFiscalYear();
  if (loading) return <Skeleton className="h-[400px] rounded-lg" />;

  return (
    <div className="bg-white border border-slate-100 rounded-lg overflow-hidden flex flex-col h-[520px] shadow-sm hover:shadow-lg transition-all duration-500">
      <div className="px-4 py-2.5 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-emerald-50 rounded text-emerald-600">
            <Activity size={14} />
          </div>
          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.1em]">Live Transactions</h4>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Live Sync</span>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 sticky top-0 z-10">
              <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
              <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Type</th>
              <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
              <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions && transactions.length > 0 ? (
              transactions.map((trx, idx) => (
                <tr key={idx} className="hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-2 py-1.5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-900 uppercase group-hover:text-emerald-700">{trx.reference}</span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase truncate max-w-[150px]">{trx.description}</span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${trx.type === 'PR' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      {trx.type}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <span className="text-[10px] font-mono font-bold text-slate-900">₱{formatPHP(trx.amount)}</span>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <StatusBadge status={trx.status} size="sm" />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <span className="text-[9px] text-slate-500 font-bold font-mono">
                      {new Date(trx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-[9px] uppercase font-black">No Activity for {selectedYear}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-3 mt-auto border-t border-slate-50">
        <button className="w-full py-2 rounded border border-slate-100 bg-slate-50 text-[8px] font-black text-slate-500 uppercase tracking-[0.15em] hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-300">
          View All Transactions
        </button>
      </div>
    </div>
  );
};

/* ─── Audit Feed Component ────────────────────────────────────── */
const AuditFeed = ({ logs, loading }) => {
  const navigate = useNavigate();

  const getActionIcon = (action) => {
    if (action.includes('PR')) return <Wallet size={10} className="text-blue-400" />;
    if (action.includes('OBLIGATION')) return <ArrowDownToLine size={10} className="text-emerald-400" />;
    return <Activity size={10} className="text-slate-400" />;
  };

  if (loading) return <Skeleton className="h-96 rounded-lg" />;

  return (
    <div className="bg-[#0f172a] rounded-lg p-4 text-white flex flex-col h-[520px] shadow-2xl shadow-slate-900/50 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-slate-800 rounded text-blue-400">
            <History size={14} />
          </div>
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.15em]">Live Audit Intelligence</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Real-time Sync</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {logs && logs.length > 0 ? (
          logs.slice(0, 20).map((log, idx) => (
            <div key={idx} className="flex gap-3 group cursor-default relative">
              {idx !== logs.length - 1 && <div className="absolute left-2.5 top-6 bottom-[-16px] w-px bg-slate-800" />}
              <div className="flex-shrink-0 relative z-10">
                <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 transition-all duration-300 group-hover:border-blue-500 group-hover:scale-110">
                  {getActionIcon(log.action)}
                </div>
              </div>
              <div className="flex-1 flex flex-col pb-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest group-hover:text-blue-400 transition-colors">{log.action.replace(/_/g, ' ')}</span>
                  <span className="text-[8px] text-slate-600 font-bold font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors leading-relaxed">
                  System detected {log.ref_type} <span className="text-slate-300 font-bold">#{log.ref_id || 'ID-TRX'}</span> interaction.
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-2">
            <History size={32} className="opacity-10" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em]">No Logs</p>
          </div>
        )}
      </div>

      <button className="mt-4 w-full py-2.5 rounded border border-slate-800 bg-slate-900/50 text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] hover:bg-slate-800 hover:text-white transition-all duration-300">
        Access Full Security Logs
      </button>
    </div>
  );
};

/* ─── Empty State Component ─────────────────────────────────── */
const DashboardEmptyState = ({ year, onRefresh }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-slate-100 rounded-xl shadow-sm animate-in fade-in zoom-in duration-700">
    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
      <ClipboardList size={40} className="text-emerald-500 opacity-40" />
    </div>
    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">No Financial Data for FY {year}</h3>
    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider text-center max-w-md leading-relaxed">
      The system couldn't find any allotment or transaction records for this fiscal year.
      Please ensure you have uploaded the budget plan or selected the correct period.
    </p>
  </div>
);

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

  const hasData = useMemo(() => {
    return summary.totalBudget > 0 || (recentTransactions && recentTransactions.length > 0);
  }, [summary, recentTransactions]);

  return (
    <div className="space-y-4 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <PageHeader
        title="Executive Dashboard"
        subtitle={`Real-time financial intelligence for Fiscal Year ${selectedYear}.`}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={refreshBudgetData}
              disabled={loading}
              className="p-2 rounded border border-slate-100 bg-white hover:bg-emerald-50 hover:border-emerald-100 transition-all duration-300 shadow-sm active:scale-95"
            >
              <RefreshCw size={14} className={`${loading ? 'animate-spin' : ''} text-emerald-600`} />
            </button>
            <div className="relative group">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded border border-slate-100 bg-white text-slate-900 text-[10px] font-black uppercase tracking-[0.1em] cursor-pointer focus:outline-none group-hover:border-emerald-500 transition-all shadow-sm"
              >
                {(availableYears || []).map(year => (
                  <option key={year} value={year}>FY {year}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-500 transition-colors pointer-events-none"
              />
            </div>
          </div>
        }
      />

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded flex items-center gap-3 text-rose-600 animate-bounce">
          <AlertCircle size={18} />
          <p className="text-[10px] font-black uppercase tracking-widest">System Sync Error: {error}</p>
        </div>
      )}

      {!loading && !hasData && !error ? (
        <DashboardEmptyState year={selectedYear} onRefresh={refreshBudgetData} />
      ) : (
        <>
          {/* SECTION 1: KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Budget"
              value={`₱${formatPHP(summary.totalBudget)}`}
              subValue="Allocated Allotment"
              icon={Wallet}
              variant="primary"
              loading={loading}
            />
            <StatCard
              title="Total Obligated"
              value={`₱${formatPHP(summary.totalObligated)}`}
              subValue="Processed Ledger"
              icon={ArrowDownToLine}
              loading={loading}
            />
            <StatCard
              title="Unobligated"
              value={`₱${formatPHP(summary.remainingBudget)}`}
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

          {/* SECTION 2: PS Summary & MOOE Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
            <div className="lg:col-span-2">
              <FYSummaryTable summary={summary} loading={loading} title="PS Summary" variant="PS" />
            </div>
            <div className="lg:col-span-3">
              <FYSummaryTable summary={summary} loading={loading} title="MOOE Summary" variant="FY" />
            </div>
          </div>

          {/* SECTION 3: Live Audit & Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
            <div className="lg:col-span-3">
              <RecentTransactionsTable transactions={recentTransactions} loading={loading} />
            </div>
            <div className="lg:col-span-2">
              <AuditFeed logs={auditFeed} loading={loading} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardOverview;
