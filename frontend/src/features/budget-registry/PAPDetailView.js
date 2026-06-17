import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Wallet,
  Users,
  LifeBuoy,
  Repeat,
  TrendingUp,
  Paperclip,
  Activity,
  Calendar,
  ShieldCheck,
  Package
} from 'lucide-react';
import { useBudget } from '../../context/BudgetContext';

const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`
      flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all
      ${active
        ? 'border-emerald-600 text-emerald-700 bg-emerald-50/30'
        : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
    `}
  >
    <Icon size={14} />
    {label}
  </button>
);

const PAPDetailView = ({ papId, onBack }) => {
  const { budgetData } = useBudget();
  const [activeTab, setActiveTab] = useState('overview');

  const pap = budgetData.paps.find(p => p.id === papId);

  if (!pap) return <div>PAP not found</div>;

  const psOps = pap.ps.operations;
  const rlip = pap.ps.rlip;
  const mooe = pap.mooe.allocation;
  const totalAlloc = psOps + rlip + mooe;

  const psOblig = pap.ps.items.reduce((s, i) => s + i.obligated, 0);
  const mooeOblig = pap.mooe.items.reduce((s, i) => s + i.obligated, 0);
  const totalOblig = psOblig + mooeOblig;
  const remaining = totalAlloc - totalOblig;

  const mockTransactions = [
    { type: 'Obligation', ref: 'OB-2024-1054', date: '2024-05-12', status: 'Approved', amount: 50000, source: 'PS' },
    { type: 'PR', ref: 'PR-2024-0012', date: '2024-05-11', status: 'In Review', amount: 15000, source: 'MOOE' },
    { type: 'Obligation', ref: 'OB-2024-1053', date: '2024-05-10', status: 'Approved', amount: 12000, source: 'MOOE' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex gap-4 items-start">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-widest">{pap.type}</span>
              <span className="font-mono text-xs font-bold text-slate-400">{pap.code}</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight">
              {pap.description.split(' ').slice(0, -1).join(' ')} <span className="text-slate-300 italic">{pap.description.split(' ').slice(-1)}</span>
            </h2>
          </div>
        </div>
        <div className="text-right border-l border-slate-100 pl-6 hidden md:block">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Budget Context</p>
           <p className="text-2xl font-mono font-black text-slate-900 tracking-tighter">₱{totalAlloc.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="flex border-b border-slate-100 bg-slate-50/50 overflow-x-auto no-scrollbar">
          <TabButton id="overview" label="Overview" icon={Wallet} active={activeTab === 'overview'} onClick={setActiveTab} />
          <TabButton id="ps" label="PS Operations" icon={Users} active={activeTab === 'ps'} onClick={setActiveTab} />
          <TabButton id="rlip" label="RLIP" icon={LifeBuoy} active={activeTab === 'rlip'} onClick={setActiveTab} />
          <TabButton id="mooe" label="MOOE" icon={Package} active={activeTab === 'mooe'} onClick={setActiveTab} />
          <TabButton id="transactions" label="Transactions" icon={TrendingUp} active={activeTab === 'transactions'} onClick={setActiveTab} />
          <TabButton id="attachments" label="Attachments" icon={Paperclip} active={activeTab === 'attachments'} onClick={setActiveTab} />
        </div>

        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PS Operations</p>
                     <p className="text-xl font-mono font-bold text-slate-800">₱{psOps.toLocaleString()}</p>
                  </div>
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">RLIP</p>
                     <p className="text-xl font-mono font-bold text-slate-500">₱{rlip.toLocaleString()}</p>
                  </div>
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">MOOE</p>
                     <p className="text-xl font-mono font-bold text-amber-600">₱{mooe.toLocaleString()}</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-8 rounded-2xl bg-emerald-600 text-white shadow-lg md:col-span-1">
                     <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-2">Remaining Allotment</p>
                     <p className="text-3xl font-mono font-black tracking-tighter">₱{remaining.toLocaleString()}</p>
                     <div className="mt-6 space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-emerald-100">
                           <span>Utilization</span>
                           <span>{((totalOblig / totalAlloc) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-emerald-800/50 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-300" style={{ width: `${(totalOblig / totalAlloc) * 100}%` }}></div>
                        </div>
                     </div>
                  </div>

                  <div className="md:col-span-2 border border-slate-100 rounded-2xl p-8 bg-slate-50/50">
                     <div className="flex items-center gap-2 mb-6">
                        <Activity size={16} className="text-slate-400" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution Health</h4>
                     </div>
                     <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-xl">
                        Based on the current obligational authority for FY 2024, this PAP has committed <strong>{((totalOblig / totalAlloc) * 100).toFixed(1)}%</strong> of its total allotment. PS utilization is on track while MOOE procurement is still in the acquisition phase.
                     </p>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">Reference No.</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {mockTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-emerald-700">{tx.ref}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">{tx.type}</td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${tx.source === 'PS' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>{tx.source}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{tx.date}</td>
                      <td className="px-6 py-4">
                         <span className={`flex items-center gap-1.5 font-bold ${tx.status === 'Approved' ? 'text-emerald-600' : 'text-amber-500'}`}>
                            <ShieldCheck size={12} /> {tx.status}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">₱{tx.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(activeTab !== 'overview' && activeTab !== 'transactions') && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-300">
               <Package size={48} className="opacity-10 mb-4" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em]">Module Implementation Pending</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PAPDetailView;
