import React, { useState, useEffect } from "react";
import {
  FilePlus,
  Calendar,
  User,
  Send,
  Save,
  Search,
  CheckCircle2,
  AlertCircle,
  Wallet,
  ListFilter,
  ArrowRight,
  Loader2
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import ToastService from "../../services/ToastService";
import { financialAPI, obligationAPI, prAPI } from "../../services/api";
import { formatPHP } from "../../utils/formatters";

const CreateObligation = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirect, setIsDirect] = useState(true);
  const [prNumber, setPrNumber] = useState("");
  const [obDate, setObDate] = useState(new Date().toISOString().split("T")[0]);
  const [payee, setPayee] = useState("");
  const [particulars, setParticulars] = useState("");
  const [amount, setAmount] = useState(0);
  const [showPrList, setShowPrList] = useState(false);
  const [obNo, setObNo] = useState("Loading...");

  const [pendingPrs, setPendingPrs] = useState([]);
  const [selectedPr, setSelectedPr] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [regRes, nextNoRes] = await Promise.all([
          financialAPI.getBudgetRegistry(),
          obligationAPI.getNextNo(new Date().getFullYear().toString().slice(-2), (new Date().getMonth() + 1).toString().padStart(2, '0'))
        ]);

        if (regRes.success) {
            // Extract all PRs with balance from registry
            const prsWithBalance = regRes.data.flatMap(act => act.prs.filter(p => p.remaining_amount > 0));
            setPendingPrs(prsWithBalance);
        }
        if (nextNoRes.success) setObNo(nextNoRes.nextObrNo);
      } catch (err) {
        console.error("Initialization failed", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSelectPr = (pr) => {
    setSelectedPr(pr);
    setPrNumber(pr.prno);
    setAmount(pr.remaining_amount);
    setParticulars(`Obligation for ${pr.prno}: ${pr.name || ''}`);
    setShowPrList(false);
  };

  const handleSave = async () => {
      setSaving(true);
      try {
          const data = {
              obrno: obNo,
              transaction_date: obDate,
              particular: particulars,
              amount: amount,
              prno: isDirect ? null : prNumber,
              activities_id: selectedPr ? selectedPr.activities_id : null // Direct would need source resolution
          };
          const res = await obligationAPI.create(data);

          if (res.success) {
              if (res.prStatus?.hasRemainingBalance) {
                  ToastService.toastInfo(`Obligation Created! This PR still has an unobligated balance of ₱${formatPHP(res.prStatus.remainingBalance)}`);
              } else {
                  ToastService.toastSuccess("Obligation created successfully!");
              }
              onNavigate("obligations");
          }
      } catch (err) {
          ToastService.toastError(err.message || "Failed to create obligation");
      } finally {
          setSaving(false);
      }
  };

  const AVAILABLE = 1000000; // This should come from a selected activity for direct obligations
  const remainingAfter = (selectedPr ? selectedPr.remaining_amount : AVAILABLE) - amount;
  const usedPct = Math.min((amount / (selectedPr ? selectedPr.remaining_amount : AVAILABLE)) * 100, 100);
  const overBudget = remainingAfter < 0;

  const isFormValid =
    obDate !== "" &&
    particulars.trim() !== "" &&
    amount > 0 &&
    !overBudget &&
    (isDirect || prNumber.trim() !== "");

  if (loading) return <div className="p-20 text-center font-black text-slate-400 text-[10px] uppercase">Engine Initializing...</div>;

  return (
    <div className="w-full space-y-4">
      <PageHeader
        path="Transactions / Create Obligation"
        title="Create Obligation"
        subtitle="Record a new budget obligation"
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("obligations")}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={saving ? Loader2 : Send}
              size="sm"
              disabled={!isFormValid || saving}
              onClick={handleSave}
            >
              {saving ? "Processing..." : "Submit Obligation"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* ── Main Form ── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold text-slate-800">Obligation Type</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Choose how you want to create this obligation</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit gap-1">
              {[ { label: "Direct Obligation", val: true }, { label: "From PR No.", val: false } ].map(({ label, val }) => (
                <button
                  key={label}
                  onClick={() => setIsDirect(val)}
                  className={`
                    px-4 py-1.5 text-[12px] font-medium rounded-lg transition-all duration-150
                    ${isDirect === val ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {!isDirect && (
            <div className="space-y-2">
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-[10px] font-medium text-emerald-700 uppercase tracking-wider">
                      Search / Select Purchase Request
                    </label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                      <input
                        type="text"
                        placeholder="Enter PR Number (e.g. PR-2024-001)"
                        value={prNumber}
                        readOnly
                        className="w-full pl-9 pr-3 py-2 bg-white border border-emerald-200 rounded-xl text-[13px] font-mono cursor-pointer"
                        onClick={() => setShowPrList(!showPrList)}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPrList(!showPrList)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <ListFilter size={13} className="inline mr-2" />
                    {showPrList ? "Hide List" : "Browse PRs"}
                  </button>
                </div>
              </div>

              {showPrList && (
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Available PRs with Balance</p>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto">
                    {pendingPrs.map((pr) => (
                      <div
                        key={pr.prno}
                        onClick={() => handleSelectPr(pr)}
                        className="px-5 py-3 hover:bg-emerald-50/50 cursor-pointer transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-[10px] font-semibold text-slate-400 group-hover:text-emerald-600 transition-colors flex-shrink-0">PR</div>
                          <div>
                            <p className="text-[13px] font-semibold text-slate-800">{pr.prno}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{pr.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-semibold font-mono text-slate-800">₱{formatPHP(pr.remaining_amount)}</p>
                          <div className="flex items-center justify-end gap-1 text-[10px] font-medium text-emerald-600 mt-0.5">Select <ArrowRight size={10} /></div>
                        </div>
                      </div>
                    ))}
                    {pendingPrs.length === 0 && <div className="p-5 text-center text-slate-400 text-xs italic">No PRs with remaining balance found.</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <FilePlus size={15} className="text-emerald-500" />
              <h3 className="text-[13px] font-semibold text-slate-800">Obligation Details</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Obligation No.</label>
                <input type="text" value={obNo} readOnly className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] font-mono text-slate-700 font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Date</label>
                <input type="date" value={obDate} onChange={(e) => setObDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[13px]" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Particulars / Description</label>
                <textarea rows={2} value={particulars} onChange={(e) => setParticulars(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[13px] resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Amount to Obligate</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-[13px]">₱</span>
                  <input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold font-mono" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Wallet size={15} className="text-emerald-500" />
              <h3 className="text-[13px] font-semibold text-slate-800">Budget Impact</h3>
            </div>
            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <div className={`p-3 rounded-xl border flex justify-between items-center ${overBudget ? "bg-red-50 border-red-100" : "bg-emerald-50/60 border-emerald-100"}`}>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${overBudget ? "text-red-700" : "text-emerald-700"}`}>Remaining After</span>
                <span className={`text-[13px] font-bold font-mono ${overBudget ? "text-red-700" : "text-emerald-700"}`}>₱{formatPHP(Math.abs(remainingAfter))}</span>
              </div>
              {overBudget && (
                <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-[11px]">
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  <span>Insufficient funds! Please check budget allocation.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateObligation;
