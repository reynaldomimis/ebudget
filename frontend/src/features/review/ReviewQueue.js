import React, { useState, useEffect } from "react";
import {
  FileSearch,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  RotateCcw,
  Loader2,
  XCircle,
} from "lucide-react";
import { prAPI } from "../../services/api";
import { formatPHP } from "../../utils/formatters";
import ToastService from "../../services/ToastService";

const QueueItem = ({ row, onAction }) => {
  const insufficient = row.remaining_balance < row.pr_amount;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md hover:shadow-slate-900/5 transition-all duration-200">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
            <FileSearch size={18} />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2 mb-1.5">
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-100">
                MOOE
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
                <Clock size={11} /> Submitted {new Date(row.transaction_date).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-8 flex-shrink-0">
          <div className="text-right">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              PR Amount
            </p>
            <p className="text-[13px] font-semibold font-mono text-slate-800">
              ₱{formatPHP(row.pr_amount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              Budget Status
            </p>
            <p className={`text-[13px] font-semibold uppercase ${(row.budget_status || '').toLowerCase() === 'fully_obligated' ? "text-red-500" : "text-emerald-600"}`}>
              {(row.budget_status || '').replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          Waiting for technical verification
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAction(row.id, 'reject')}
            className="flex items-center gap-1.5 px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl text-[11px] font-medium transition-colors"
          >
            <XCircle size={13} /> Reject
          </button>
          <button
            onClick={() => onAction(row.id, 'approve')}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl text-[11px] font-medium transition-colors shadow-sm shadow-emerald-200"
          >
            <CheckCircle2 size={14} /> Approve
          </button>
        </div>
      </div>
    </div>
  );
};

const ReviewQueue = () => {
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
        setItems((res.data || []).filter(pr => pr.workflow_status === 'For Review'));
      }
    } catch (err) {
      console.error("Failed to fetch review queue", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') {
        await prAPI.approve(id);
        ToastService.toastSuccess("PR approved successfully");
      } else {
        const remarks = window.prompt("Enter rejection remarks:");
        if (remarks === null) return;
        await prAPI.reject(id, remarks);
        ToastService.toastSuccess("PR rejected");
      }
      fetchQueue();
    } catch (err) {
      ToastService.toastError(err.message || "Action failed");
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
            Review Queue ({items.length})
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
            <span className="text-[11px] text-slate-400">
              Technical Review Phase
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
              placeholder="Search PR No or Purpose…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all w-56"
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
            <QueueItem key={item.id} row={item} onAction={handleAction} />
          ))}
          {filtered.length === 0 && (
            <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm italic">
              No PRs currently waiting for review.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewQueue;
