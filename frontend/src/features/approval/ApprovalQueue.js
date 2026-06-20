import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Activity,
  History,
  TrendingDown,
  Loader2,
  Wallet,
} from "lucide-react";
import { prAPI } from "../../services/api";
import { formatPHP } from "../../utils/formatters";

const ApprovalQueueItem = ({ row, onNavigate }) => {
  const impactPct = ((row.pr_amount / (row.remaining_balance + row.pr_amount)) * 100).toFixed(1);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md hover:shadow-slate-900/5 transition-all duration-200">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2 mb-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                row.workflow_status === 'Approved'
                  ? "text-blue-700 bg-blue-50 border-blue-100"
                  : "text-amber-700 bg-amber-50 border-amber-100"
              }`}>
                {row.workflow_status === 'Approved' ? 'Approved PR' : 'Partial Obligation'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                PR NO: {row.prno}
              </span>
            </div>
            <h4 className="text-[13px] font-semibold text-slate-800">
              {row.purpose}
            </h4>
            <div className="flex items-center gap-4 mt-1.5">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <History size={11} /> Ready for Obligation
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <Activity size={11} /> Funds Verified
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-8 flex-shrink-0">
          {[
            {
              label: "PR Amount",
              val: formatPHP(row.pr_amount),
              color: "text-slate-800",
            },
            {
              label: "Unobligated",
              val: formatPHP(row.remaining_balance),
              color: "text-emerald-600",
            },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-right">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                {label}
              </p>
              <p className={`text-[13px] font-semibold font-mono ${color}`}>
                ₱{val}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-3 mb-5">
        <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingDown size={12} className="text-emerald-500" />
            <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">
              Budget Insight
            </span>
          </div>
          <p className="text-[12px] text-emerald-700 leading-relaxed">
            This request represents {impactPct}% of the linked allocation's remaining balance.
            All technical reviews completed.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          <span className="text-[11px] text-slate-400">
            Action: Formal Obligation Entry
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('create-obligation', { prno: row.prno })}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl text-[11px] font-medium transition-colors shadow-sm shadow-emerald-200"
          >
            <Wallet size={14} /> Create Obligation
          </button>
        </div>
      </div>
    </div>
  );
};

const ApprovalQueue = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await prAPI.getAll();
      if (res.success) {
        setItems((res.data || []).filter(pr => pr.workflow_status === 'Approved' || pr.workflow_status === 'Partially Obligated'));
      }
    } catch (err) {
      console.error("Failed to fetch approval queue", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter(
    (i) =>
      (i.purpose || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.prno || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">
            Approval Queue ({items.length})
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
            <span className="text-[11px] text-slate-400">
              Procurement &amp; Financial Obligation Phase
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search approved PRs…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all w-56"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin mb-2" size={24} />
          <span className="text-xs font-bold uppercase tracking-widest">Loading Queue...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <ApprovalQueueItem key={item.id} row={item} onNavigate={onNavigate} />
          ))}
          {filtered.length === 0 && (
            <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm italic">
              No approved PRs currently waiting for obligation.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApprovalQueue;
