import React, { useState } from 'react';
import {
  FileSearch,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  MoreVertical,
  Activity,
  Paperclip,
  MessageSquare,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

const QueueItem = ({ id, description, type, objectCode, amount, remainingBudget, time, attachments, notes }) => (
  <div className="group bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-300 mb-4">
    <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <FileSearch size={22} />
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{type}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OBJ: {objectCode}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {id}</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{description}</h4>
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                        <Clock size={12} />
                        Submitted {time}
                    </div>
                    {attachments > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase">
                            <Paperclip size={12} />
                            {attachments} Attachments
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="flex items-center gap-12">
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Requested Amount</p>
                <p className="text-sm font-black text-slate-900 font-mono">₱{amount.toLocaleString()}</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaining Balance</p>
                <p className={`text-sm font-black font-mono ${remainingBudget < amount ? 'text-rose-500' : 'text-emerald-600'}`}>
                    ₱{remainingBudget.toLocaleString()}
                </p>
            </div>
        </div>
    </div>

    {notes && (
        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-3">
            <MessageSquare size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reviewer Notes</p>
                <p className="text-xs text-slate-600 font-medium italic">"{notes}"</p>
            </div>
        </div>
    )}

    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
        <div className="flex items-center gap-6">
            <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">
                        {String.fromCharCode(64 + i)}
                    </div>
                ))}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3 Steps in Timeline</span>
        </div>

        <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                <RotateCcw size={14} /> Return
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                <CheckCircle2 size={16} /> Recommend
            </button>
        </div>
    </div>
  </div>
);

const ReviewQueue = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="w-full py-8 px-6 animate-in fade-in duration-700">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">
            <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Review <span className="text-slate-300 italic">Queue</span></h2>
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validation & Technical Compliance Phase</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Search proposals..."
                    className="pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all w-64 shadow-sm"
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
            { id: 'WFP-24-001', description: 'National Nutrition Month Campaign', type: 'MOOE', objectCode: '5020201000', amount: 1250000, remainingBudget: 4500000, time: '2h ago', attachments: 3, notes: 'Justification for venue rental needs verification against regional rates.' },
            { id: 'WFP-24-002', description: 'Annual HR Training & Development', type: 'PS', objectCode: '5010201001', amount: 450000, remainingBudget: 1200000, time: '4h ago', attachments: 1, notes: 'Training modules align with CSC requirements.' },
            { id: 'WFP-24-003', description: 'Office Supplies & IT Infrastructure', type: 'MOOE', objectCode: '5020301002', amount: 890000, remainingBudget: 850000, time: '1d ago', attachments: 5, notes: 'Requested amount exceeds current remaining balance by ₱40,000.' },
        ].map((item, idx) => (
            <QueueItem key={idx} {...item} />
        ))}
      </div>

      {/* Load More */}
      <div className="mt-12 flex justify-center">
        <button className="px-8 py-4 bg-slate-50 text-slate-400 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all duration-300">
            Show more items
        </button>
      </div>
    </div>
  );
};

export default ReviewQueue;
