import React, { useMemo } from 'react';
import {
  Wallet,
  ArrowDownToLine,
  Clock,
  AlertCircle,
  Activity,
  PieChart,
  ClipboardList,
} from 'lucide-react';
import { useBudget } from '../../context/BudgetContext';
import { useFiscalYear } from '../../context/FiscalYearContext';
import { formatPHP } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';

/* ─── Stat Card ─────────────────────────────────────────────────── */
const StatCard = ({ title, value, subValue, icon: Icon, variant = 'default', trend }) => {
  const iconStyle = {
    default: 'bg-slate-50 text-slate-400',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50  text-amber-600',
    blue:    'bg-blue-50   text-blue-600',
  }[variant];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconStyle}`}>
          <Icon size={16} />
        </div>
        {trend && (
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-[22px] font-bold text-slate-900 tracking-tight leading-none font-mono">{value}</p>
        <p className="text-[11px] text-slate-400 mt-1.5">{subValue}</p>
      </div>
    </div>
  );
};

/* ─── Budget Component Summary ───────────────────────────────────── */
const BudgetComponentSummary = ({ totals, paps }) => {
  const formatM = (val) => `₱${(val / 1_000_000).toFixed(2)}M`;

  const nnmpPsTotal = paps
    .filter(p => ['Policy', 'PFNSS', 'PGN', 'Assistance'].includes(p.type))
    .reduce((sum, p) => sum + p.ps.operations, 0);

  const gasPsTotal = paps
    .filter(p => p.type === 'GAS')
    .reduce((sum, p) => sum + p.ps.operations, 0);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col h-full">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <PieChart size={14} className="text-slate-400" />
        <h4 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Budget Components</h4>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5">
        <div>
          <p className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Personal Services (PS)
          </p>
          <div className="pl-3 flex flex-col gap-2.5">
            {[
              { dot: 'bg-emerald-500', label: 'GAS',  val: gasPsTotal },
              { dot: 'bg-blue-500',   label: 'NNMP', val: nnmpPsTotal },
              { dot: 'bg-indigo-500', label: 'RLIP', val: totals.totalRlip },
            ].map(({ dot, label, val }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                  <span className="text-[11px] text-slate-500">{label}</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-800 font-mono">{formatM(val)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide">MOOE</p>
          <span className="text-[11px] font-semibold text-slate-800 font-mono">{formatM(totals.totalMooe)}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-emerald-100 mt-auto">
          <p className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide">Grand Total</p>
          <span className="text-[13px] font-bold text-emerald-600 font-mono underline decoration-2 underline-offset-4">
            {formatM(totals.totalAllocation)}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ─── FY Summary Matrix ──────────────────────────────────────────── */
const FYSummaryMatrix = ({ paps, totals }) => {
  const matrixData = useMemo(() => {
    const rows = ['GAS', 'Policy', 'PFNSS', 'PGN', 'Assistance'].map(name => ({
      name, ps: 0, mooe: 0, total: 0,
    }));

    paps.forEach(pap => {
      const row = rows.find(r => r.name === pap.type);
      if (row) {
        row.ps    += pap.ps.operations;
        row.mooe  += pap.mooe.allocation;
        row.total += pap.ps.operations + pap.mooe.allocation;
      }
    });

    return [
      ...rows,
      { name: 'TOTAL',       ps: totals.totalPsOps, mooe: totals.totalMooe, total: totals.totalPsOps + totals.totalMooe, isTotal: true },
      { name: 'RLIP',        ps: totals.totalRlip,  mooe: 0,                total: totals.totalRlip, isRlip: true },
      { name: 'GRAND TOTAL', ps: totals.totalPsOps + totals.totalRlip, mooe: totals.totalMooe, total: totals.totalAllocation, isGrand: true },
    ];
  }, [paps, totals]);

  const cell = (val, style = '') =>
    val > 0 ? <span className={`font-mono ${style}`}>{formatPHP(val / 1000)}</span> : <span className="text-slate-300">—</span>;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col h-full">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList size={14} className="text-slate-400" />
          <h4 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">FY Summary Matrix</h4>
        </div>
        <span className="text-[9px] font-semibold text-rose-500 uppercase tracking-widest">
          FY 2026 NEP (In Thousands)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              {['Summary', 'PS', 'MOOE', 'Grand Total'].map((h, i) => (
                <th key={h} className={`px-5 py-3 text-[9px] font-medium text-slate-400 uppercase tracking-widest ${i > 0 ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixData.map((row, idx) => (
              <tr
                key={idx}
                className={`
                  border-b border-slate-50 transition-colors
                  ${row.isGrand ? 'bg-emerald-50/60' : 'hover:bg-slate-50/60'}
                  ${row.isTotal ? 'border-t-2 border-slate-800' : ''}
                  ${row.isRlip  ? 'opacity-70' : ''}
                `}
              >
                <td className={`px-5 py-2.5 text-[11px] font-medium ${row.isGrand ? 'text-emerald-900' : 'text-slate-600'}`}>
                  {row.name}
                </td>
                <td className={`px-5 py-2.5 text-right text-[11px] ${row.isGrand ? 'text-emerald-800' : row.isTotal ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                  {cell(row.ps)}
                </td>
                <td className={`px-5 py-2.5 text-right text-[11px] ${row.isGrand ? 'text-emerald-700' : row.isTotal ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                  {cell(row.mooe)}
                </td>
                <td className={`px-5 py-2.5 text-right text-[11px] font-semibold ${row.isGrand ? 'text-emerald-900 underline decoration-2 underline-offset-4 font-bold' : row.isTotal ? 'text-slate-900' : 'text-slate-700'}`}>
                  {cell(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─── Pulse Feed ─────────────────────────────────────────────────── */
const PULSE_ITEMS = [
  { type: 'PR', status: 'Approved', user: 'Admin',    pap: 'NNMP',   time: '12m ago', ok: true  },
  { type: 'OB', status: 'Created',  user: 'Encoder',  pap: 'GAS',    time: '1h ago',  ok: true  },
  { type: 'PS', status: 'Imported', user: 'System',   pap: 'FY2026', time: '3h ago',  ok: true  },
  { type: 'PR', status: 'Returned', user: 'Reviewer', pap: 'Policy', time: '5h ago',  ok: false },
];

const PulseFeed = () => (
  <div className="bg-[#0d1a0f] rounded-2xl p-6 text-white flex flex-col h-full">
    <div className="flex items-center gap-2 mb-5">
      <Activity size={15} className="text-emerald-400" />
      <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-widest">Pulse Feed</span>
    </div>

    <div className="flex flex-col flex-1 divide-y divide-white/[0.05]">
      {PULSE_ITEMS.map((item, i) => (
        <div key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
          <div className={`w-0.5 rounded-full flex-shrink-0 self-stretch ${item.ok ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-semibold text-white">{item.type}</span>
              <span className={`text-[11px] ${item.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{item.status}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">By {item.user} for {item.pap} · {item.time}</p>
          </div>
        </div>
      ))}
    </div>

    <button className="mt-5 w-full py-2.5 rounded-xl border border-white/[0.07] bg-transparent text-[10px] font-medium text-slate-500 uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all duration-200">
      View All Audit Logs
    </button>
  </div>
);

/* ─── Main Dashboard ─────────────────────────────────────────────── */
const DashboardOverview = () => {
  const { totals, budgetData } = useBudget();
  const { selectedYear } = useFiscalYear();
  const paps = budgetData?.paps || [];

  const utilizationRate = totals.totalAllocation > 0
    ? (totals.totalObligated / totals.totalAllocation) * 100
    : 0;

  const health = utilizationRate > 90
    ? { label: 'Critical', cls: 'bg-rose-50   text-rose-700   border-rose-100',   dot: 'bg-rose-500'   }
    : utilizationRate > 75
    ? { label: 'Warning',  cls: 'bg-amber-50  text-amber-700  border-amber-100',  dot: 'bg-amber-500'  }
    : { label: 'Healthy',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' };

  return (
    <div className="space-y-5 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title="Executive Summary"
        subtitle={`Strategic overview of the Financial Work Plan for FY ${selectedYear}.`}
        actions={
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-medium uppercase tracking-widest ${health.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${health.dot}`} />
            Budget health: {health.label}
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Budget"       value={`₱${formatPHP(totals.totalAllocation)}`}                              subValue="Consolidated Appropriations"                        icon={Wallet} />
        <StatCard title="Total Obligated"    value={`₱${formatPHP(totals.totalObligated)}`}                               subValue={`${utilizationRate.toFixed(1)}% Current Utilization`} icon={ArrowDownToLine} variant="emerald" trend={12} />
        <StatCard title="Remaining Balance"  value={`₱${formatPHP(totals.totalAllocation - totals.totalObligated)}`}      subValue="Available for Obligation"                           icon={Clock}  variant="amber" />
        <StatCard title="Workflow Queue"     value="12 Items"                                                              subValue="5 Overdue (Aging > 3 days)"                         icon={AlertCircle} variant="blue" />
      </div>

      {/* Mid Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <BudgetComponentSummary totals={totals} paps={paps} />
        <div className="lg:col-span-3">
          <FYSummaryMatrix paps={paps} totals={totals} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Operational Pulse */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-emerald-500" />
              <h4 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Operational Pulse</h4>
            </div>
            <button className="text-[10px] font-medium text-emerald-600 hover:underline uppercase tracking-wide">
              View Analytics →
            </button>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {[
              { label: 'Approved PRs',   val: '85',  warn: false },
              { label: 'Active OBs',     val: '42',  warn: false },
              { label: 'Pending Review', val: '12',  warn: true  },
            ].map(({ label, val, warn }) => (
              <div key={label} className="p-3 text-center">
                <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className={`text-[18px] font-bold font-mono ${warn ? 'text-rose-500' : 'text-slate-800'}`}>{val}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Avg. PAP Utilization</span>
              <span className="text-[11px] font-semibold text-emerald-600">{utilizationRate.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${utilizationRate}%` }} />
            </div>
          </div>
        </div>

        <PulseFeed />
      </div>
    </div>
  );
};

export default DashboardOverview;
