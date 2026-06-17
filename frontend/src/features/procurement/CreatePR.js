import React, { useState } from 'react';
import { ShoppingCart, Calendar, Info, FileText, Plus, Trash2, Save, Send, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';

const CreatePR = ({ onNavigate }) => {
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
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitCost') {
          updated.total = (updated.quantity || 0) * (updated.unitCost || 0);
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
    grandTotal > 0 &&
    grandTotal <= 125000; // Check against available budget

  return (
    <div className="w-full space-y-3">
      <PageHeader
        path="Transactions / Create Procurement Request"
        title="Create Procurement Request"
        subtitle="Fill out the details for your new PR"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('pr-list')}>Cancel</Button>
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
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
              <Info size={16} className="text-primary-600" />
              <h3 className="font-bold text-neutral-900 text-sm">General Information</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider">PR Number</label>
                <input
                  type="text"
                  value="PR-2024-0012"
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
                    className="w-full pl-10 pr-3 py-2 bg-white border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
                    value={prDate}
                    onChange={(e) => setPrDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider">Purpose / Project Description</label>
                <textarea
                  rows="2"
                  placeholder="Describe the purpose of this procurement..."
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all resize-none"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-primary-600" />
                <h3 className="font-bold text-neutral-900 text-sm">Requested Items</h3>
              </div>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/50 text-neutral-500 text-[9px] uppercase tracking-widest font-bold border-b border-neutral-100">
                    <th className="px-4 py-2 w-10 text-center">#</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2 w-20">Qty</th>
                    <th className="px-4 py-2 w-20">Unit</th>
                    <th className="px-4 py-2 w-28 text-right">Unit Cost</th>
                    <th className="px-4 py-2 w-28 text-right">Total</th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {items.map((item, index) => (
                    <tr key={item.id} className="group">
                      <td className="px-4 py-2 text-center text-xs font-bold text-neutral-400">{index + 1}</td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Item name/specifications"
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-neutral-800 placeholder:text-neutral-200"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="number"
                          className="w-16 bg-neutral-50 border border-transparent hover:border-neutral-200 focus:bg-white focus:border-primary-500 rounded px-1.5 py-1 text-sm text-center focus:ring-0 transition-all"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="text"
                          className="w-16 bg-neutral-50 border border-transparent hover:border-neutral-200 focus:bg-white focus:border-primary-500 rounded px-1.5 py-1 text-sm text-center focus:ring-0 transition-all"
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          className="w-full bg-neutral-50 border border-transparent hover:border-neutral-200 focus:bg-white focus:border-primary-500 rounded px-1.5 py-1 text-sm text-right focus:ring-0 transition-all font-mono"
                          value={item.unitCost}
                          onChange={(e) => updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-bold font-mono text-neutral-900 whitespace-nowrap">
                        ₱{item.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-neutral-300 hover:text-danger-500 transition-colors p-1"
                          disabled={items.length === 1}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-neutral-50/50 border-t border-neutral-100 flex justify-end">
              <div className="text-right space-y-0.5">
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Grand Total Amount</p>
                <h2 className="text-xl font-bold font-mono text-primary-700 tracking-tighter">
                  ₱{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info Area */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-primary-600" />
              <h3 className="font-bold text-neutral-900 text-sm">Budget Source</h3>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Fund Cluster</label>
                <select className="w-full bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500">
                  <option>01 - Regular Agency Fund</option>
                  <option>07 - Trust Receipts</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider">MOOE Item</label>
                <select className="w-full bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500">
                  <option>Office Supplies - General</option>
                  <option>Information Technology Supplies</option>
                  <option>Training & Seminars</option>
                </select>
              </div>

              <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold text-primary-700 uppercase">Available Balance</span>
                  <span className="text-xs font-bold text-primary-900 font-mono">₱125,000.00</span>
                </div>
                <div className="w-full h-1.5 bg-primary-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${grandTotal > 125000 ? 'bg-danger-500' : 'bg-primary-600'}`}
                    style={{ width: `${Math.min((grandTotal / 125000) * 100, 100)}%` }}
                  ></div>
                </div>
                {grandTotal > 125000 && (
                  <p className="text-[9px] text-danger-600 font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle size={10} /> Amount exceeds budget
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg p-4 text-white">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary-400 mb-2">Instructions</h4>
            <ul className="text-[10px] space-y-1.5 opacity-80 leading-relaxed">
              <li>• Item specifications must be clear.</li>
              <li>• Unit costs include all taxes.</li>
              <li>• Attach PPMP if required.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePR;
