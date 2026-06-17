import React, { useState, useMemo } from 'react';
import {
  Plus,
  Send,
  Info,
  Calendar,
  Search,
  CheckCircle2,
  Trash2,
  Save,
  AlertCircle,
  TrendingUp,
  FileText,
  ShoppingCart,
  List,
  ChevronRight
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';

const CreateObligation = ({ onCancel }) => {
  const [sourceMode, setSourceMode] = useState('DIRECT');
  const [prSearch, setPrSearch] = useState('');
  const [selectedPR, setSelectedPR] = useState(null);
  const [showPRList, setShowPRList] = useState(false);
  const [obDate, setObDate] = useState(new Date().toISOString().split('T')[0]);
  const [payee, setPayee] = useState('');
  const [fundCluster, setFundCluster] = useState('01 - Regular Agency Fund');
  const [allotmentClass, setAllotmentClass] = useState('MOOE');

  const [items, setItems] = useState([
    { id: Date.now(), objectCode: '', particulars: '', amount: 0 }
  ]);

  // Mock Approved PRs (Filtering out those with no remaining amount)
  const approvedPRs = [
    { id: 'PR-2024-0012', amount: 45200.00, remaining: 45200.00, purpose: 'Office Supplies Q4', supplier: 'National Bookstore' },
    { id: 'PR-2024-0011', amount: 125000.00, remaining: 80000.00, purpose: 'IT Equipment', supplier: 'Dell Philippines' },
    { id: 'PR-2024-0010', amount: 15300.00, remaining: 0, purpose: 'Janitorial Supplies', supplier: 'Clean Solutions' },
  ];

  // Only show PRs with remaining amount
  const availablePRs = approvedPRs.filter(pr => pr.remaining > 0);

  const handleSelectPR = (pr) => {
    setSelectedPR(pr);
    setPrSearch(pr.id);
    setShowPRList(false);
    setPayee(pr.supplier);
    setItems([{
      id: Date.now(),
      objectCode: '50203010',
      particulars: `Payment for ${pr.purpose}`,
      amount: pr.remaining
    }]);
  };

  const addEntry = () => {
    setItems([...items, { id: Date.now(), objectCode: '', particulars: '', amount: 0 }]);
  };

  const removeEntry = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const totalAmount = useMemo(() =>
    items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [items]
  );

  const isFormValid = payee.trim() !== '' && items.every(i => i.particulars.trim() !== '' && i.amount > 0);

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Create Obligation"
        subtitle="Record financial commitments for budget items"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
            <Button variant="secondary" icon={Save} size="sm">Save Draft</Button>
            <Button
              variant="primary"
              icon={Send}
              size="sm"
              disabled={!isFormValid}
            >
              Submit Transaction
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">

          {/* Obligation Type Toggle */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Obligation Type</h3>
                <p className="text-xs text-neutral-500">Choose how you want to create this obligation</p>
              </div>
              <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                <button
                  onClick={() => setSourceMode('DIRECT')}
                  className={`px-6 py-2 text-xs font-bold rounded-md transition-all ${sourceMode === 'DIRECT' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  Direct Obligation
                </button>
                <button
                  onClick={() => setSourceMode('PR')}
                  className={`px-6 py-2 text-xs font-bold rounded-md transition-all ${sourceMode === 'PR' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  From PR No.
                </button>
              </div>
            </div>
          </div>

          {/* PR Search - Only shown if FROM PR mode */}
          {sourceMode === 'PR' && (
            <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100 shadow-sm space-y-3 relative">
               <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">Search Procurement Request (PR)</h4>

               <div className="flex gap-3 relative">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input
                      type="text"
                      placeholder="Enter PR Number..."
                      className="w-full pl-12 pr-4 py-3 bg-white border border-emerald-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all shadow-sm"
                      value={prSearch}
                      onChange={(e) => {
                        setPrSearch(e.target.value);
                        if (!e.target.value) setSelectedPR(null);
                      }}
                    />
                  </div>

                  {selectedPR && (
                    <div className="flex items-center px-4 bg-emerald-100 text-emerald-700 rounded-xl font-mono font-black text-sm border border-emerald-200 animate-in zoom-in duration-300">
                      ₱{selectedPR.remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPRList(!showPRList)}
                      className="flex items-center gap-1.5 px-4 py-3 bg-white text-emerald-600 border-2 border-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm"
                    >
                      <List size={16} strokeWidth={3} />
                      BROWSE PRS
                    </button>

                    <button
                      className="px-8 py-3 bg-emerald-500 text-white rounded-xl text-sm font-black uppercase tracking-wide hover:bg-emerald-600 shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-40"
                      disabled={!selectedPR}
                    >
                       Search PR
                    </button>
                  </div>
               </div>

               {/* PR Selection List */}
               {showPRList && (
                 <div className="absolute top-[100%] left-6 right-6 z-50 mt-2 bg-white border border-emerald-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-emerald-50/50 px-4 py-2 border-b border-emerald-50 flex justify-between items-center">
                       <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Available PRs for Obligation</span>
                       <span className="text-[10px] font-bold text-emerald-600 bg-white px-2 py-0.5 rounded-full shadow-sm">{availablePRs.length} FOUND</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                       {availablePRs.map(pr => (
                         <button
                           key={pr.id}
                           className="w-full px-6 py-4 text-left hover:bg-emerald-50/50 flex justify-between items-center border-b border-emerald-50 last:border-0 transition-all group"
                           onClick={() => handleSelectPR(pr)}
                         >
                           <div className="space-y-1">
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-neutral-800 group-hover:text-emerald-700 transition-colors">{pr.id}</span>
                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded uppercase">Approved</span>
                             </div>
                             <p className="text-[11px] text-neutral-400 font-medium line-clamp-1">{pr.purpose}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-black text-neutral-300 uppercase tracking-tighter mb-0.5">Avail. Amount</p>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-emerald-600 text-base">
                                  ₱{pr.remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                <ChevronRight size={14} className="text-emerald-300 group-hover:translate-x-1 transition-transform" />
                              </div>
                           </div>
                         </button>
                       ))}
                    </div>
                 </div>
               )}
            </div>
          )}

          {/* Obligation Details (Header) */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
              <div className="p-1.5 bg-primary-50 text-primary-600 rounded-lg">
                <FileText size={18} />
              </div>
              <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">Obligation Details</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Obligation No</label>
                <input
                  type="text"
                  value="OB-2024-1055"
                  readOnly
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-neutral-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Date</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="date"
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
                    value={obDate}
                    onChange={(e) => setObDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Payee / Supplier</label>
                <input
                  type="text"
                  placeholder="Enter payee name..."
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all shadow-sm"
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <ShoppingCart size={18} />
                </div>
                <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">Breakdown of Entries</h3>
              </div>
              <button
                onClick={addEntry}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg"
              >
                <Plus size={14} /> Add Entry
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/30 text-neutral-400 text-[10px] uppercase tracking-widest font-black border-b border-neutral-100">
                    <th className="px-6 py-3 w-12 text-center">#</th>
                    <th className="px-6 py-3 w-64">Object Code</th>
                    <th className="px-6 py-3">Particulars / Details</th>
                    <th className="px-6 py-3 w-40 text-right">Amount</th>
                    <th className="px-6 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {items.map((item, index) => (
                    <tr key={item.id} className="group hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 text-center text-xs font-bold text-neutral-300">{index + 1}</td>
                      <td className="px-6 py-4">
                        <select
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-emerald-700 outline-none"
                          value={item.objectCode}
                          onChange={(e) => updateItem(item.id, 'objectCode', e.target.value)}
                        >
                           <option value="">Select Code...</option>
                           <option value="50203010">50203010 - Office Supplies</option>
                           <option value="50203020">50203020 - IT Supplies</option>
                           <option value="50211010">50211010 - Legal Services</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          placeholder="Specific details for this entry..."
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-neutral-600 placeholder:text-neutral-200"
                          value={item.particulars}
                          onChange={(e) => updateItem(item.id, 'particulars', e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                           <span className="absolute left-1 top-1/2 -translate-y-1/2 text-neutral-300 font-bold text-xs">₱</span>
                            <input
                            type="number"
                            className="w-full pl-4 bg-neutral-50 border border-transparent hover:border-neutral-200 focus:bg-white focus:border-primary-500 rounded-lg px-2 py-1.5 text-sm text-right font-mono font-bold focus:ring-0 transition-all"
                            value={item.amount}
                            onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                            />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => removeEntry(item.id)}
                          className="text-neutral-200 hover:text-rose-500 transition-colors p-1"
                          disabled={items.length === 1}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-neutral-50/30 border-t border-neutral-100 flex justify-end">
              <div className="text-right space-y-1">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Consolidated Total</p>
                <h2 className="text-3xl font-black font-mono text-primary-700 tracking-tighter">
                  ₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 space-y-5">
            <div className="flex items-center gap-2">
               <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingUp size={18} />
               </div>
              <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">Budget Source</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Fund Cluster</label>
                <select
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                    value={fundCluster}
                    onChange={(e) => setFundCluster(e.target.value)}
                >
                  <option>01 - Regular Agency Fund</option>
                  <option>07 - Trust Receipts</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Allotment Class</label>
                <div className="flex bg-neutral-100 p-1 rounded-lg">
                   {['PS', 'MOOE'].map(cls => (
                     <button
                       key={cls}
                       onClick={() => setAllotmentClass(cls)}
                       className={`flex-1 py-1.5 text-[10px] font-black rounded transition-all ${allotmentClass === cls ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-400'}`}
                     >
                       {cls}
                     </button>
                   ))}
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Available Balance</span>
                  <span className="text-sm font-black text-emerald-900 font-mono">₱1,450,000.00</span>
                </div>
                <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-[65%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-xl p-6 text-white shadow-xl">
             <div className="flex items-center gap-2 mb-4 text-primary-400 border-b border-neutral-800 pb-2">
                <CheckCircle2 size={16} />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Compliance Status</h4>
             </div>
             <p className="text-[11px] text-neutral-400 leading-relaxed">
                All entries must be linked to a valid UACS Object Code. Total amount must not exceed the unreleased balance of the Program Portfolio.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateObligation;
