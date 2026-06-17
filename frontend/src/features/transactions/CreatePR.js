import React, { useState } from 'react';
import { ShoppingCart, Calendar, Info, FileText, Plus, Trash2, Save, Send, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';

const CreatePR = ({ onCancel }) => {
  const [prDate, setPrDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('');
  const [fundCluster, setFundCluster] = useState('01 - Regular Agency Fund');
  const [mooeItem, setMooeItem] = useState('Office Supplies - General');
  const [items, setItems] = useState([
    { id: 1, description: '', quantity: 1, unit: 'pcs', unitCost: 0, total: 0 }
  ]);

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
    items.every(item => item.description.trim() !== '' && item.unitCost > 0) &&
    grandTotal > 0;

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500">
      <PageHeader
        title="Create Procurement Request"
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
            >
              Submit for Review
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Form Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* General Information */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
              <div className="p-1.5 bg-primary-50 text-primary-600 rounded-lg">
                <Info size={18} />
              </div>
              <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">General Information</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">PR Number</label>
                <input
                  type="text"
                  value="PR-2024-0012"
                  readOnly
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-neutral-500 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Date</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="date"
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
                    value={prDate}
                    onChange={(e) => setPrDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Purpose / Project Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe the purpose of this procurement..."
                  className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all resize-none"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                ></textarea>
              </div>
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
              <button
                onClick={addItem}
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
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3 w-24">Qty</th>
                    <th className="px-6 py-3 w-24">Unit</th>
                    <th className="px-6 py-3 w-32 text-right">Unit Cost</th>
                    <th className="px-6 py-3 w-32 text-right">Total</th>
                    <th className="px-6 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {items.map((item, index) => (
                    <tr key={item.id} className="group hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 text-center text-xs font-bold text-neutral-300">{index + 1}</td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          placeholder="Item name/specifications"
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-neutral-700 placeholder:text-neutral-200"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          className="w-full bg-neutral-50 border border-transparent hover:border-neutral-200 focus:bg-white focus:border-primary-500 rounded-lg px-2 py-1.5 text-sm text-center font-bold focus:ring-0 transition-all"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          placeholder="pcs"
                          className="w-full bg-neutral-50 border border-transparent hover:border-neutral-200 focus:bg-white focus:border-primary-500 rounded-lg px-2 py-1.5 text-sm text-center font-bold focus:ring-0 transition-all"
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                           <span className="absolute left-1 top-1/2 -translate-y-1/2 text-neutral-300 font-bold text-xs">₱</span>
                            <input
                            type="number"
                            className="w-full pl-4 bg-neutral-50 border border-transparent hover:border-neutral-200 focus:bg-white focus:border-primary-500 rounded-lg px-2 py-1.5 text-sm text-right font-mono font-bold focus:ring-0 transition-all"
                            value={item.unitCost}
                            onChange={(e) => updateItem(item.id, 'unitCost', e.target.value)}
                            />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black font-mono text-neutral-900 whitespace-nowrap">
                        ₱{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
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
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Grand Total Amount</p>
                <h2 className="text-3xl font-black font-mono text-emerald-600 tracking-tighter">
                  ₱{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Budget Source */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 space-y-5">
            <div className="flex items-center gap-2">
               <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <FileText size={18} />
               </div>
              <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">Budget Source</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Fund Cluster</label>
                <select
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
                    value={fundCluster}
                    onChange={(e) => setFundCluster(e.target.value)}
                >
                  <option>01 - Regular Agency Fund</option>
                  <option>07 - Trust Receipts</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">MOOE Item</label>
                <select
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
                    value={mooeItem}
                    onChange={(e) => setMooeItem(e.target.value)}
                >
                  <option>Office Supplies - General</option>
                  <option>Information Technology Supplies</option>
                  <option>Training & Seminars</option>
                  <option>Other Supplies & Materials</option>
                </select>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Available Balance</span>
                  <span className="text-sm font-black text-emerald-900 font-mono">₱125,000.00</span>
                </div>
                <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${grandTotal > 125000 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min((grandTotal / 125000) * 100, 100)}%` }}
                  ></div>
                </div>
                {grandTotal > 125000 && (
                  <p className="text-[10px] text-rose-600 font-black mt-2 flex items-center gap-1 uppercase tracking-widest">
                    <AlertCircle size={12} /> Amount exceeds budget
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
