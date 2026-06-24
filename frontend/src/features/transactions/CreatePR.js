import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Calendar, Info, FileText, Plus, Trash2, Save, Send, AlertCircle, Lock } from 'lucide-react';
import { formatPHP } from '../../utils/formatters';
import { prAPI, financialAPI } from '../../services/api';
import ToastService from '../../services/ToastService';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import TransactionFilterEngine from '../../services/TransactionFilterEngine';
import { FormField, Input, Textarea } from '../../components/common/FormControls';
import BudgetFilters from '../../components/common/BudgetFilters';

const CreatePR = ({ onCancel, editId = null }) => {
  const [prNo, setPrNo] = useState('Loading...');
  const [prDate, setPrDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);

  const [selection, setSelection] = useState({});
  const [initialBudgetSelection, setInitialBudgetSelection] = useState(null);
  const [availableAllocation, setAvailableAllocation] = useState(null);

  const [items, setItems] = useState([
    { id: 1, description: '', quantity: 1, unit: 'pcs', unitCost: 0, total: 0 }
  ]);

  // Determine if the form should be interactable
  const isLocked = !selection.mooeId || (availableAllocation === null && !editId) || (availableAllocation !== null && Number(availableAllocation) <= 0 && !editId);

  // Initial Load (New or Edit)
  useEffect(() => {
    const init = async () => {
      if (editId) {
        try {
          setIsLoading(true);
          const res = await prAPI.getById(editId);
          if (res.success) {
            const data = res.data;
            setPrNo(data.prno);
            setPurpose(data.purpose);
            setPrDate(new Date(data.created_at).toISOString().split('T')[0]);
            setItems(data.items.map(item => ({
                id: item.id || Math.random(),
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitCost: item.unit_cost,
                total: item.total
            })));

            // Robust Pre-fill budget selection (Standardized Codes)
            const initial = {
                papType: `${data.pap_type_code || '00000'}|${data.pap_type || 'Uncategorized'}`.trim(),
                papDes: `${data.pap_des_code || '00000'}|${data.pap_des || 'Unnamed PAP'}`.trim(),
                office: (data.office || 'N/A').trim(),
                name: (data.activity || 'General').trim(),
                expenseItem: (data.expense_items || 'General').trim(),
                expenseSubItem: (data.expense_items_sub || '').trim(),
                mooeId: data.mooe_id ? data.mooe_id.toString() : ''
            };
            setInitialBudgetSelection(initial);
            setSelection(initial);
          }
        } catch (err) {
          console.error("Failed to fetch PR for edit:", err);
          ToastService.toastError("Could not load PR data");
        } finally {
          setIsLoading(false);
        }
      } else {
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
      }
    };
    init();
  }, [editId]);

  const handleSelectionChange = useCallback((newSelection) => {
    setSelection(newSelection);
  }, []);

  // Load Allocation
  useEffect(() => {
    if (selection.isComplete && selection.mooeId) {
      TransactionFilterEngine.getAvailableAllocation({
        allotmentClass: 'MOOE',
        mooeId: selection.mooeId
      }).then(val => {
          setAvailableAllocation(val);
      });
    } else {
      if (!editId) setAvailableAllocation(null);
    }
  }, [selection, editId]);

  const addItem = () => {
    if (isLocked && !editId) return;
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
          const q = parseFloat(updated.quantity) || 0;
          const u = parseFloat(updated.unitCost) || 0;
          updated.total = parseFloat((q * u).toFixed(2));
        }
        return updated;
      }
      return item;
    }));
  };

  const grandTotal = parseFloat(items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0).toFixed(2));

  const isDraftValid = purpose.trim() !== '' && !!selection.mooeId;

  const isFormValid =
    isDraftValid &&
    items.every(item => item.description.trim() !== '' && (parseFloat(item.unitCost) || 0) > 0) &&
    grandTotal > 0 &&
    (editId || grandTotal <= (availableAllocation || 0));

  const preparePayload = (status = 'Draft') => ({
    prno: prNo,
    purpose: purpose,
    mooe_id: selection.mooeId,
    expense_item: selection.expenseItem,
    expense_sub_item: selection.expenseSubItem,
    amount: grandTotal,
    workflow_status: status,
    items: items
      .filter(item => item.description.trim() !== '')
      .map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.unitCost,
        total: item.total
      }))
  });

  const handleSaveDraft = async () => {
    if (!isDraftValid) return;

    setIsSubmitting(true);
    try {
      const payload = preparePayload('Draft');
      const response = editId
        ? await prAPI.update(editId, payload)
        : await prAPI.create(payload);

      if (response.success) {
        ToastService.toastSuccess(editId ? "PR Updated Successfully!" : "Purchase Request Draft Saved!");
        onCancel();
      }
    } catch (error) {
      ToastService.toastError(error.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      const payload = preparePayload('For Review');
      const response = editId
        ? await prAPI.update(editId, payload)
        : await prAPI.create(payload);

      if (response.success) {
        ToastService.toastSuccess(editId ? "PR Updated and Submitted!" : "PR Submitted for Review!");
        onCancel();
      }
    } catch (error) {
      ToastService.toastError(error.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading PR Details...</div>;

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500">
      <PageHeader
        title={editId ? "Edit Purchase Request" : "Create Purchase Request"}
        subtitle={editId ? `Updating record for ${prNo}` : "Fill out the details for your new PR"}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
            <Button
                variant="secondary"
                icon={Save}
                size="sm"
                onClick={handleSaveDraft}
                disabled={!isDraftValid || isSubmitting}
            >
                {isSubmitting ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              variant="primary"
              icon={Send}
              size="sm"
              disabled={!isFormValid || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
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
                    className="pl-11 bg-neutral-50 cursor-not-allowed"
                    value={prDate}
                    readOnly
                  />
                </div>
              </FormField>
              <FormField label="Purpose / Project Description" className="md:col-span-2">
                <Textarea
                  placeholder="Describe the purpose of this purchase request..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  disabled={isLocked && !editId}
                />
              </FormField>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary-50 text-primary-600 rounded-lg">
                    <ShoppingCart size={18} />
                </div>
                <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">Requested Items</h3>
              </div>
              <button
                onClick={addItem}
                disabled={isLocked && !editId}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg ${(isLocked && !editId) ? 'bg-neutral-100 text-neutral-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
              >
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
                          disabled={isLocked && !editId}
                          placeholder="Item name/specifications"
                          className="!min-h-[38px] !rounded-lg border-slate-200 hover:border-slate-400 bg-slate-50 focus:bg-white focus:border-emerald-500 cursor-text transition-colors"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          type="number"
                          disabled={isLocked && !editId}
                          className="!min-h-[38px] !rounded-lg border-slate-200 hover:border-slate-400 bg-slate-50 focus:bg-white focus:border-emerald-500 text-center font-bold cursor-text transition-colors"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          type="text"
                          disabled={isLocked && !editId}
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
                            disabled={isLocked && !editId}
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
                        <button
                            onClick={() => removeItem(item.id)}
                            className={`transition-colors p-1 ${(isLocked && !editId) || items.length === 1 ? 'text-neutral-100' : 'text-neutral-200 hover:text-rose-500'}`}
                            disabled={(isLocked && !editId) || items.length === 1}
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
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Grand Total Amount</p>
                <h2 className={`text-3xl font-black font-mono tracking-tighter ${(availableAllocation !== null && grandTotal > availableAllocation) ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ₱{formatPHP(grandTotal)}
                </h2>
              </div>
            </div>
          </div>
        </div>

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
                initialSelection={initialBudgetSelection}
              />
              <div className={`p-4 rounded-xl border ${availableAllocation === null ? 'bg-neutral-50 border-neutral-100' : (Number(availableAllocation) <= 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100')}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${availableAllocation === null ? 'text-neutral-400' : (Number(availableAllocation) <= 0 ? 'text-rose-700' : 'text-emerald-700')}`}>
                    Available Allocation
                  </span>
                  <span className={`text-sm font-black font-mono ${availableAllocation === null ? 'text-neutral-400' : (Number(availableAllocation) <= 0 ? 'text-rose-900' : 'text-emerald-900')}`}>
                    ₱{formatPHP(availableAllocation || 0)}
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-700 ${availableAllocation !== null && (grandTotal > availableAllocation || Number(availableAllocation) <= 0) ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${availableAllocation && Number(availableAllocation) > 0 ? Math.min((grandTotal / availableAllocation) * 100, 100) : (Number(availableAllocation) === 0 ? 100 : 0)}%` }}
                  ></div>
                </div>
                {availableAllocation !== null && (grandTotal > availableAllocation || Number(availableAllocation) <= 0) && (
                  <p className="text-[10px] text-rose-600 font-black mt-2 flex items-center gap-1 uppercase tracking-widest">
                    <AlertCircle size={12} /> {Number(availableAllocation) <= 0 ? 'No budget available' : 'Amount exceeds allocation'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePR;
