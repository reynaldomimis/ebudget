import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBudget } from '../../context/BudgetContext';
import PageHeader from '../../components/common/PageHeader';
import {
  FileText,
  Download,
  Printer,
  ChevronRight,
  Library,
  Table as TableIcon,
  PieChart,
  ClipboardList,
  Search,
  Filter
} from 'lucide-react';

const ReportLibraryCard = ({ title, description, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="group bg-white p-6 rounded-[32px] border border-slate-100 text-left hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-300 flex items-start gap-5"
  >
    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
      <Icon size={24} />
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{title}</h4>
      <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{description}</p>
      <div className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-blue-600 transition-all">
        Open Report <ChevronRight size={12} />
      </div>
    </div>
  </button>
);

const FiscalYearSummary = ({ onBack }) => {
  const { budgetData } = useBudget();

  const categories = [
    { id: 'GAS', label: 'GAS' },
    { id: 'Policy', label: 'Policy' },
    { id: 'PFNSS', label: 'PFNSS' },
    { id: 'PGN', label: 'PGN' },
    { id: 'Assistance', label: 'Assistance' },
  ];

  const calculateCategory = (catId) => {
    let ps = 0, mooe = 0;
    budgetData.paps.filter(p => p.type === catId).forEach(p => {
      ps += p.ps.operations;
      mooe += p.mooe.allocation;
    });
    return { ps, mooe, total: ps + mooe };
  };

  const results = categories.map(cat => ({
    ...cat,
    ...calculateCategory(cat.id)
  }));

  const totalPS = results.reduce((s, r) => s + r.ps, 0);
  const totalMOOE = results.reduce((s, r) => s + r.mooe, 0);
  const totalMain = totalPS + totalMOOE;

  const rlipTotal = budgetData.paps.reduce((s, p) => s + p.ps.rlip, 0);

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
      <button onClick={onBack} className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4 hover:translate-x-[-4px] transition-transform flex items-center gap-2">
        ← Back to Report Center
      </button>

      <PageHeader
        title="Fiscal Year Summary"
        subtitle="Official GFWP Summary - Financial Work Plan (FY 2024)"
        actions={
            <div className="flex gap-3">
                <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all">
                    <Printer size={16} /> Print Report
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
                    <Download size={16} /> Export Excel
                </button>
            </div>
        }
      />

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.3em]">
              <th className="px-10 py-6 border-r border-slate-800">PAP Type / classification</th>
              <th className="px-10 py-6 text-right border-r border-slate-800">PS</th>
              <th className="px-10 py-6 text-right border-r border-slate-800">MOOE</th>
              <th className="px-10 py-6 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-10 py-5 font-black text-slate-900 uppercase tracking-widest border-r border-slate-50">{row.label}</td>
                <td className="px-10 py-5 text-right font-mono text-sm font-bold text-slate-600 border-r border-slate-50">₱{row.ps.toLocaleString()}</td>
                <td className="px-10 py-5 text-right font-mono text-sm font-bold text-slate-600 border-r border-slate-50">₱{row.mooe.toLocaleString()}</td>
                <td className="px-10 py-5 text-right font-mono text-sm font-black text-slate-900">₱{row.total.toLocaleString()}</td>
              </tr>
            ))}

            <tr className="bg-slate-50/80">
              <td className="px-10 py-6 font-black text-slate-900 uppercase tracking-[0.2em] border-r border-slate-100">TOTAL</td>
              <td className="px-10 py-6 text-right font-mono text-base font-black text-slate-900 border-r border-slate-100">₱{totalPS.toLocaleString()}</td>
              <td className="px-10 py-6 text-right font-mono text-base font-black text-slate-900 border-r border-slate-100">₱{totalMOOE.toLocaleString()}</td>
              <td className="px-10 py-6 text-right font-mono text-base font-black text-blue-600">₱{totalMain.toLocaleString()}</td>
            </tr>

            <tr>
              <td className="px-10 py-5 font-black text-slate-400 uppercase tracking-widest border-r border-slate-50">RLIP</td>
              <td className="px-10 py-5 text-right font-mono text-sm font-bold text-slate-400 border-r border-slate-50">₱{rlipTotal.toLocaleString()}</td>
              <td className="px-10 py-5 text-right font-mono text-sm font-bold text-slate-400 border-r border-slate-50">₱0</td>
              <td className="px-10 py-5 text-right font-mono text-sm font-bold text-slate-400">₱{rlipTotal.toLocaleString()}</td>
            </tr>

            <tr className="bg-blue-50/40">
              <td className="px-10 py-8 font-black text-blue-900 uppercase tracking-[0.4em] border-r border-blue-100">GRAND TOTAL</td>
              <td className="px-10 py-8 text-right font-mono text-lg font-black text-blue-900 border-r border-blue-100">₱{(totalPS + rlipTotal).toLocaleString()}</td>
              <td className="px-10 py-8 text-right font-mono text-lg font-black text-blue-900 border-r border-blue-100">₱{totalMOOE.toLocaleString()}</td>
              <td className="px-10 py-8 text-right font-mono text-2xl font-black text-blue-600">₱{(totalMain + rlipTotal).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReportCenter = () => {
  const [selectedReport, setSelectedReport] = useState(null);

  if (selectedReport === 'fiscal-summary') {
    return <FiscalYearSummary onBack={() => setSelectedReport(null)} />;
  }

  return (
    <div className="w-full py-8 px-6 animate-in fade-in duration-700 pb-20">
      <PageHeader
        title="Report Center"
        subtitle="Access official GFWP outputs and fiscal summaries."
        showFiscalBadge={false}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportLibraryCard
          title="Fiscal Year Summary"
          description="Consolidated budget classification report (GAS, Policy, RLIP) mirroring the official excel summary sheet."
          icon={TableIcon}
          onClick={() => setSelectedReport('fiscal-summary')}
        />
        <ReportLibraryCard
          title="PAP Summary Report"
          description="Detailed breakdown of all Program, Activity, and Projects with full PS/MOOE transparency."
          icon={PieChart}
          onClick={() => {}}
        />
        <ReportLibraryCard
          title="PS Allotment Report"
          description="Official Personnel Services registry including salaries, benefits, and statutory obligations."
          icon={FileText}
          onClick={() => {}}
        />
        <ReportLibraryCard
          title="MOOE Allotment Report"
          description="Maintenance and Other Operating Expenses registry grouped by object classification."
          icon={ClipboardList}
          onClick={() => {}}
        />
        <ReportLibraryCard
          title="PR Monitoring Report"
          description="Purchase Request registry for the current fiscal cycle including procurement status."
          icon={Search}
          onClick={() => {}}
        />
        <ReportLibraryCard
          title="Obligation Report"
          description="Full registry of all Obligation Requests (OR) and their corresponding budget impact."
          icon={TableIcon}
          onClick={() => {}}
        />
      </div>
    </div>
  );
};

export default ReportCenter;
