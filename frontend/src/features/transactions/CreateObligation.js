import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Plus, Send, Info, Calendar, Search, CheckCircle2, Trash2, Save, AlertCircle, TrendingUp, FileText, ShoppingCart, List, ChevronRight, Lock, Zap } from 'lucide-react';
import { obligationAPI, prAPI, financialAPI } from '../../services/api';
import { formatPHP } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import TransactionFilterEngine from '../../services/TransactionFilterEngine';
import { FormField, Input, Textarea } from '../../components/common/FormControls';
import BudgetFilters from '../../components/common/BudgetFilters';

const CreateObligation = ({ onCancel }) => {
  const [sourceMode, setSourceMode] = useState('DIRECT');
  const [prSearch, setPrSearch] = useState('');
  const [selectedPR, setSelectedPR] = useState(null);
  const [showPRList, setShowPRList] = useState(false);
  const [obDate, setObDate] = useState(new Date().toISOString().split('T')[0]);
  const [payee, setPayee] = useState('');
  const [allotmentClass, setAllotmentClass] = useState('MOOE');
  const [obNo, setObNo] = useState('Loading...');
  const [availablePRs, setAvailablePRs] = useState([]);

  const [selection, setSelection] = useState({});
  const [availableAllocation, setAvailableAllocation] = useState(0);
  const prListRef = useRef(null);

  const [items, setItems] = useState([
    { id: Date.now(), objectCode: '', particulars: '', amount: 0 }
  ]);

  const handleSelectionChange = useCallback((newSelection) => {
    setSelection(newSelection);
  }, []);

  // Close list on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (prListRef.current && !prListRef.current.contains(event.target)) {
        setShowPRList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load Allocation and Next OBR No / Real PRs
  useEffect(() => {
    const initData = async () => {
      try {
        const [regRes, nextNoRes] = await Promise.all([
          financialAPI.getBudgetRegistry(),
          obligationAPI.getNextNo(new Date().getFullYear().toString(), (new Date().getMonth() + 1).toString().padStart(2, '0'))
        ]);

        if (regRes.success) {
          const prs = regRes.data.flatMap(item =>
            (item.prs || []).map(pr => ({
              id: pr.prno,
              amount: pr.pr_amount,
              remaining: pr.remaining_balance,
              purpose: pr.purpose,
              supplier: pr.payee || 'N/A',
              mooe_id: item.id,
              status: pr.workflow_status
            }))
          ).filter(pr => pr.remaining > 0 && ['Approved', 'Partially Obligated'].includes(pr.status));
          setAvailablePRs(prs);
        }
        if (nextNoRes.success) setObNo(nextNoRes.nextObrNo);
      } catch (err) {
        console.error("Initialization failed", err);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (sourceMode === 'PR') {
      if (selectedPR) setAvailableAllocation(selectedPR.remaining);
      else setAvailableAllocation(0);
      return;
    }
    const fetchAllocation = async () => {
      if (allotmentClass === 'PS' && selection.papDes) {        try {
          const [code, name] = selection.papDes.split('|');
          const res = await financialAPI.getPapDetail({ pap_des: name });
          if (res.success && res.data.psRecords) {
            const totalRemaining = res.data.psRecords.reduce((sum, r) => sum + parseFloat(r.remaining_balance || 0), 0);
            setAvailableAllocation(totalRemaining);
          }
        } catch (err) {
          console.error("Failed to fetch PS allocation:", err);
          setAvailableAllocation(0);
        }
      } else if (allotmentClass === 'MOOE' && selection.mooeId) {
        const alloc = await TransactionFilterEngine.getAvailableAllocation({
          allotmentClass: 'MOOE',
          ...selection
        });
        setAvailableAllocation(alloc);
      } else {
        setAvailableAllocation(0);
      }
    };
    fetchAllocation();
  }, [selection, allotmentClass, sourceMode, selectedPR]);

  // Load PS items automatically when PAP is selected
  useEffect(() => {
    if (sourceMode === 'DIRECT' && allotmentClass === 'PS' && selection.papDes && selection.isComplete) {
      const fetchPSItems = async () => {
        try {
          const [code, name] = selection.papDes.split('|');
          const res = await financialAPI.getPapDetail({ pap_des: name });
          if (res.success && res.data.psRecords) {
            const psItems = res.data.psRecords.map(r => ({
              id: r.id,
              objectCode: '',
              particulars: r.expense_items,
              amount: 0,
              allocation: parseFloat(r.remaining_balance)
            }));
            setItems(psItems);

            // Calculate total PAP balance for PS
            const totalAlloc = psItems.reduce((sum, i) => sum + i.allocation, 0);
            setAvailableAllocation(totalAlloc);
          }
        } catch (err) {
          console.error("Failed to fetch PS items:", err);
        }
      };
      fetchPSItems();
    }
  }, [selection.papDes, selection.isComplete, allotmentClass, sourceMode]);

  const handleLoadPSComponents = async () => {
    if (selection.papDes && selection.isComplete) {
      try {
        const [code, name] = selection.papDes.split('|');
        const res = await financialAPI.getPapDetail({ pap_des: name });
        if (res.success && res.data.psRecords) {
          const psItems = res.data.psRecords.map(r => ({
            id: r.id,
            objectCode: '',
            particulars: r.expense_items,
            amount: 0,
            allocation: parseFloat(r.remaining_balance)
          }));
          setItems(psItems);
          const totalAlloc = psItems.reduce((sum, i) => sum + i.allocation, 0);
          setAvailableAllocation(totalAlloc);
        }
      } catch (err) {
        console.error("Failed to fetch PS items:", err);
      }
    } else {
      alert("Please select a PAP first");
    }
  };

  const handleSubmit = async () => {
    try {
      const data = {
        obrno: obNo,
        transaction_date: obDate,
        particular: items.map(i => i.particulars).join('; '),
        amount: totalAmount,
        prno: sourceMode === 'PR' ? prSearch : null,
        payee: payee,
        mooe_id: selectedPR ? selectedPR.mooe_id : (allotmentClass === 'MOOE' ? selection.mooeId : null),
        ps_id: allotmentClass === 'PS' ? selection.id : null,
        items: allotmentClass === 'PS'
          ? items.filter(i => i.amount > 0).map(i => ({ ps_id: i.id, particulars: i.particulars, amount: i.amount }))
          : items.map(i => ({ particulars: i.particulars, amount: i.amount }))
      };

      const res = await obligationAPI.create(data);
      if (res.success) {
        if (onCancel) onCancel();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to create obligation");
    }
  };

  const handleModeSwitch = (mode) => {
    if (mode === sourceMode) return;

    setSourceMode(mode);
    setPrSearch('');
    setSelectedPR(null);
    setShowPRList(false);
    setPayee('');
    setAllotmentClass('MOOE');
    setSelection({});
    setAvailableAllocation(0);
    setItems([{ id: Date.now(), objectCode: '', particulars: '', amount: 0 }]);
  };

  const handleSelectPR = (pr) => {
    setSelectedPR(pr);
    setPrSearch(pr.id);
    setShowPRList(false);
    setPayee(pr.supplier);
    setItems([{
      id: Date.now(),
      objectCode: '',
      particulars: `Obligation for ${pr.id}: ${pr.purpose}`,
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

  const isFormValid = payee.trim() !== '' &&
                     (allotmentClass === 'PS' ? selection.papDes !== '' : selection.activityId !== '') &&
                     items.every(i => i.particulars.trim() !== '' && i.amount > 0) &&
                     totalAmount > 0 &&
                     totalAmount <= availableAllocation;

  const isDirectValid = sourceMode === 'DIRECT' && (allotmentClass === 'PS' ? !!selection.papDes : !!selection.activityId);
  const isPrValid = sourceMode === 'PR' && !!selectedPR;
  const canEditDetails = isDirectValid || isPrValid;

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
              onClick={handleSubmit}
            >
              Submit Transaction
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Obligation Type</h3>
                <p className="text-xs text-neutral-500">Choose how you want to create this obligation</p>
              </div>
              <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                <button onClick={() => handleModeSwitch('DIRECT')} className={`px-6 py-2 text-xs font-bold rounded-md transition-all ${sourceMode === 'DIRECT' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>Direct Obligation</button>
                <button onClick={() => handleModeSwitch('PR')} className={`px-6 py-2 text-xs font-bold rounded-md transition-all ${sourceMode === 'PR' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>From PR No.</button>
              </div>
            </div>
          </div>

          {sourceMode === 'PR' && (
              <div ref={prListRef} className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100 shadow-sm space-y-3 relative">
               <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">Search Purchase Request (PR)</h4>
               <div className="flex gap-3 relative">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 z-10" />
                    <Input type="text" placeholder="Enter PR Number..." className="pl-12" value={prSearch} onChange={(e) => { setPrSearch(e.target.value); if (!e.target.value) setSelectedPR(null); }} />
                  </div>
                  {selectedPR && (
                    <div className="flex items-center px-4 bg-emerald-100 text-emerald-700 rounded-xl font-mono font-black text-sm border border-emerald-200 animate-in zoom-in duration-300">
                      ₱{formatPHP(selectedPR.remaining)}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setShowPRList(!showPRList)} className="flex items-center gap-1.5 px-4 h-[48px] bg-white text-emerald-600 border-2 border-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 shadow-sm transition-all active:scale-95">
                      <List size={16} strokeWidth={3} /> BROWSE PRS
                    </button>
                    <button className="px-8 h-[48px] bg-emerald-600 text-white rounded-xl text-sm font-black uppercase tracking-wide hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale" disabled={!prSearch.trim()}>Search PR</button>
                  </div>
               </div>

               {showPRList && (
                 <div className="absolute top-[100%] left-6 right-6 z-50 mt-2 bg-white border border-emerald-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-emerald-50/50 px-4 py-2 border-b border-emerald-50 flex justify-between items-center">
                       <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Available PRs for Obligation</span>
                       <span className="text-[10px] font-bold text-emerald-600 bg-white px-2 py-0.5 rounded-full shadow-sm">{availablePRs.length} FOUND</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                       {availablePRs.length > 0 ? (
                         availablePRs.map(pr => (
                           <button key={pr.id} className="w-full px-6 py-4 text-left hover:bg-emerald-50/50 flex justify-between items-center border-b border-emerald-50 last:border-0 group transition-all" onClick={() => handleSelectPR(pr)}>
                             <div className="space-y-1">
                               <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-neutral-800 group-hover:text-emerald-700 transition-colors">{pr.id}</span>
                                  <span className="text-[9px] font-black px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded uppercase">Approved</span>
                               </div>
                               <p className="text-[11px] text-neutral-400 font-medium line-clamp-1">{pr.purpose}</p>
                             </div>
                             <div className="text-right flex items-center gap-2">
                                <span className="font-mono font-black text-emerald-600 text-base">₱{formatPHP(pr.remaining)}</span>
                                <ChevronRight size={14} className="text-emerald-300 group-hover:translate-x-1 transition-transform" />
                             </div>
                           </button>
                         ))
                       ) : (
                         <div className="px-6 py-12 text-center space-y-3">
                           <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-50 text-neutral-300">
                             <ShoppingCart size={24} />
                           </div>
                           <div className="space-y-1">
                             <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">No Approved PRs Found</p>
                             <p className="text-[11px] text-neutral-400">Approved PRs with balance will appear here.</p>
                           </div>
                         </div>
                       )}
                    </div>
                 </div>
               )}
            </div>
          )}

          <div className={`transition-all duration-300 ${!canEditDetails ? 'opacity-50 grayscale-[0.5]' : ''}`}>
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
                <div className="p-1.5 bg-primary-50 text-primary-600 rounded-lg">
                  <FileText size={18} />
                </div>
                <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">Obligation Details</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Obligation No">
                    <Input type="text" value={obNo} readOnly className="bg-neutral-50 font-mono text-neutral-900 font-bold cursor-not-allowed" />
                  </FormField>
                  <FormField label="Date">
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 z-10" />
                      <Input
                        type="date"
                        className={`pl-11 ${!canEditDetails ? 'bg-neutral-50 cursor-not-allowed' : ''}`}
                        value={obDate}
                        onChange={(e) => setObDate(e.target.value)}
                        disabled={!canEditDetails}
                      />
                    </div>
                  </FormField>
                </div>
                <FormField label="Purpose / Project Description">
                  <Textarea
                    placeholder="Enter purpose or project description..."
                    className={!canEditDetails ? 'bg-neutral-50 cursor-not-allowed' : ''}
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                    disabled={!canEditDetails}
                    rows={3}
                  />
                </FormField>
              </div>
            </div>
          </div>

          <div className={`transition-all duration-300 ${!canEditDetails ? 'opacity-50 grayscale-[0.5]' : ''}`}>
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <ShoppingCart size={18} />
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">Breakdown of Entries</h3>
                </div>
                <div className="flex gap-2">
                  {allotmentClass === 'PS' && (
                    <button
                      onClick={handleLoadPSComponents}
                      disabled={!canEditDetails}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${!canEditDetails ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                    >
                      <Zap size={14} fill="currentColor" /> Load Expense Items
                    </button>
                  )}
                  {allotmentClass === 'MOOE' && (
                    <button
                      onClick={addEntry}
                      disabled={!canEditDetails}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg ${!canEditDetails ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                      <Plus size={14} /> Add Entry
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50/30 text-neutral-400 text-[10px] uppercase tracking-widest font-black border-b border-neutral-100">
                      <th className="px-6 py-3 w-12 text-center">#</th>
                      <th className="px-6 py-3">Expense Item / Description</th>
                      {allotmentClass === 'PS' && <th className="px-6 py-3 text-right w-44">Available Budget</th>}
                      <th className="px-6 py-3 w-44 text-right">Amount</th>
                      {allotmentClass === 'MOOE' && <th className="px-6 py-3 w-12"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {items.map((item, index) => (
                      <tr key={item.id} className="group hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4 text-center text-xs font-bold text-neutral-300">{index + 1}</td>
                        <td className="px-6 py-4">
                          {allotmentClass === 'PS' ? (
                            <p className="text-xs font-bold text-neutral-700">{item.particulars}</p>
                          ) : (
                            <Input
                              type="text"
                              disabled={!canEditDetails}
                              placeholder="Describe this expense item..."
                              className={`!min-h-[38px] !rounded-lg border-transparent hover:border-neutral-200 bg-transparent focus:bg-white text-xs font-bold ${!canEditDetails ? 'cursor-not-allowed' : ''}`}
                              value={item.particulars}
                              onChange={(e) => updateItem(item.id, 'particulars', e.target.value)}
                            />
                          )}
                        </td>
                        {allotmentClass === 'PS' && (
                          <td className="px-6 py-4 text-right text-xs font-bold text-emerald-600 font-mono">
                            ₱{formatPHP(item.allocation)}
                          </td>
                        )}
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block w-full">
                             <span className="absolute left-1 top-1/2 -translate-y-1/2 text-neutral-300 font-bold text-xs z-10">₱</span>
                              <input
                                type="number"
                                disabled={!canEditDetails}
                                className={`w-full pl-4 bg-neutral-50 border border-transparent rounded-lg px-2 py-1.5 text-sm text-right font-mono font-bold outline-none hover:border-neutral-200 focus:bg-white transition-all ${!canEditDetails ? 'cursor-not-allowed' : ''}`}
                                value={item.amount}
                                onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                              />
                          </div>
                        </td>
                        {allotmentClass === 'MOOE' && (
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => removeEntry(item.id)}
                              className={`transition-colors p-1 ${(!canEditDetails || items.length === 1) ? 'text-neutral-100 cursor-not-allowed' : 'text-neutral-200 hover:text-rose-500'}`}
                              disabled={!canEditDetails || items.length === 1}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 bg-neutral-50/30 border-t border-neutral-100 flex justify-end">
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Consolidated Total</p>
                  <h2 className="text-3xl font-black font-mono text-primary-700 tracking-tighter">₱{formatPHP(totalAmount)}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 space-y-5">
            <div className="flex items-center gap-2">
               <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingUp size={18} />
               </div>
              <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">Budget Source</h3>
            </div>

            <div className={`space-y-4 relative ${sourceMode === 'PR' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              {sourceMode === 'PR' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center cursor-not-allowed group">
                   <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-neutral-100 flex flex-col items-center gap-2 transform transition-transform group-hover:scale-110">
                      <Lock size={24} className="text-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest text-center">Source Controlled<br/>by selected pr</span>
                   </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-0.5">Allotment Class</label>
                <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                  <button onClick={() => setAllotmentClass('PS')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${allotmentClass === 'PS' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>PS</button>
                  <button onClick={() => setAllotmentClass('MOOE')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${allotmentClass === 'MOOE' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>MOOE</button>
                </div>
              </div>

              <BudgetFilters
                key={`${sourceMode}-${allotmentClass}`}
                allotmentClass={allotmentClass}
                showAllotmentClass={false}
                onSelectionChange={handleSelectionChange}
              />

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Available Allocation</span>
                  <span className="text-sm font-black text-emerald-900 font-mono">₱{formatPHP(availableAllocation)}</span>
                </div>
                <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                   <div className={`h-full transition-all duration-700 ${totalAmount > availableAllocation ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${availableAllocation > 0 ? Math.min((totalAmount / availableAllocation) * 100, 100) : 0}%` }}></div>
                </div>
                {totalAmount > availableAllocation && availableAllocation > 0 && (
                  <p className="text-[10px] text-rose-600 font-black mt-2 flex items-center gap-1 uppercase tracking-widest">
                    <AlertCircle size={12} /> Amount exceeds allocation
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-xl p-6 text-white shadow-xl">
             <div className="flex items-center gap-2 mb-4 text-primary-400 border-b border-neutral-800 pb-2">
                <CheckCircle2 size={16} />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Compliance Status</h4>
             </div>
             <p className="text-[11px] text-neutral-400 leading-relaxed">All entries must be linked to a valid UACS Object Code. Total amount must not exceed the unreleased balance of the Program Portfolio.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateObligation;
