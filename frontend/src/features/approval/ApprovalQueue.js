import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  MoreVertical,
  Activity,
  Lock,
  History,
  MessageSquare,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';

const ApprovalQueueItem = ({ id, description, type, objectCode, amount, remainingBudget, time, reviewer, remarks, fundAvailability }) => (
  <div className="group bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-300 mb-6">
    <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <ShieldCheck size={22} />
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                        type === 'PS' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>{type} ALLOTMENT</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OBJ: {objectCode}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">REG: {id}</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{description}</h4>
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                        <History size={12} />
                        Reviewed by {reviewer}
                    </div>
                    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${fundAvailability ? 'text-emerald-600' : 'text-rose-600'}`}>
                        <Activity size={12} />
                        {fundAvailability ? 'Funds Available' : 'Insufficient Funds'}
                    </div>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-10">
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Auth. Request</p>
                <p className="text-sm font-black text-slate-900 font-mono">₱{amount.toLocaleString()}</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
                <p className="text-sm font-black text-slate-900 font-mono">₱{remainingBudget.toLocaleString()}</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Post-Approval</p>
                <p className={`text-sm font-black font-mono ${remainingBudget - amount < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                    ₱{(remainingBudget - amount).toLocaleString()}
                </p>
            </div>
        </div>
    </div>

    {/* Reviewer Remarks & Impact Summary */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={14} className="text-blue-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technical Remarks</span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">"{remarks}"</p>
        </div>
        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
            <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={14} className="text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Budget Impact Summary</span>
            </div>
            <p className="text-xs text-emerald-700 font-bold">
                Reduces total uncommitted {type} balance by {((amount / remainingBudget) * 100).toFixed(1)}%. Priority execution recommended.
            </p>
        </div>
    </div>

    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Step: Executive Approval</span>
            </div>
        </div>

        <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                <XCircle size={14} /> Reject
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
                <CheckCircle2 size={16} /> Approve
            </button>
        </div>
    </div>
  </div>
);

const ApprovalQueue = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="w-full py-8 px-6 animate-in fade-in duration-700">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">
            <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Approval <span className="text-slate-300 italic">Queue</span></h2>
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorization & Fund Commitment Phase</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Search for approval..."
                    className="pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all w-64 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 hover:shadow-lg transition-all">
                <Filter size={20} />
            </button>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {[
            {
                id: 'AUTH-992',
                description: 'National Integrated Nutrition Info System',
                type: 'MOOE',
                objectCode: '5020301000',
                amount: 15400000,
                remainingBudget: 45000000,
                time: 'Oct 12, 2024',
                reviewer: 'D. Reyes (Budget)',
                remarks: 'Technical specs validated. Aligns with ICT master plan. Funds available in Q4 allocation.',
                fundAvailability: true
            },
            {
                id: 'AUTH-995',
                description: 'Personnel Benefits - Q4 Adjustment',
                type: 'PS',
                objectCode: '5010201001',
                amount: 8200000,
                remainingBudget: 12500000,
                time: 'Oct 14, 2024',
                reviewer: 'M. Santos (HR)',
                remarks: 'Computed based on new DBM circular. Mandatory obligation.',
                fundAvailability: true
            },
            {
                id: 'AUTH-1002',
                description: 'Regional Monitoring - Mindanao Cluster',
                type: 'MOOE',
                objectCode: '5020201000',
                amount: 4200000,
                remainingBudget: 3800000,
                time: 'Oct 15, 2024',
                reviewer: 'L. Tan (Ops)',
                remarks: 'Urgent monitoring required for project evaluation. Requires real-time budget augmentation.',
                fundAvailability: false
            },
        ].map((item, idx) => (
            <ApprovalQueueItem key={idx} {...item} />
        ))}
      </div>

      {/* Empty State Footer */}
      <div className="mt-16 p-12 rounded-[40px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                <ShieldCheck size={32} />
            </div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Queue integrity valid</h4>
            <p className="text-xs text-slate-400 font-medium mt-1">All processed items have been synchronized with the registry audit trail.</p>
      </div>
    </div>
  );
};

export default ApprovalQueue;
