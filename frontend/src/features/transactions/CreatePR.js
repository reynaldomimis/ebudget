import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Calendar, Info, FileText, Plus, Trash2, Save, Send, AlertCircle } from 'lucide-react';
import { formatPHP } from '../../utils/formatters';
import { prAPI } from '../../services/api';
import ToastService from '../../services/ToastService';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import TransactionFilterEngine from '../../services/TransactionFilterEngine';
import { FormField, Input, Textarea } from '../../components/common/FormControls';
import BudgetFilters from '../../components/common/BudgetFilters';

const CreatePR = ({ onCancel }) => {
  const [prNo, setPrNo] = useState('Loading...');
  const [prDate, setPrDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('');

  const [selection, setSelection] = useState({});
  const [availableAllocation, setAvailableAllocation] = useState(0);

  const [items, setItems] = useState([
    { id: 1, description: '', quantity: 1, unit: 'pcs', unitCost: 0, total: 0 }
  ]);

  // Fetch Next PR Number
  useEffect(() => {
    const fetchPrNo = async () => {
      try {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const res = await prAPI.getNextNo(year, month);
        if (res.success) setPrNo(res.nextPrNo);
      } catch (err) {
        console.error("Failed to fetch PR No:", err);
        setPrNo("PR-ERROR");
      }
    };
    fetchPrNo();
  }, []);

  const handleSelectionChange = useCallback((newSelection) => {
    setSelection(newSelection);
  }, []);

  // Load Allocation
  useEffect(() => {
    if (selection.isComplete && selection.mooeId) {
      TransactionFilterEngine.getAvailableAllocation({
        allotmentClass: 'MOOE',
        ...selection
      }).then(setAvailableAllocation);
    } else {
      setAvailableAllocation(null);
    }
  }, [selection]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: '', quantity: 1, unit: 'pcs', unitCost: 0, total: 0 }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitCost') {
          updated.total = (Number(updated.quantity) || 0) * (Number(updated.unitCost) || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  const isFormValid =
    prDate !== '' &&
    purpose.trim() !== '' &&
    selection.isComplete &&
    items.every(item => item.description.trim() !== '' && item.unitCost > 0) &&
    grandTotal > 0 &&
    availableAllocation !== null &&
    grandTotal <= availableAllocation;

  const handleSubmit = async () => {
    const prData = {
      prno: prNo,
      transaction_date: prDate,
      purpose: purpose,
      mooe_id: selection.mooeId,
      expense_item: selection.expenseItem,
      expense_sub_item: selection.expenseSubItem,
      amount: grandTotal, // FIXED: Changed from total_amount to amount
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.unitCost,
        total: item.total
      }))
    };

    console.log("DEBUG: Final Frontend Payload:", JSON.stringify(prData, null, 2));

    try {
      const response = await prAPI.create(prData);
      if (response.success) {
        ToastService.toastSuccess("Purchase Request Submitted Successfully!");
        onCancel();
      }
    } catch (error) {
      console.error("Submission failed:", error);
      ToastService.toastError("Failed to submit PR: " + (error.message || "Unknown error"));
    }
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500">
      <PageHeader
        title="Create Purchase Request"
        subtitle="Fill out the details for your new PR"
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
              Submit for Review
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
              <div className="p-1.5 bg-primary-50 text-primary-600 rounded-lg">
                <Info size={18} />
              </div>
              <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">General Information</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="PR Number">
                <Input
                  type="text"
                  value={prNo}
                  readOnly
                  className="bg-neutral-50 font-mono text-neutral-500 cursor-not-allowed"
                />
              </FormField>
              <FormField label="Date">
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 z-10" />
                  <Input
                    type="date"
                    className="pl-11"
                    value={prDate}
                    onChange={(e) => setPrDate(e.target.value)}
                  />
                </div>
              </FormField>
              <FormField label="Purpose / Project Description" className="md:col-span-2">
                <Textarea
                  placeholder="Describe the purpose of this purchase request..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </FormField>
            </div>
          </div>

          {/* Requested Items */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary-50 text-primary-600 rounded-lg">
                    <ShoppingCart size={18} />
                </div>
                <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">Requested Items</h3>
              </div>
              <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg">
                <Plus size={14} /> Add Entry
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/30 text-neutral-400 text-[10px] uppercase tracking-widest font-black border-b border-neutral-100">
                    <th className="px-6 py-3 w-12 text-center">#</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3 w-32">Qty</th>
                    <th className="px-6 py-3 w-32">Unit</th>
                    <th className="px-6 py-3 w-44 text-right">Unit Cost</th>
                    <th className="px-6 py-3 w-40 text-right">Total</th>
                    <th className="px-6 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {items.map((item, index) => (
                    <tr key={item.id} className="group hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 text-center text-xs font-bold text-neutral-300">{index + 1}</td>
                      <td className="px-6 py-4">
                        <Input
                          type="text"
                          placeholder="Item name/specifications"
                          className="!min-h-[38px] !rounded-lg border-slate-200 hover:border-slate-400 bg-slate-50 focus:bg-white focus:border-emerald-500 cursor-text transition-colors"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          type="number"
                          className="!min-h-[38px] !rounded-lg border-slate-200 hover:border-slate-400 bg-slate-50 focus:bg-white focus:border-emerald-500 text-center font-bold cursor-text transition-colors"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          type="text"
                          placeholder="pcs"
                          className="!min-h-[38px] !rounded-lg border-slate-200 hover:border-slate-400 bg-slate-50 focus:bg-white focus:border-emerald-500 text-center cursor-text transition-colors"
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs z-10 pointer-events-none">₱</span>
                          <Input
                            type="number"
                            className="!min-h-[38px] !rounded-lg border-slate-200 hover:border-slate-400 bg-slate-50 focus:bg-white focus:border-emerald-500 text-right pl-6 font-mono font-bold cursor-text transition-colors"
                            value={item.unitCost}
                            onChange={(e) => updateItem(item.id, 'unitCost', e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black font-mono text-neutral-900 whitespace-nowrap">
                        ₱{formatPHP(item.total)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => removeItem(item.id)} className="text-neutral-200 hover:text-rose-500 transition-colors p-1" disabled={items.length === 1}>
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
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Grand Total Amount</p>
                <h2 className="text-3xl font-black font-mono text-emerald-600 tracking-tighter">
                  ₱{formatPHP(grandTotal)}
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
                <FileText size={18} />
              </div>
              <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">Budget Source</h3>
            </div>

            <div className="space-y-4">
              <BudgetFilters
                allotmentClass="MOOE"
                onSelectionChange={handleSelectionChange}
              />

              <div className={`p-4 rounded-xl border ${availableAllocation === null ? 'bg-neutral-50 border-neutral-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${availableAllocation === null ? 'text-neutral-400' : 'text-emerald-700'}`}>
                    Available Allocation
                  </span>
                  <span className={`text-sm font-black font-mono ${availableAllocation === null ? 'text-neutral-400' : 'text-emerald-900'}`}>
                    ₱{formatPHP(availableAllocation || 0)}
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-700 ${availableAllocation !== null && grandTotal > availableAllocation ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${availableAllocation && availableAllocation > 0 ? Math.min((grandTotal / availableAllocation) * 100, 100) : 0}%` }}
                  ></div>
                </div>
                {availableAllocation !== null && grandTotal > availableAllocation && availableAllocation > 0 && (
                  <p className="text-[10px] text-rose-600 font-black mt-2 flex items-center gap-1 uppercase tracking-widest">
                    <AlertCircle size={12} /> Amount exceeds allocation
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-slate-900 rounded-xl p-6 text-white shadow-xl shadow-slate-900/20">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4 border-b border-slate-800 pb-2">Instructions</h4>
            <ul className="text-[11px] space-y-3 font-medium text-slate-300 leading-relaxed">
              <li className="flex gap-2">
                  <span className="text-emerald-500">•</span>
                  Ensure all item specifications are clear and complete.
              </li>
              <li className="flex gap-2">
                  <span className="text-emerald-500">•</span>
                  Unit costs should include relevant taxes and fees.
              </li>
              <li className="flex gap-2">
                  <span className="text-emerald-500">•</span>
                  Attachment of Quotations or PPMP may be required during review.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePR;
