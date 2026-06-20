import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingCart,
  Calendar,
  Info,
  FileText,
  Plus,
  Trash2,
  Save,
  Send,
  AlertCircle,
  Loader2
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import ToastService from "../../services/ToastService";
import { financialAPI, prAPI, mooeAPI } from "../../services/api";
import { formatPHP } from "../../utils/formatters";

const CreatePR = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prDate, setPrDate] = useState(new Date().toISOString().split("T")[0]);
  const [purpose, setPurpose] = useState("");
  const [prNo, setPrNo] = useState("Loading...");

  // Hierarchy state
  const [filters, setFilters] = useState({ mooe: {} });
  const [selectedType, setSelectedType] = useState("");
  const [selectedPap, setSelectedPap] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("");
  const [selectedRecord, setSelectedRecord] = useState("");
  const [selectedExpenseItem, setSelectedExpenseItem] = useState("");
  const [selectedSubItem, setSelectedSubItem] = useState("");

  const [availableBalance, setAvailableBalance] = useState(0);
  const [items, setItems] = useState([
    { id: 1, description: "", quantity: 1, unit: "pcs", unitCost: 0, total: 0 },
  ]);

  useEffect(() => {
    const init = async () => {
      try {
        const [filterRes, nextNoRes] = await Promise.all([
          financialAPI.getFilters(),
          prAPI.getNextNo(new Date().getFullYear().toString().slice(-2), (new Date().getMonth() + 1).toString().padStart(2, '0'))
        ]);

        if (filterRes.success) setFilters(filterRes.data);
        if (nextNoRes.success) setPrNo(nextNoRes.nextPrNo);
      } catch (err) {
        console.error("Initialization failed", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Cascading Selection Logic (5-Level Flow)
  const papTypes = Object.keys(filters.mooe);

  const paps = selectedType
    ? Object.keys(filters.mooe[selectedType] || {})
    : [];

  const offices = (selectedType && selectedPap)
    ? Object.keys(filters.mooe[selectedType][selectedPap] || {})
    : [];

  const records = (selectedType && selectedPap && selectedOffice)
    ? Object.keys(filters.mooe[selectedType][selectedPap][selectedOffice] || {})
    : [];

  const expenseItems = (selectedType && selectedPap && selectedOffice && selectedRecord)
    ? Object.keys(filters.mooe[selectedType][selectedPap][selectedOffice][selectedRecord] || {})
    : [];

  const subItems = (selectedType && selectedPap && selectedOffice && selectedRecord && selectedExpenseItem)
    ? filters.mooe[selectedType][selectedPap][selectedOffice][selectedRecord][selectedExpenseItem] || []
    : [];

  // When selection changes, fetch balance
  useEffect(() => {
    const getBalance = async () => {
        if (selectedSubItem) {
            try {
                const res = await mooeAPI.getById(selectedSubItem);
                if (res.success) {
                    setAvailableBalance(res.data.availableAllocation);
                }
            } catch (err) {
                console.error("Balance fetch error:", err);
                setAvailableBalance(0);
            }
        } else {
            setAvailableBalance(0);
        }
    };
    getBalance();
  }, [selectedSubItem]);

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        description: "",
        quantity: 1,
        unit: "pcs",
        unitCost: 0,
        total: 0,
      },
    ]);

  const removeItem = (id) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const updateItem = (id, field, value) =>
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitCost")
          updated.total = (updated.quantity || 0) * (updated.unitCost || 0);
        return updated;
      }),
    );

  const grandTotal = items.reduce((sum, i) => sum + i.total, 0);
  const usedPct = availableBalance > 0 ? Math.min((grandTotal / availableBalance) * 100, 100) : 0;
  const overBudget = grandTotal > availableBalance;

  const handleSubmit = async () => {
      setSaving(true);
      try {
          // Find Activity ID logic would go here
          const prData = {
              prno: prNo,
              transaction_date: prDate,
              purpose,
              amount: grandTotal,
              mooe_id: selectedSubItem,
              items: items.map(item => ({
                  description: item.description,
                  quantity: item.quantity,
                  unit: item.unit,
                  unit_cost: item.unitCost,
                  total: item.total
              }))
          };
          const res = await prAPI.create(prData);
          if (res.success) {
              ToastService.toastSuccess("Purchase Request created successfully!");
              onNavigate("pr-list");
          }
      } catch (err) {
          ToastService.toastError(err.message || "Failed to create Purchase Request");
      } finally {
          setSaving(false);
      }
  };

  const isFormValid =
    prDate !== "" &&
    purpose.trim() !== "" &&
    items.every((i) => i.description.trim() !== "" && i.unitCost > 0) &&
    grandTotal > 0 &&
    !overBudget &&
    selectedRecord !== "";

  if (loading) return <div className="p-20 text-center font-black text-slate-400 text-[10px] uppercase">Engine Initializing...</div>;

  return (
    <div className="w-full space-y-4">
      <PageHeader
        path="Transactions / Create Purchase Request"
        title="Create Purchase Request"
        subtitle="Fill out the details for your new PR"
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("pr-list")}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={saving ? Loader2 : Send}
              size="sm"
              disabled={!isFormValid || saving}
              onClick={handleSubmit}
            >
              {saving ? "Processing..." : "Submit PR"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* ── Main Form ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* General Info */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Info size={15} className="text-emerald-500" />
              <h3 className="text-[13px] font-semibold text-slate-800">
                General Information
              </h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  PR Number
                </label>
                <input
                  type="text"
                  value={prNo}
                  readOnly
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] font-mono text-slate-700 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </label>
                <div className="relative">
                  <Calendar
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="date"
                    value={prDate}
                    onChange={(e) => setPrDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Purpose / Project Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe the purpose of this purchase request…"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={15} className="text-emerald-500" />
                <h3 className="text-[13px] font-semibold text-slate-800">
                  Requested Items
                </h3>
              </div>
              <button
                onClick={addItem}
                className="flex items-center gap-1 text-[12px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {[ "#", "Description", "Qty", "Unit", "Unit Cost", "Total", "" ].map((h, i) => (
                      <th
                        key={i}
                        className={\`px-4 py-2.5 text-[10px] font-medium text-slate-400 uppercase tracking-widest
                          \${i === 0 ? "w-10 text-center" : ""}
                          \${i >= 4 ? "text-right" : ""}
                          \${i === 6 ? "w-10" : ""}
                        \`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item, index) => (
                    <tr
                      key={item.id}
                      className="group hover:bg-slate-50/40 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-center text-[11px] font-medium text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          placeholder="Item name / specifications"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, "description", e.target.value)
                          }
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] text-slate-700 placeholder:text-slate-300 outline-none"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "quantity",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-16 bg-slate-50 border border-transparent hover:border-slate-200 focus:bg-white focus:border-emerald-400 rounded-lg px-2 py-1 text-[13px] text-center focus:ring-0 focus:outline-none transition-all"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) =>
                            updateItem(item.id, "unit", e.target.value)
                          }
                          className="w-16 bg-slate-50 border border-transparent hover:border-slate-200 focus:bg-white focus:border-emerald-400 rounded-lg px-2 py-1 text-[13px] text-center focus:ring-0 focus:outline-none transition-all"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          value={item.unitCost}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "unitCost",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full bg-slate-50 border border-transparent hover:border-slate-200 focus:bg-white focus:border-emerald-400 rounded-lg px-2 py-1 text-[13px] text-right focus:ring-0 focus:outline-none transition-all font-mono"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right text-[13px] font-semibold font-mono text-slate-800 whitespace-nowrap">
                        ₱{formatPHP(item.total)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="text-slate-300 hover:text-red-400 transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <div className="text-right">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">
                  Grand Total Amount
                </p>
                <p className="text-[22px] font-bold font-mono text-emerald-600 tracking-tight">
                  ₱{formatPHP(grandTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Budget Source (Hierarchical) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-emerald-500" />
              <h3 className="text-[13px] font-semibold text-slate-800">
                Allocation Source
              </h3>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">PAP Type</label>
              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setSelectedPap(""); setSelectedOffice(""); setSelectedRecord(""); setSelectedExpenseItem(""); }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12px]"
              >
                <option value="">Select Type</option>
                {papTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">PAP Description</label>
              <select
                value={selectedPap}
                disabled={!selectedType}
                onChange={(e) => { setSelectedPap(e.target.value); setSelectedOffice(""); setSelectedRecord(""); setSelectedExpenseItem(""); }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12px] disabled:opacity-50"
              >
                <option value="">Select PAP</option>
                {paps.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">Office</label>
              <select
                value={selectedOffice}
                disabled={!selectedPap}
                onChange={(e) => { setSelectedOffice(e.target.value); setSelectedRecord(""); setSelectedExpenseItem(""); }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12px] disabled:opacity-50"
              >
                <option value="">Select Office</option>
                {offices.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">MOOE Record</label>
              <select
                value={selectedRecord}
                disabled={!selectedOffice}
                onChange={(e) => { setSelectedRecord(e.target.value); setSelectedExpenseItem(""); }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12px] disabled:opacity-50"
              >
                <option value="">Select Record</option>
                {records.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">Expense Item</label>
              <select
                value={selectedExpenseItem}
                disabled={!selectedRecord}
                onChange={(e) => { setSelectedExpenseItem(e.target.value); setSelectedSubItem(""); }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12px] disabled:opacity-50"
              >
                <option value="">Select Item</option>
                {expenseItems.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            {subItems.length > 0 && (
              <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">Expense Sub Item</label>
                <select
                  value={selectedSubItem}
                  onChange={(e) => setSelectedSubItem(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12px]"
                >
                  <option value="">Select Sub Item</option>
                  {subItems.map(si => <option key={si.id} value={si.id}>{si.label}</option>)}
                </select>
              </div>
            )}

            {/* Balance Meter */}
            <div className={\`p-3.5 rounded-xl border \${overBudget ? "bg-red-50 border-red-100" : "bg-emerald-50/60 border-emerald-100"}\`}>
              <div className="flex justify-between items-center mb-2">
                <span className={\`text-[10px] font-medium uppercase tracking-wider \${overBudget ? "text-red-600" : "text-emerald-700"}\`}>
                  Available Allocation
                </span>
                <span className={\`text-[12px] font-semibold font-mono \${overBudget ? "text-red-700" : "text-emerald-800"}\`}>
                  ₱{formatPHP(availableBalance)}
                </span>
              </div>
              <div className="h-1.5 bg-white rounded-full overflow-hidden border border-slate-100">
                <div
                  className={\`h-full rounded-full transition-all duration-500 \${overBudget ? "bg-red-500" : "bg-emerald-500"}\`}
                  style={{ width: \`\${usedPct}%\` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-slate-400">Used: ₱{formatPHP(grandTotal)}</span>
                <span className={\`text-[10px] font-medium \${overBudget ? "text-red-500" : "text-emerald-600"}\`}>
                  {usedPct.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePR;
