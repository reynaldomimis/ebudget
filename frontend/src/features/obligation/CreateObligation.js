import React, { useState } from 'react';
import { FilePlus, Calendar, User, FileText, Send, Save, Search, CheckCircle2, AlertCircle, Wallet, ListFilter, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';

const CreateObligation = ({ onNavigate }) => {
  const [isDirect, setIsDirect] = useState(true);
  const [prNumber, setPrNumber] = useState('');
  const [obDate, setObDate] = useState(new Date().toISOString().split('T')[0]);
  const [payee, setPayee] = useState('');
  const [particulars, setParticulars] = useState('');
  const [budgetSource, setBudgetSource] = useState('PS - Basic Salary');
  const [amount, setAmount] = useState(0);
  const [showPrList, setShowPrList] = useState(false);

  // Mock PR List (Only PRs with amounts/balances)
  const pendingPrs = [
    { no: 'PR-2024-001', description: 'Office Supplies Q3', amount: 15400.00, supplier: 'National Bookstore' },
    { no: 'PR-2024-005', description: 'IT Hardware Upgrade', amount: 85200.00, supplier: 'Octagon Computer' },
    { no: 'PR-2024-012', description: 'Janitorial Supplies', amount: 12300.00, supplier: 'CleanMaster Inc.' },
  ];

  const handleSelectPr = (pr) => {
    setPrNumber(pr.no);
    setAmount(pr.amount);
    setParticulars(pr.description);
    setShowPrList(false);
  };

  // Mock available budget
  const availableBudget = 750000.00;
  const remainingAfter = availableBudget - amount;

  const isFormValid =
    obDate !== '' &&
    particulars.trim() !== '' &&
    amount > 0 &&
    remainingAfter >= 0 &&
    (isDirect || prNumber.trim() !== '');

  return (
    <div className="w-full space-y-3">
      <PageHeader
        path="Transactions / Create Obligation"
        title="Create Obligation"
        subtitle="Record a new budget obligation"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('obligations')}>Cancel</Button>
            <Button variant="secondary" icon={Save} size="sm">Save Draft</Button>
            <Button
              variant="primary"
              icon={Send}
              size="sm"
              disabled={!isFormValid}
            >
              Submit for Review
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Main Form Area */}
        <div className="lg:col-span-3 space-y-3">

          {/* Obligation Mode Selection */}
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-neutral-900 text-sm">Obligation Type</h3>
                <p className="text-[11px] text-neutral-500">Choose how you want to create this obligation</p>
              </div>
              <div className="flex bg-neutral-100 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setIsDirect(true)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${isDirect ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  Direct Obligation
                </button>
                <button
                  onClick={() => setIsDirect(false)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${!isDirect ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  From PR No.
                </button>
              </div>
            </div>
          </div>

          {!isDirect && (
            <div className="space-y-2">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-[10px] font-bold text-primary-700 uppercase tracking-wider">Search / Select Procurement Request (PR)</label>
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                      <input
                        type="text"
                        placeholder="Enter PR Number (e.g. PR-2024-001)"
                        className="w-full pl-10 pr-3 py-2 bg-white border border-primary-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono"
                        value={prNumber}
                        onChange={(e) => setPrNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="md"
                      icon={ListFilter}
                      className="h-[38px] bg-white"
                      onClick={() => setShowPrList(!showPrList)}
                    >
                      {showPrList ? 'Hide List' : 'Browse PRs'}
                    </Button>
                    <Button variant="primary" size="md" className="h-[38px]">Search & Load</Button>
                  </div>
                </div>
              </div>

              {/* PR Quick List */}
              {showPrList && (
                <div className="bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-100">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Available PRs with Balance</p>
                  </div>
                  <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto">
                    {pendingPrs.map((pr) => (
                      <div
                        key={pr.no}
                        onClick={() => handleSelectPr(pr)}
                        className="p-3 hover:bg-primary-50 cursor-pointer transition-colors group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded bg-neutral-100 flex items-center justify-center font-bold text-neutral-400 text-xs group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                            PR
                          </div>
                          <div>
                            <p className="text-sm font-bold text-neutral-800">{pr.no}</p>
                            <p className="text-[11px] text-neutral-500">{pr.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold font-mono text-neutral-900">₱{pr.amount.toLocaleString()}</p>
                          <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-primary-600 uppercase">
                            Select <ArrowRight size={10} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
              <FilePlus size={16} className="text-primary-600" />
              <h3 className="font-bold text-neutral-900 text-sm">Obligation Details</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider">Obligation No.</label>
                <input
                  type="text"
                  value="OB-2024-1054"
                  readOnly
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm font-mono text-neutral-500 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider">Date</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-3 py-2 bg-white border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    value={obDate}
                    onChange={(e) => setObDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider">Payee / Supplier</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search or enter payee (Optional)"
                    className="w-full pl-10 pr-3 py-2 bg-white border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider">Particulars / Description</label>
                <textarea
                  rows="2"
                  placeholder="Enter detailed description of the obligation..."
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                  value={particulars}
                  onChange={(e) => setParticulars(e.target.value)}
                ></textarea>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider">Amount to Obligate</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">₱</span>
                  <input
                    type="number"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-neutral-200 rounded-md text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info Area */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="text-primary-600" />
              <h3 className="font-bold text-neutral-900 text-sm">Budget Impact</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Budget Source</label>
                <select
                  className="w-full bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                  value={budgetSource}
                  onChange={(e) => setBudgetSource(e.target.value)}
                >
                  <option>PS - Basic Salary</option>
                  <option>MOOE - Office Supplies</option>
                  <option>MOOE - Utilities</option>
                </select>
              </div>

              <div className="space-y-3 border-t border-neutral-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-medium text-neutral-500">Current Balance</span>
                  <span className="text-xs font-bold text-neutral-900 font-mono">₱{availableBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-primary-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">This Obligation</span>
                  <span className="text-xs font-bold font-mono">- ₱{amount.toLocaleString()}</span>
                </div>
                <div className={`p-3 rounded-lg border flex justify-between items-center ${remainingAfter < 0 ? 'bg-danger-50 border-danger-100' : 'bg-success-50 border-success-100'}`}>
                  <span className={`text-[10px] font-bold uppercase ${remainingAfter < 0 ? 'text-danger-700' : 'text-success-700'}`}>Remaining After</span>
                  <span className={`text-sm font-bold font-mono ${remainingAfter < 0 ? 'text-danger-700' : 'text-success-700'}`}>
                    ₱{remainingAfter.toLocaleString()}
                  </span>
                </div>

                {remainingAfter < 0 && (
                  <div className="flex items-start gap-2 p-2 bg-danger-50 text-danger-700 rounded text-[10px] font-bold">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>Insufficient funds! Please check budget allocation.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg p-4 text-white">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={12} /> Compliance Check
            </h4>
            <ul className="text-[10px] space-y-1.5 opacity-80 leading-relaxed">
              <li>• OB numbers are generated per fiscal year.</li>
              <li>• Ensure Fund Cluster matches the funding source.</li>
              <li>• From PR obligations will link the PR items automatically.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateObligation;
