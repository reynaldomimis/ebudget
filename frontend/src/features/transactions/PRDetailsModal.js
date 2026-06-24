import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  X, FileText, Calendar, Building2, Package,
  CheckCircle2, AlertCircle, Download, Printer,
  Tag, Info, ShoppingCart
} from 'lucide-react';
import { formatPHP } from '../../utils/formatters';
import { prAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Skeleton from '../../components/common/Skeleton';

const PRDetailsModal = ({ isOpen, onClose, prId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && prId) {
      fetchDetails();
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, prId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await prAPI.getById(prId);
      if (res.success) setData(res.data);
    } catch (err) {
      console.error("Failed to fetch PR details", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // PREMIUM UI CONTENT
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop with Glassmorphism */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-4xl max-h-screen sm:max-h-[90vh] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-12 duration-500 ease-out">

        {/* Header Section */}
        <div className="px-6 py-5 sm:px-10 sm:py-8 border-b border-slate-100 flex items-center justify-between bg-white/80 sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-primary-600 text-white rounded-2xl shadow-xl shadow-primary-200 flex items-center justify-center flex-shrink-0">
              <FileText size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                  {loading ? <Skeleton className="w-40 h-8" /> : data.prno}
                </h2>
                {!loading && <StatusBadge status={data.workflow_status} size="sm" />}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Calendar size={14} className="text-primary-500" />
                {loading ? <Skeleton className="w-32 h-3" /> : `Created on ${new Date(data.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-10 custom-scrollbar">
          {loading ? (
            <div className="space-y-8">
                <div className="grid grid-cols-3 gap-4"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>
                <Skeleton className="w-full h-64 rounded-2xl" />
            </div>
          ) : (
            <>
              {/* Financial Dashboard Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard label="Grand Total" value={data.pr_amount} color="emerald" />
                <SummaryCard label="Obligated" value={data.obligated_amount} color="blue" />
                <SummaryCard label="Available Balance" value={data.remaining_balance} color="slate" />
              </div>

              {/* Description Box */}
              <div className="group">
                <SectionTitle icon={Info} title="Purpose & Justification" />
                <div className="mt-4 bg-slate-50 p-8 rounded-3xl border border-slate-100 italic text-slate-600 leading-relaxed text-sm relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-primary-500/20" />
                   "{data.purpose}"
                </div>
              </div>

              {/* Source Context Grid */}
              <div>
                <SectionTitle icon={Tag} title="Budget Allocation Context" />
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
                   <DetailRow icon={Building2} label="Requesting Office" value={data.office} />
                   <DetailRow icon={Package} label="Program Component" value={data.pap_type} />
                   <DetailRow icon={Tag} label="Major Expense Item" value={data.expense_items} />
                   <DetailRow icon={CheckCircle2} label="Specific Sub-Item" value={data.expense_items_sub || 'Not Specified'} />
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <SectionTitle icon={ShoppingCart} title="Detailed Line Items" />
                <div className="mt-4 border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="px-8 py-5 w-16">#</th>
                        <th className="px-4 py-5">Description of Requirements</th>
                        <th className="px-4 py-5 text-center">Qty</th>
                        <th className="px-4 py-5 text-right">Unit Cost</th>
                        <th className="px-8 py-5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(data.items || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-8 py-5 text-xs font-black text-slate-300">{String(idx + 1).padStart(2, '0')}</td>
                          <td className="px-4 py-5 text-sm font-bold text-slate-800">{item.description}</td>
                          <td className="px-4 py-5 text-xs text-center font-mono">
                            <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold">{item.quantity} {item.unit}</span>
                          </td>
                          <td className="px-4 py-5 text-xs text-right font-mono text-slate-500 font-bold">₱{formatPHP(item.unit_cost)}</td>
                          <td className="px-8 py-5 text-sm text-right font-black text-primary-700 font-mono">₱{formatPHP(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Remarks/History */}
              {data.remarks && (
                <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl flex items-start gap-4">
                  <div className="p-3 bg-rose-500 text-white rounded-2xl">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">Administrative Remarks</h4>
                    <p className="text-sm font-bold text-rose-900 leading-relaxed">{data.remarks}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-10 py-8 border-t border-slate-100 flex items-center justify-end bg-white">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-12 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <X size={18} />
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

// --- SUB-COMPONENTS FOR CLEANER CODE ---

const SummaryCard = ({ label, value, color }) => {
    const configs = {
        emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
        blue: "bg-blue-50 border-blue-100 text-blue-600",
        slate: "bg-slate-50 border-slate-100 text-slate-500"
    };
    return (
        <div className={`p-6 rounded-[24px] border ${configs[color]}`}>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-80 mb-3">{label}</p>
            <h3 className="text-2xl font-black font-mono tracking-tighter text-slate-900">₱{formatPHP(value)}</h3>
        </div>
    );
};

const SectionTitle = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-3 border-l-4 border-primary-600 pl-4 py-1">
        <Icon size={18} className="text-primary-600" />
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.15em]">{title}</h4>
    </div>
);

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-5">
    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary-500 transition-colors">
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs font-bold text-slate-900 leading-tight">{value || 'N/A'}</p>
    </div>
  </div>
);

const FooterButton = ({ icon: Icon, label }) => (
    <button className="flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-2xl transition-all border border-slate-200">
        <Icon size={16} /> {label}
    </button>
);

export default PRDetailsModal;
