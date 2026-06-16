import React, { useState, useRef, useEffect } from "react";
import {
  formatPHP,
  formatAmountWithCursor,
  parsePHP,
  formatDate,
} from "../utils/formatters";
import { prAPI, obligationAPI } from "../utils/api";
import { toast } from "react-toastify";

/* ─── tokens ─── */
const c = {
  green: "#16a34a", greenHover: "#15803d", greenLight: "#f0fdf4",
  gray50: "#f9fafb", gray100: "#f3f4f6", gray200: "#e5e7eb", gray300: "#d1d5db",
  gray400: "#9ca3af", gray500: "#6b7280", gray600: "#4b5563", gray700: "#374151",
  gray900: "#111827", amber: "#d97706", amberLight: "#fffbeb", amberBorder: "#fde68a",
  red: "#dc2626", white: "#ffffff", radius: "10px", radiusSm: "8px", radiusXs: "6px",
};

const inp = {
  padding: "8px 12px", fontSize: 13, border: `1px solid ${c.gray300}`,
  borderRadius: c.radiusXs, background: c.white, color: c.gray900,
  outline: "none", width: "100%", boxSizing: "border-box",
};

const Field = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: 11, fontWeight: 600, color: c.gray500, textTransform: "uppercase" }}>{label}</label>
    {children}
  </div>
);

const MetricCard = ({ label, value, danger, last }) => (
  <div style={{ flex: 1, background: c.gray50, border: `1px solid ${c.gray200}`, borderRadius: c.radiusSm, padding: "14px 18px", position: "relative" }}>
    {last && <span style={{ position: "absolute", top: 10, right: 12, fontSize: 18, color: c.gray400, letterSpacing: 2 }}>···</span>}
    <div style={{ fontSize: 12, fontWeight: 500, color: c.gray500, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 600, color: danger ? c.red : c.gray900, letterSpacing: "-0.5px" }}>{value}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    full: { bg: "#f0fdf4", color: "#15803d", label: "Fully obligated" },
    partial: { bg: "#fffbeb", color: "#b45309", label: "Partial" },
    none: { bg: c.gray100, color: c.gray500, label: "Not obligated" },
  };
  const s = map[status] || map.none;
  return <span style={{ display: "inline-block", background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{s.label}</span>;
};

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z" />
  </svg>
);

const PRObligationModal = ({ isOpen, onClose, onSubmit, selectedActivity }) => {
  const today = new Date().toISOString().split("T")[0];

  const [prForm, setPrForm] = useState({ prno: "", transaction_date: today, amount: "" });
  const [obrForm, setObrForm] = useState({ obrno: "", prno: "", particular: "", amount: "", noPR: false, transaction_date: today });

  const [isSubmittingPR, setIsSubmittingPR] = useState(false);
  const [isSubmittingOBR, setIsSubmittingOBR] = useState(false);
  const [prTableData, setPrTableData] = useState([]);
  const [obrTableData, setObrTableData] = useState([]);
  const [tableType, setTableType] = useState("PR/SO");
  const [isLoadingPR, setIsLoadingPR] = useState(false);
  const [isLoadingOBR, setIsLoadingOBR] = useState(false);
  const [editingPR, setEditingPR] = useState(null);

  const prAmountRef = useRef(null);
  const obrAmountRef = useRef(null);

  const fetchAllData = async () => {
    if (!selectedActivity) return;
    setIsLoadingPR(true); setIsLoadingOBR(true);
    try {
      const [prRes, obrRes] = await Promise.all([prAPI.getActivity(), obligationAPI.getActivity()]);
      setPrTableData((prRes.data.data || []).filter((i) => i.activities_id === selectedActivity.id));
      setObrTableData((obrRes.data.data || []).filter((i) => i.activities_id === selectedActivity.id));
    } catch (err) { toast.error("Failed to fetch data"); }
    finally { setIsLoadingPR(false); setIsLoadingOBR(false); }
  };

  const fetchNextNumbers = async (dateStr) => {
    try {
      const date = dateStr ? new Date(dateStr) : new Date();
      const year = date.getFullYear().toString();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const [prRes, obrRes] = await Promise.all([prAPI.getNextNo(year, month), obligationAPI.getNextNo(year, month)]);
      if (!editingPR) setPrForm((p) => ({ ...p, prno: prRes.data.nextPrNo || "" }));
      setObrForm((p) => ({ ...p, obrno: obrRes.data.nextObrNo || "" }));
    } catch (err) {}
  };

  useEffect(() => { if (isOpen) { fetchAllData(); fetchNextNumbers(today); } }, [isOpen, selectedActivity]);

  /* ─── DYNAMIC MATH ENGINE ─── */
  const getPRBalance = (prno, prAmount) => {
    const spent = obrTableData.filter((o) => o.prno === prno).reduce((s, o) => s + parseFloat(o.amount || 0), 0);
    return parseFloat(prAmount) - spent;
  };

  const getPRStatus = (prno, prAmount) => {
    const bal = getPRBalance(prno, prAmount);
    const obligated = parseFloat(prAmount) - bal;
    if (bal < 0.01) return "full";
    if (obligated > 0.01) return "partial";
    return "none";
  };

  const totalObligated = obrTableData.reduce((s, o) => s + parseFloat(o.amount || 0), 0);
  const unobligated = (selectedActivity?.total_amount || 0) - totalObligated;
  const unfullPRs = prTableData.filter((pr) => getPRBalance(pr.prno, pr.amount) > 0.01);

  /* ─── HANDLERS ─── */
  const handlePRAmountChange = (val) => {
    if (prAmountRef.current) {
      const cursor = prAmountRef.current.selectionStart;
      const { formatted, cursorPosition } = formatAmountWithCursor(val, cursor);
      setPrForm((p) => ({ ...p, amount: formatted }));
      setTimeout(() => prAmountRef.current?.setSelectionRange(cursorPosition, cursorPosition), 0);
    } else setPrForm((p) => ({ ...p, amount: val }));
  };

  const handleSavePR = async (e) => {
    e.preventDefault();
    const amount = parsePHP(prForm.amount);
    if (!prForm.prno.trim() || isNaN(amount) || amount <= 0) return toast.error("Invalid details");
    if (!editingPR && amount > unobligated + 0.01) return toast.error(`Insufficient budget! Available: ${formatPHP(unobligated)}`);

    setIsSubmittingPR(true);
    try {
      const prData = { ...prForm, activities_id: selectedActivity?.id, amount };
      editingPR ? await prAPI.update(editingPR.id, prData) : await prAPI.create(prData);
      toast.success(editingPR ? "PR updated" : "PR created");
      handleCancelEdit();
      await fetchAllData();
      await fetchNextNumbers(prForm.transaction_date);
    } catch (err) { toast.error("Failed to save PR"); }
    finally { setIsSubmittingPR(false); }
  };

  const handleEditPR = (pr) => {
    if (parseFloat(pr.amount) - getPRBalance(pr.prno, pr.amount) > 0.01) return toast.error("Cannot edit PR with obligations");
    setEditingPR(pr);
    setPrForm({ prno: pr.prno, transaction_date: pr.transaction_date?.split("T")[0] || today, amount: formatPHP(pr.amount) });
  };

  const handleCancelEdit = () => { setEditingPR(null); setPrForm({ prno: "", transaction_date: today, amount: "" }); fetchNextNumbers(today); };

  const handleOBRAmountChange = (val) => {
    if (obrAmountRef.current) {
      const cursor = obrAmountRef.current.selectionStart;
      const { formatted, cursorPosition } = formatAmountWithCursor(val, cursor);
      setObrForm((p) => ({ ...p, amount: formatted }));
      setTimeout(() => obrAmountRef.current?.setSelectionRange(cursorPosition, cursorPosition), 0);
    } else setObrForm((p) => ({ ...p, amount: val }));
  };

  const handlePRSelect = (prno) => {
    if (!prno) { setObrForm((p) => ({ ...p, prno: "", amount: "" })); return; }
    const pr = prTableData.find((d) => d.prno === prno);
    if (pr) setObrForm((p) => ({ ...p, prno, amount: formatPHP(Math.max(getPRBalance(pr.prno, pr.amount), 0)) }));
  };

  const handleSaveOBR = async (e) => {
    e.preventDefault();
    const amount = parsePHP(obrForm.amount);
    if (!obrForm.obrno.trim() || !obrForm.particular.trim() || isNaN(amount) || amount <= 0) return toast.error("Invalid details");

    if (obrForm.noPR) {
      if (amount > unobligated + 0.01) return toast.error(`Insufficient budget! Available: ${formatPHP(unobligated)}`);
    } else {
      const pr = prTableData.find((d) => d.prno === obrForm.prno);
      if (!pr) return toast.error("Select a PR");
      const prBal = getPRBalance(pr.prno, pr.amount);
      if (amount > prBal + 0.01) return toast.error(`Exceeds PR balance! Remaining: ${formatPHP(prBal)}`);
      if (amount > unobligated + 0.01) return toast.error("Exceeds actual physical budget!");
    }

    setIsSubmittingOBR(true);
    try {
      await obligationAPI.create({ ...obrForm, activities_id: selectedActivity?.id, amount });
      toast.success("Obligation created");
      onSubmit({ activityId: selectedActivity.id, obligatedAmount: amount });
      setObrForm((p) => ({ ...p, prno: "", amount: "", particular: "", noPR: false }));
      await fetchAllData();
      await fetchNextNumbers(obrForm.transaction_date);
    } catch (err) { toast.error("Failed to save OBR"); }
    finally { setIsSubmittingOBR(false); }
  };

  const handleClose = () => { if (isSubmittingPR || isSubmittingOBR) return; handleCancelEdit(); onClose(); };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }}>
      <div style={{ background: c.white, borderRadius: c.radius, width: "100%", maxWidth: 920, maxHeight: "94vh", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: c.green, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ color: c.white, fontWeight: 600, fontSize: 16 }}>Purchase Request & Obligation</span>
          <button onClick={handleClose} style={{ background: "transparent", border: "none", color: c.white, fontSize: 20, cursor: "pointer", opacity: 0.8 }}>✕</button>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Summary Cards */}
          <div style={{ display: "flex", gap: 12 }}>
            <MetricCard label="Total Allocation" value={formatPHP(selectedActivity?.total_amount)} />
            <MetricCard label="Total Obligated" value={formatPHP(totalObligated)} />
            <MetricCard label="Unobligated Allocation" value={formatPHP(unobligated)} danger={unobligated < 0} last />
          </div>

          {/* Activity Info Banner */}
          <div style={{ background: "#f8fafc", border: `1px solid ${c.gray200}`, borderRadius: c.radiusSm, padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
            <div style={{ fontSize: 12 }}><span style={{ color: c.gray400 }}>PAP Type:</span> <span style={{ color: c.gray700, fontWeight: 600 }}>{selectedActivity?.pap_type || "N/A"}</span></div>
            <div style={{ fontSize: 12 }}><span style={{ color: c.gray400 }}>PAP Des:</span> <span style={{ color: c.gray700, fontWeight: 600 }}>{selectedActivity?.pap_des || "N/A"}</span></div>
            <div style={{ fontSize: 12 }}><span style={{ color: c.gray400 }}>Activity:</span> <span style={{ color: c.gray700, fontWeight: 600 }}>{selectedActivity?.name || "N/A"}</span></div>
            <div style={{ fontSize: 12 }}><span style={{ color: c.gray400 }}>Items:</span> <span style={{ color: c.gray700, fontWeight: 600 }}>{selectedActivity?.expense_items || "N/A"}</span></div>
          </div>

          {/* Pending Reserves Banner */}
          {unfullPRs.length > 0 && (
            <div style={{ background: c.amberLight, border: `1px solid ${c.amberBorder}`, borderRadius: c.radiusSm, padding: "10px 14px", fontSize: 12, color: c.amber, display: "flex", gap: 8 }}>
              <span>⚠️</span>
              <span><strong>Pending PRs:</strong> {unfullPRs.map(pr => pr.prno).join(" · ")}</span>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8 }}>
            {["PR/SO", "OBLIGATION"].map((tab) => (
              <button key={tab} onClick={() => setTableType(tab)} style={{ padding: "6px 20px", fontSize: 12, fontWeight: 600, borderRadius: 999, border: `1.5px solid ${tableType === tab ? c.green : c.gray200}`, background: tableType === tab ? c.greenLight : c.white, color: tableType === tab ? c.greenHover : c.gray500, cursor: "pointer" }}>{tab}</button>
            ))}
          </div>

          {/* PR/SO Tab Content */}
          {tableType === "PR/SO" && (
            <div style={{ border: `1px solid ${c.gray200}`, borderRadius: c.radiusSm }}>
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead style={{ position: "sticky", top: 0, background: c.gray50, zIndex: 1 }}>
                    <tr style={{ borderBottom: `1px solid ${c.gray200}` }}>
                      {["PR NO", "Amount", "Balance", "Status", ""].map(h => <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: c.gray500, fontSize: 11 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {prTableData.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: "22px 14px", textAlign: "center", color: c.gray400 }}>No PR entries yet</td></tr>
                    ) : prTableData.map(pr => (
                      <tr key={pr.id} style={{ borderBottom: `1px solid ${c.gray100}` }}>
                        <td style={{ padding: "12px 14px", fontWeight: 500 }}>{pr.prno}</td>
                        <td style={{ padding: "12px 14px" }}>{formatPHP(pr.amount)}</td>
                        <td style={{ padding: "12px 14px", fontWeight: 600 }}>{formatPHP(Math.max(0, getPRBalance(pr.prno, pr.amount)))}</td>
                        <td style={{ padding: "12px 14px" }}><StatusBadge status={getPRStatus(pr.prno, pr.amount)} /></td>
                        <td style={{ padding: "12px 14px" }}><button onClick={() => handleEditPR(pr)} style={{ border: "1px solid #e2e8f0", background: "white", padding: "4px", borderRadius: "4px", cursor: "pointer", color: c.gray500 }}><EditIcon /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PR Form */}
              <div style={{ padding: "16px", borderTop: `1px solid ${c.gray200}`, background: editingPR ? "#fdfaf0" : c.gray50 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: editingPR ? c.amber : c.gray600, marginBottom: 10, textTransform: "uppercase" }}>{editingPR ? `Editing: ${editingPR.prno}` : "Add New Purchase Request"}</div>
                <form onSubmit={handleSavePR} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
                  <Field label="PR Number"><input style={inp} value={prForm.prno} onChange={e => setPrForm({...prForm, prno: e.target.value})} /></Field>
                  <Field label="Amount"><input ref={prAmountRef} style={{ ...inp, textAlign: "right" }} value={prForm.amount} onChange={e => handlePRAmountChange(e.target.value)} /></Field>
                  <div style={{ display: "flex", gap: 8 }}>
                    {editingPR && <button type="button" onClick={handleCancelEdit} style={{ padding: "10px 18px", background: "white", border: `1px solid ${c.gray300}`, borderRadius: c.radiusXs, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>}
                    <button type="submit" disabled={isSubmittingPR} style={{ padding: "10px 24px", background: editingPR ? c.amber : c.white, color: editingPR ? "white" : c.gray900, border: editingPR ? "none" : `1px solid ${c.gray300}`, borderRadius: c.radiusXs, fontWeight: 600, fontSize: 13 }}>{editingPR ? "Update PR" : "Add PR"}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* OBLIGATION Tab */}
          {tableType === "OBLIGATION" && (
            <div style={{ border: `1px solid ${c.gray200}`, borderRadius: c.radiusSm, maxHeight: 350, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead style={{ position: "sticky", top: 0, background: c.gray50 }}>
                  <tr style={{ borderBottom: `1px solid ${c.gray200}` }}>
                    {["OBR NO", "PR SOURCE", "Particular", "Date", "Amount"].map(h => <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: c.gray500, fontSize: 11 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {obrTableData.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: "22px 14px", textAlign: "center", color: c.gray400 }}>No obligation records yet</td></tr>
                  ) : obrTableData.map(ob => (
                    <tr key={ob.id} style={{ borderBottom: `1px solid ${c.gray100}` }}>
                      <td style={{ padding: "12px 14px", fontWeight: 500 }}>{ob.obrno}</td>
                      <td style={{ padding: "12px 14px", color: c.gray500 }}>{ob.prno || "DIRECT"}</td>
                      <td style={{ padding: "12px 14px" }}>{ob.particular}</td>
                      <td style={{ padding: "12px 14px" }}>{formatDate(ob.transaction_date)}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 600 }}>{formatPHP(ob.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* OBR Entry */}
          {tableType === "PR/SO" && (
            <div style={{ border: `1px solid ${c.gray200}`, borderRadius: c.radiusSm, padding: "16px", background: c.white }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{obrForm.noPR ? "DIRECT OBLIGATION" : "OBLIGATE FROM PR"}</span>
                <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: c.gray600 }}>
                  <input type="checkbox" checked={obrForm.noPR} onChange={e => setObrForm({...obrForm, noPR: e.target.checked, prno: "", amount: ""})} /> No PR (Direct)
                </label>
              </div>
              <form onSubmit={handleSaveOBR} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 1fr auto", gap: 12, alignItems: "end" }}>
                <Field label="OBR NO"><input style={inp} value={obrForm.obrno} onChange={e => setObrForm({...obrForm, obrno: e.target.value})} /></Field>
                {!obrForm.noPR ? (
                  <Field label="Select PR">
                    <select style={inp} value={obrForm.prno} onChange={e => handlePRSelect(e.target.value)}>
                      <option value="">— select —</option>
                      {prTableData.filter(p => getPRBalance(p.prno, p.amount) > 0.01).map(pr => <option key={pr.prno} value={pr.prno}>{pr.prno} (bal: {formatPHP(getPRBalance(pr.prno, pr.amount))})</option>)}
                    </select>
                  </Field>
                ) : <Field label="Source"><input style={{ ...inp, background: c.gray100 }} value="N/A (Direct)" disabled /></Field>}
                <Field label="Particular"><input style={inp} value={obrForm.particular} onChange={e => setObrForm({...obrForm, particular: e.target.value})} /></Field>
                <Field label="Amount"><input ref={obrAmountRef} style={{ ...inp, textAlign: "right" }} value={obrForm.amount} onChange={e => handleOBRAmountChange(e.target.value)} /></Field>
                <button type="submit" disabled={isSubmittingOBR} style={{ padding: "10px 24px", background: c.green, color: "white", border: "none", borderRadius: c.radiusXs, fontWeight: 600 }}>Obligate</button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PRObligationModal;
