import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wallet,
  Activity,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Building2,
  FileText,
  Clock,
  ExternalLink,
  Search
} from 'lucide-react';
import { financialAPI } from '../../services/api';
import { useFiscalYear } from '../../context/FiscalYearContext';
import { formatPHP } from '../../utils/formatters';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';

const PAPDetailView = () => {
  const { id: papDes } = useParams();
  const [searchParams] = useSearchParams();
  const papType = searchParams.get('type');
  const navigate = useNavigate();
  const { selectedYear } = useFiscalYear();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await financialAPI.getPapDetail({
          plan_id: selectedYear,
          pap_type: papType,
          pap_des: papDes
        });
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch PAP details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [papDes, papType, selectedYear]);

  const summary = data?.summary || { allocation: 0, obligated: 0, balance: 0, utilization: 0 };

  // Financial Validation: Allocation = Obligated + Balance
  const variance = Math.abs(summary.allocation - (summary.obligated + summary.balance));
  const hasVariance = variance > 0.01;

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!data) return <div className="p-10 text-center">PAP not found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[32px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-2xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all active:scale-90"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                {papType}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">FY {selectedYear}</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight max-w-2xl">
              {papDes}
            </h2>
          </div>
        </div>

        <div className="flex flex-col items-end border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 pt-6 md:pt-0 md:pl-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Allocation</p>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            ₱{formatPHP(summary.allocation)}
          </p>
          {hasVariance && (
             <div className="mt-2 flex items-center gap-1 text-rose-500 text-[10px] font-bold uppercase">
                <AlertTriangle size={12} /> Variance: ₱{formatPHP(variance)}
             </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
             <Activity size={12} className="text-primary-500" /> Current Utilization
           </p>
           <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mb-2">{summary.utilization.toFixed(1)}%</p>
           <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
             <div
               className={`h-full transition-all duration-1000 ${summary.utilization > 95 ? 'bg-rose-500' : summary.utilization > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`}
               style={{ width: `${Math.min(summary.utilization, 100)}%` }}
             />
           </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
             <ShieldCheck size={12} className="text-emerald-500" /> Total Obligated
           </p>
           <p className="text-2xl font-black font-mono text-emerald-600">₱{formatPHP(summary.obligated)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
             <Clock size={12} className="text-amber-500" /> Unspent Balance
           </p>
           <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">₱{formatPHP(summary.balance)}</p>
        </div>
        <div className="bg-[#0f172a] p-6 rounded-[32px] shadow-xl text-white">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Health Status</p>
           <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${summary.utilization > 95 ? 'bg-rose-500 animate-pulse' : summary.utilization > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <p className="text-xl font-black uppercase italic tracking-wider">
                {summary.utilization > 95 ? 'Critical' : summary.utilization > 85 ? 'Warning' : 'Healthy'}
              </p>
           </div>
           <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Based on Burn Rate</p>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[40px] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="flex border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 px-6">
          {[
            { id: 'overview', label: 'Office Breakdown', icon: Building2 },
            { id: 'prs', label: 'Procurement Requests', icon: FileText },
            { id: 'obligations', label: 'Obligations', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.id !== 'overview' && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[8px] ${activeTab === tab.id ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-400'}`}>
                  {data[tab.id].length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {data.officeBreakdown.map((off, idx) => (
                 <div key={idx} className="p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/10 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-center mb-6">
                       <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">{off.office}</h4>
                       <span className="text-[10px] font-black text-primary-600">{off.utilization.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-4">
                       <div className="flex justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Allocation</span>
                          <span className="text-[10px] font-black font-mono">₱{formatPHP(off.allocation)}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase text-emerald-600">Obligated</span>
                          <span className="text-[10px] font-black font-mono text-emerald-600">₱{formatPHP(off.obligated)}</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 rounded-full" style={{ width: `${off.utilization}%` }} />
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'prs' && (
            <div className="space-y-4">
               {data.prs.length > 0 ? (
                 <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-700">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">PR No.</th>
                             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Status</th>
                             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Date</th>
                             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Amount</th>
                             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Balance</th>
                             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Action</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                          {data.prs.map((pr, idx) => (
                             <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-[11px] font-black text-primary-600">{pr.prno}</td>
                                <td className="px-6 py-4"><StatusBadge status={pr.workflow_status} size="xs" /></td>
                                <td className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">{new Date(pr.transaction_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right font-mono text-[11px] font-black">₱{formatPHP(pr.pr_amount)}</td>
                                <td className="px-6 py-4 text-right font-mono text-[11px] font-black text-slate-400">₱{formatPHP(pr.remaining_balance)}</td>
                                <td className="px-6 py-4">
                                   <button className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-primary-600 transition-all">
                                      <ExternalLink size={14} />
                                   </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               ) : (
                 <div className="py-20 text-center space-y-3">
                    <Search className="mx-auto text-slate-200" size={40} />
                    <p className="text-xs font-black text-slate-400 uppercase">No PRs recorded for this PAP</p>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'obligations' && (
            <div className="space-y-4">
               {data.obligations.length > 0 ? (
                 <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-700">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">OBR No.</th>
                             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Ref PR</th>
                             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Date</th>
                             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Payee</th>
                             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Amount</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                          {data.obligations.map((ob, idx) => (
                             <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-[11px] font-black text-emerald-600">{ob.obrno}</td>
                                <td className="px-6 py-4 font-mono text-[11px] font-bold text-slate-400">{ob.prno || 'DIRECT'}</td>
                                <td className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">{new Date(ob.transaction_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-[11px] font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]">{ob.payee || 'N/A'}</td>
                                <td className="px-6 py-4 text-right font-mono text-[11px] font-black text-emerald-700">₱{formatPHP(ob.amount)}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               ) : (
                 <div className="py-20 text-center space-y-3">
                    <TrendingUp className="mx-auto text-slate-200" size={40} />
                    <p className="text-xs font-black text-slate-400 uppercase">No obligations recorded</p>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PAPDetailView;
