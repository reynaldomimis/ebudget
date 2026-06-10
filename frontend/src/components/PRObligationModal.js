import React, { useState, useRef, useEffect } from "react";
import {
  formatPHP,
  formatAmountWithCursor,
  parsePHP,
  formatDate,
  toInputDate,
} from "../utils/formatters";
import { prSoAPI, obligationAPI } from "../utils/api";
import { toast } from "react-toastify";

/* ─── design tokens ─── */
const c = {
  green:       "#16a34a",
  greenHover:  "#15803d",
  greenLight:  "#f0fdf4",
  greenBorder: "#bbf7d0",
  gray50:      "#f9fafb",
  gray100:     "#f3f4f6",
  gray200:     "#e5e7eb",
  gray300:     "#d1d5db",
  gray400:     "#9ca3af",
  gray500:     "#6b7280",
  gray600:     "#4b5563",
  gray700:     "#374151",
  gray900:     "#111827",
  amber:       "#d97706",
  amberLight:  "#fffbeb",
  amberBorder: "#fde68a",
  red:         "#dc2626",
  white:       "#ffffff",
  radius:      "10px",
  radiusSm:    "8px",
  radiusXs:    "6px",
};

/* ─── shared input style — matches Image 3 inputs ─── */
const inp = {
  padding:       "8px 12px",
  fontSize:      13,
  border:        `1px solid ${c.gray300}`,
  borderRadius:  c.radiusXs,
  background:    c.white,
  color:         c.gray900,
  outline:       "none",
  width:         "100%",
  boxSizing:     "border-box",
};

/* ─── Field label wrapper ─── */
const Field = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: 12, fontWeight: 500, color: c.gray600 }}>{label}</label>
    {children}
  </div>
);

/* ─── Top metric card — exact Image 3 style ─── */
const MetricCard = ({ label, value, danger, last }) => (
  <div
    style={{
      flex: 1,
      background:   c.gray50,
      border:       `1px solid ${c.gray200}`,
      borderRadius: c.radiusSm,
      padding:      "14px 18px",
      position:     "relative",
    }}
  >
    {last && (
      <span
        style={{
          position: "absolute", top: 10, right: 12,
          fontSize: 18, color: c.gray400, cursor: "default", letterSpacing: 2,
        }}
      >
        ···
      </span>
    )}
    <div style={{ fontSize: 13, color: c.gray500, marginBottom: 6 }}>{label}</div>
    <div
      style={{
        fontSize:      22,
        fontWeight:    600,
        color:         danger ? c.red : c.gray900,
        letterSpacing: "-0.3px",
      }}
    >
      {value}
    </div>
  </div>
);

/* ─── Status badge ─── */
const StatusBadge = ({ status }) => {
  const map = {
    full:    { bg: "#f0fdf4", color: "#15803d", label: "Fully obligated" },
    partial: { bg: "#fffbeb", color: "#b45309", label: "Partial"         },
    none:    { bg: c.gray100, color: c.gray500,  label: "Not obligated"  },
  };
  const s = map[status] || map.none;
  return (
    <span
      style={{
        display:      "inline-block",
        background:   s.bg,
        color:        s.color,
        fontSize:     12,
        fontWeight:   500,
        padding:      "3px 10px",
        borderRadius: 999,
        whiteSpace:   "nowrap",
      }}
    >
      {s.label}
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════════ */
const PRObligationModal = ({ isOpen, onClose, onSubmit, selectedActivity }) => {
  const [formData, setFormData] = useState({
    type:             "PR",
    prno:             "",
    obrno:            "",
    transaction_date: new Date().toISOString().split("T")[0],
    amount:           "",
    particular:       "",
  });
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [tableData,      setTableData]      = useState([]);
  const [tableType,      setTableType]      = useState("PR/SO");
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [selectedRow,    setSelectedRow]    = useState(null);
  const [totalAllocation, setTotalAllocation] = useState(selectedActivity?.totalFq || 0);
  const [mode, setMode] = useState("create");
  const [obAmount, setObAmount] = useState(""); // separate — para hindi mag-sync sa PR amount
  const amountInputRef   = useRef(null);
  const obAmountInputRef = useRef(null);
  const today = new Date().toISOString().split("T")[0];

  /* ── fetch next number ── */
  const fetchNextNumber = async (dateStr) => {
    try {
      const date  = dateStr ? new Date(dateStr) : new Date();
      const year  = date.getFullYear().toString();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      if (formData.type === "PR") {
        const res = await prSoAPI.getNextNo(year, month);
        setFormData((p) => ({ ...p, prno: res.data.nextPrNo || "" }));
      } else {
        const res = await obligationAPI.getNextNo(year, month);
        setFormData((p) => ({ ...p, obrno: res.data.nextObrNo || "" }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch next number");
    }
  };

  useEffect(() => { if (isOpen) fetchNextNumber(formData.transaction_date); },
    [isOpen, formData.transaction_date, formData.type]);

  useEffect(() => {
    if (selectedActivity) {
      setFormData((p) => ({
        ...p,
        activities:        selectedActivity.Activities        || "",
        expense_items:     selectedActivity["EXPENSE ITEMS"]  || "",
        expense_items_sub: selectedActivity["EXPENSE SUB-ITEM"] || "",
        pap_type:          selectedActivity.pap_type          || "",
        pap_des:           selectedActivity.pap_des           || "",
      }));
      setTotalAllocation(selectedActivity.totalFq || 0);
    }
  }, [selectedActivity]);

  useEffect(() => { if (selectedActivity && isOpen) fetchTableData(); },
    [selectedActivity, tableType, isOpen]);

  const fetchTableData = async () => {
    if (!selectedActivity) return;
    setIsLoadingTable(true);
    setTableData([]);
    try {
      const response = tableType === "PR/SO"
        ? await prSoAPI.getActivity()
        : await obligationAPI.getActivity();
      const data = (response.data.data || []).filter(
        (item) => item.activities_id === selectedActivity.id,
      );
      setTableData(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch table data");
      setTableData([]);
    } finally {
      setIsLoadingTable(false);
    }
  };

  const handleTypeChange = (type) => {
    setFormData({ type, prno: "", obrno: "", transaction_date: today, amount: "", particular: "" });
    setTableType(type === "PR" ? "PR/SO" : "OBLIGATION");
    setMode("create");
    setSelectedRow(null);
  };

  const handleInputChange  = (field, value) => setFormData((p) => ({ ...p, [field]: value }));
  const handleDateChange   = (value)         => handleInputChange("transaction_date", value);

  const handleAmountChange = (field, value) => {
    if (amountInputRef.current) {
      const cursor = amountInputRef.current.selectionStart;
      const { formatted, cursorPosition } = formatAmountWithCursor(value, cursor);
      setFormData((p) => ({ ...p, [field]: formatted }));
      setTimeout(() => amountInputRef.current?.setSelectionRange(cursorPosition, cursorPosition), 0);
    } else {
      setFormData((p) => ({ ...p, [field]: value }));
    }
  };

  /* ── validation ── */
  const validateForm = () => {
    const prAmt = parsePHP(formData.amount);
    const obAmt = parsePHP(obAmount);

    if (formData.type === "PR") {
      if (!formData.prno.trim()) { toast.error("PR Number is required"); return false; }
      if (!formData.transaction_date) { toast.error("Transaction Date is required"); return false; }
      if (isNaN(prAmt) || prAmt <= 0) { toast.error("Enter a valid PR amount"); return false; }
      if (prAmt > totalAllocation) {
        toast.error(`Invalid Amount: must not exceed allocation. Allocation: ${formatPHP(totalAllocation)}`);
        return false;
      }
    }

    if (formData.type === "Obligation") {
      if (!formData.obrno.trim())      { toast.error("OBR Number is required");  return false; }
      if (!formData.particular.trim()) { toast.error("Particular is required");  return false; }
      if (!formData.transaction_date)  { toast.error("Transaction Date is required"); return false; }
      if (isNaN(obAmt) || obAmt <= 0) { toast.error("Enter a valid obligation amount"); return false; }
      if (!formData.noPR && selectedRow?.PRNO && obAmt > Number(selectedRow["AMOUNT PR"])) {
        toast.error(`Invalid Obligation Amount: must not exceed PR amount (${formatPHP(selectedRow["AMOUNT PR"])}).`);
        return false;
      }
      if (obAmt > totalAllocation) {
        toast.error(`Invalid Amount: must not exceed allocation. Allocation: ${formatPHP(totalAllocation)}`);
        return false;
      }
    }

    return true;
  };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (formData.type === "PR") {
        const amount = parsePHP(formData.amount);
        const prData = {
          activities_id:    selectedActivity?.id,
          prno:             formData.prno,
          transaction_date: formData.transaction_date,
          amount,
          amount_unobligated: totalAllocation,
        };
        mode === "update" && selectedRow?.PRNO
          ? await prSoAPI.update(selectedRow.PRNO, prData)
          : await prSoAPI.create(prData);
        toast.success(`PR/SO ${mode === "update" ? "updated" : "created"}`);
      } else {
        const amount = parsePHP(obAmount); // use obAmount — separate from PR amount
        const deductAllocation  = parsePHP(selectedRow?.["AMOUNT PR"] || obAmount);
        const unobligatedAmount = totalAllocation > 0
          ? totalAllocation - deductAllocation
          : deductAllocation - totalAllocation;
        const obrData = {
          activities_id:    selectedActivity?.id,
          prno:             formData.noPR ? "" : (selectedRow?.PRNO || ""),
          obrno:            formData.obrno,
          transaction_date: formData.transaction_date,
          particular:       formData.particular,
          amount,
          amount_unobligated: unobligatedAmount,
        };
        try {
          mode === "update" && selectedRow?.OBRNO
            ? await obligationAPI.update(selectedRow.OBRNO, obrData)
            : await obligationAPI.create(obrData);
          toast.success(`Obligation ${mode === "update" ? "updated" : "created"}`);
          if (selectedRow?.PRNO) {
            try {
              await prSoAPI.updateUnobligatedAmount(selectedRow.PRNO, {
                obligated:   amount,
                unobligated: unobligatedAmount,
              });
            } catch (prError) {
              console.error("Failed to update PR unobligated amount:", prError);
              toast.error("Failed to update PR unobligated amount");
            }
          }
          onSubmit({ activityId: selectedActivity.id, obligatedAmount: amount });
          setTotalAllocation(unobligatedAmount);
        } catch (obrError) {
          console.error("Failed to save OBR:", obrError);
          toast.error("Failed to save OBR");
        }
      }
      const nextType = selectedRow ? "PR" : formData.type === "Obligation" ? "Obligation" : "PR";
      setFormData({ type: nextType, transaction_date: today, amount: "", particular: "", prno: "", obrno: "", noPR: false });
      setObAmount(""); // reset ob amount too
      if (selectedRow) setTableType("PR/SO");
      setMode("create");
      setSelectedRow(null);
      await fetchTableData();
      await fetchNextNumber(today);
    } catch (err) {
      console.error(err);
      toast.error("Error saving transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── row formatters ── */
  const getFormattedPRRows = () =>
    tableData.map((item) =>
      tableType === "PR/SO"
        ? {
            id:        item.id,
            prno:      item.prno,
            date:      formatDate(item.transaction_date),
            amountPR:  item.amount,
            obligated: item.amount_obligated || 0,
            unobligated: item.amount_unobligated,
            balancePR: item.amount - (item.amount_obligated || 0),
          }
        : {
            id:         item.id,
            obrno:      item.obrno,
            prno:       item.prno || "",
            particular: item.particular,
            date:       formatDate(item.transaction_date),
            obligated:  item.amount,
            unobligated: item.amount_unobligated,
          },
    );

  const getPRStatus = (row) => {
    const bal = row.balancePR ?? (row.amountPR - row.obligated);
    if (bal <= 0)          return "full";
    if (row.obligated > 0) return "partial";
    return "none";
  };

  /* computed totals — always from PR table regardless of active tab */
  const prRows          = tableData.map((item) => ({
    obligated: item.amount_obligated || 0,
    amount:    item.amount,
  }));
  const totalObligated  = prRows.reduce((s, r) => s + r.obligated, 0);
  const unobligatedAlloc = (selectedActivity?.total_amount || 0) - totalObligated;

  /* unfull PRs for warning */
  const unfullPRs = getFormattedPRRows().filter(
    (r) => tableType === "PR/SO" && getPRStatus(r) !== "full",
  );

  const handleProceed = (row) => {
    if (row.obligated > 0) {
      toast.error("This PR has already been obligated");
    } else {
      setSelectedRow({ PRNO: row.prno, "AMOUNT PR": row.amountPR });
      setFormData((p) => ({ ...p, type: "Obligation", amount: formatPHP(row.balancePR) || "0.00", particular: "" }));
      setTableType("OBLIGATION");
      setMode("create");
    }
  };

  const handleUpdate = (row) => {
    if (tableType === "PR/SO") {
      if (row.obligated > 0) { toast.error("This PR has already been obligated"); return; }
      setMode("update");
      setSelectedRow({ PRNO: row.prno, "AMOUNT PR": row.amountPR });
      setFormData((p) => ({
        ...p, type: "PR", prno: row.prno,
        transaction_date: toInputDate(row.date),
        amount: formatPHP(row.amountPR) || "0.00",
      }));
    } else {
      setMode("update");
      setSelectedRow({ OBRNO: row.obrno, PRNO: row.prno });
      setFormData((p) => ({
        ...p, type: "Obligation", obrno: row.obrno,
        particular: row.particular,
        transaction_date: toInputDate(row.date),
        amount: formatPHP(row.obligated) || "0.00",
      }));
    }
  };

  const handleCancel = async () => {
    if (isSubmitting) return;
    const currentDate = formData.transaction_date;
    setFormData({
      ...formData, amount: "",
      prno:  formData.type === "PR"          ? "" : formData.prno,
      obrno: formData.type === "Obligation"  ? "" : formData.obrno,
      particular: "",
    });
    setSelectedRow(null);
    setMode("create");
    await fetchNextNumber(currentDate);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setFormData({ type: "PR", prno: "", obrno: "", transaction_date: today, amount: "", particular: "" });
    setSelectedRow(null);
    setMode("create");
    onClose();
  };

  if (!isOpen) return null;

  const isPR     = formData.type === "PR";
  const isUpdate = mode === "update";
  const rows     = getFormattedPRRows();

  /* ── delete icon SVG ── */
  const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );

  /* ════════ RENDER ════════ */
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "12px",
      }}
    >
      <div
        style={{
          background:   c.white,
          borderRadius: c.radius,
          width:        "100%",
          maxWidth:     860,
          maxHeight:    "92vh",
          display:      "flex",
          flexDirection: "column",
          overflow:     "hidden",
          boxShadow:    "0 20px 60px rgba(0,0,0,0.18)",
        }}
      >
        {/* ── green header ── */}
        <div
          style={{
            background: c.green,
            padding:    "11px 20px",
            display:    "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span style={{ color: c.white, fontWeight: 600, fontSize: 15 }}>
            {isUpdate ? "Update entry" : isPR ? "Purchase request" : "Obligation"}
            {selectedRow?.PRNO && !isPR && (
              <span
                style={{
                  marginLeft: 10, fontSize: 11,
                  background: "rgba(255,255,255,0.2)",
                  padding: "2px 8px", borderRadius: 999, color: c.white,
                }}
              >
                linked: {selectedRow.PRNO}
              </span>
            )}
          </span>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              background: "transparent", border: "none",
              color: "rgba(255,255,255,0.85)", fontSize: 18,
              cursor: "pointer", lineHeight: 1, padding: "2px 6px",
            }}
          >
            ✕
          </button>
        </div>

        {/* ── scrollable body ── */}
        <div
          style={{
            flex: 1, overflowY: "auto",
            padding: "18px 20px",
            display: "flex", flexDirection: "column", gap: 14,
            background: c.white,
          }}
        >

          {/* activity info strip */}
          <div
            style={{
              background: c.gray50, border: `1px solid ${c.gray200}`,
              borderRadius: c.radiusSm, padding: "9px 14px",
              fontSize: 12, color: c.gray600,
              display: "flex", flexWrap: "wrap", gap: "4px 18px",
            }}
          >
            {[
              ["PAP Type",    selectedActivity?.pap_type],
              ["PAP Des",     selectedActivity?.pap_des],
              ["Activity",    selectedActivity?.name],
              selectedActivity?.expense_items     && ["Expense Items",    selectedActivity.expense_items],
              selectedActivity?.expense_items_sub && ["Sub-Items",        selectedActivity.expense_items_sub],
            ].filter(Boolean).map(([k, v]) => (
              <span key={k}>
                <span style={{ color: c.gray400 }}>{k}: </span>
                <span style={{ color: c.gray700, fontWeight: 500 }}>{v || "—"}</span>
              </span>
            ))}
          </div>

          {/* ── 3 metric cards — exact Image 3 ── */}
          <div style={{ display: "flex", gap: 10 }}>
            <MetricCard label="Allocation"            value={formatPHP(selectedActivity?.total_amount)} />
            <MetricCard label="Total obligated"       value={formatPHP(totalObligated)} />
            <MetricCard label="Unobligated allocation" value={formatPHP(unobligatedAlloc)}
              danger={unobligatedAlloc < 0} last />
          </div>

          {/* ── unfull PR warning ── */}
          {unfullPRs.length > 0 && (
            <div
              style={{
                background: c.amberLight, border: `1px solid ${c.amberBorder}`,
                borderRadius: c.radiusSm, padding: "9px 14px",
                fontSize: 12, color: c.amber, display: "flex", gap: 8,
              }}
            >
              <span>⚠</span>
              <span>
                <strong>{unfullPRs.length} PR{unfullPRs.length > 1 ? "s" : ""} not yet fully obligated: </strong>
                {unfullPRs.map((r) => `${r.prno} (bal: ${formatPHP(r.balancePR)})`).join(" · ")}
              </span>
            </div>
          )}

          {/* ── tab toggle ── */}
          <div style={{ display: "flex", gap: 6 }}>
            {["PR/SO", "OBLIGATION"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setTableType(tab);
                  setFormData((p) => ({ ...p, type: tab === "PR/SO" ? "PR" : "Obligation" }));
                }}
                style={{
                  padding:    "5px 16px",
                  fontSize:   12, fontWeight: 500,
                  borderRadius: 999,
                  border:     `1.5px solid ${tableType === tab ? c.green : c.gray200}`,
                  background: tableType === tab ? c.greenLight : c.white,
                  color:      tableType === tab ? c.greenHover : c.gray500,
                  cursor:     "pointer",
                }}
              >
                {tab}
              </button>
            ))}
            {isLoadingTable && (
              <span style={{ fontSize: 12, color: c.gray400, alignSelf: "center", marginLeft: 4 }}>
                Loading…
              </span>
            )}
          </div>

          {/* ══════ PR/SO CARD — exact Image 3 ══════ */}
          {tableType === "PR/SO" && (
            <div
              style={{
                border: `1px solid ${c.gray200}`,
                borderRadius: c.radiusSm,
                overflow: "hidden",
                background: c.white,
              }}
            >
              {/* section label */}
              <div style={{ padding: "12px 16px 0 16px", fontSize: 13, fontWeight: 500, color: c.gray700 }}>
                PR entries
              </div>

              {/* table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 13 }}>
                  <colgroup>
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "17%" }} />
                    <col style={{ width: "17%" }} />
                    <col style={{ width: "17%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "9%"  }} />
                  </colgroup>
                  <thead>
                    <tr>
                      {["PRNO", "Amount PR", "Obligated", "Balance PR", "Status", ""].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 14px", textAlign: "left",
                            fontSize: 12, fontWeight: 500, color: c.gray500,
                            borderBottom: `1px solid ${c.gray200}`,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: "22px 14px", textAlign: "center", color: c.gray400, fontSize: 13 }}>
                          No PR entries yet
                        </td>
                      </tr>
                    )}
                    {rows.map((row, i) => {
                      const st  = getPRStatus(row);
                      const bal = row.balancePR;
                      return (
                        <tr
                          key={row.id || i}
                          style={{ borderBottom: `1px solid ${c.gray100}` }}
                        >
                          <td style={{ padding: "11px 14px", color: c.gray700 }}>{row.prno}</td>
                          <td style={{ padding: "11px 14px", color: c.gray700 }}>{formatPHP(row.amountPR)}</td>
                          <td style={{ padding: "11px 14px", color: c.gray700 }}>{formatPHP(row.obligated)}</td>
                          <td style={{ padding: "11px 14px", color: bal <= 0 ? c.green : c.gray700, fontWeight: bal <= 0 ? 500 : 400 }}>
                            {formatPHP(bal)}
                          </td>
                          <td style={{ padding: "11px 14px" }}>
                            <StatusBadge status={st} />
                          </td>
                          <td style={{ padding: "11px 14px" }}>
                            <button
                              onClick={() => handleUpdate(row)}
                              title="Delete / Edit"
                              style={{
                                padding: "5px 7px", fontSize: 13,
                                border: `1px solid ${c.gray200}`,
                                borderRadius: c.radiusXs,
                                background: c.white, color: c.gray500,
                                cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}
                            >
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Add new PR inline form — exact Image 3 ── */}
              <div style={{ padding: "14px 16px", borderTop: `1px solid ${c.gray200}` }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: c.gray700, marginBottom: 10 }}>
                  Add new PR
                </div>
                <form
                  onSubmit={handleSubmit}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr auto",
                    gap: 10, alignItems: "end",
                  }}
                >
                  <Field label="PRNO">
                    <input
                      style={inp} type="text"
                      placeholder="PR-2026-06-020"
                      value={formData.prno}
                      onChange={(e) => handleInputChange("prno", e.target.value)}
                    />
                  </Field>
                  <Field label="Amount">
                    <input
                      ref={amountInputRef}
                      style={{ ...inp, textAlign: "right" }}
                      type="text" placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => handleAmountChange("amount", e.target.value)}
                    />
                  </Field>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: "8px 18px", fontSize: 13, fontWeight: 500,
                      border: `1px solid ${c.gray300}`,
                      borderRadius: c.radiusXs,
                      background: c.white, color: c.gray700,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isSubmitting ? "Saving…" : isUpdate ? "Update" : "Add PR"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ══════ OBLIGATION CARD — exact Image 3 bottom section ══════ */}
          {tableType === "OBLIGATION" && (
            <div
              style={{
                border: `1px solid ${c.gray200}`,
                borderRadius: c.radiusSm,
                overflow: "hidden",
                background: c.white,
              }}
            >
              {/* obligation table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 13 }}>
                  <colgroup>
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "26%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "12%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      {["OBRNO", "PRNO", "Particular", "Obligated", "Unobligated", ""].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 14px", textAlign: "left",
                            fontSize: 12, fontWeight: 500, color: c.gray500,
                            borderBottom: `1px solid ${c.gray200}`,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: "22px 14px", textAlign: "center", color: c.gray400, fontSize: 13 }}>
                          No obligation entries yet
                        </td>
                      </tr>
                    )}
                    {rows.map((row, i) => (
                      <tr key={row.id || i} style={{ borderBottom: `1px solid ${c.gray100}` }}>
                        <td style={{ padding: "11px 14px", fontWeight: 500, color: c.gray700 }}>{row.obrno}</td>
                        <td style={{ padding: "11px 14px", color: c.gray600 }}>{row.prno || "—"}</td>
                        <td style={{ padding: "11px 14px", color: c.gray600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.particular}>
                          {row.particular}
                        </td>
                        <td style={{ padding: "11px 14px", color: c.gray700 }}>{formatPHP(row.obligated)}</td>
                        <td style={{ padding: "11px 14px", color: c.gray700 }}>{formatPHP(row.unobligated)}</td>
                        <td style={{ padding: "11px 14px" }}>
                          <button
                            onClick={() => handleUpdate(row)}
                            style={{
                              padding: "5px 7px", fontSize: 13,
                              border: `1px solid ${c.gray200}`,
                              borderRadius: c.radiusXs,
                              background: c.white, color: c.gray500,
                              cursor: "pointer",
                            }}
                          >
                            ✏
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Add obligation inline form ── */}
              <div style={{ padding: "14px 16px", borderTop: `1px solid ${c.gray200}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: c.gray700 }}>
                    {formData.noPR ? "Direct obligation (no PR)" : "Add obligation to existing PR"}
                  </div>
                  {/* No PR toggle */}
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: c.gray600, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!formData.noPR}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, noPR: e.target.checked }));
                        setObAmount("");
                        if (e.target.checked) setSelectedRow(null);
                      }}
                      style={{ accentColor: c.green, cursor: "pointer" }}
                    />
                    No PR / Direct obligation
                  </label>
                </div>
                <form
                  onSubmit={handleSubmit}
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}
                >
                  {/* OBR number */}
                  <Field label="OBR Number">
                    <input
                      style={inp} type="text"
                      placeholder="OBR-2026-06-001"
                      value={formData.obrno}
                      onChange={(e) => handleInputChange("obrno", e.target.value)}
                    />
                  </Field>

                  {/* PRNO — hidden if noPR */}
                  {!formData.noPR ? (
                    <Field label="PRNO">
                      <select
                        style={{ ...inp, cursor: "pointer" }}
                        value={selectedRow?.PRNO || ""}
                        onChange={(e) => {
                          const found = tableData.find((d) => d.prno === e.target.value);
                          if (found) {
                            setSelectedRow({ PRNO: found.prno, "AMOUNT PR": found.amount });
                            setObAmount(formatPHP(found.amount - (found.amount_obligated || 0)));
                          } else {
                            setSelectedRow(null);
                            setObAmount("");
                          }
                        }}
                      >
                        <option value="">— select PR —</option>
                        {tableData.map((d) => (
                          <option key={d.prno} value={d.prno}>
                            {d.prno} (bal: {formatPHP(d.amount - (d.amount_obligated || 0))})
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : (
                    <Field label="PRNO">
                      <input style={{ ...inp, background: c.gray100, color: c.gray400 }}
                        type="text" value="No PR" disabled />
                    </Field>
                  )}

                  <Field label="Particular">
                    <input style={inp} type="text" placeholder="Enter particulars"
                      value={formData.particular}
                      onChange={(e) => handleInputChange("particular", e.target.value)} />
                  </Field>

                  <Field label="Obligation amount">
                    <input
                      ref={obAmountInputRef}
                      style={{ ...inp, textAlign: "right" }}
                      type="text" placeholder="0.00"
                      value={obAmount}
                      onChange={(e) => {
                        if (obAmountInputRef.current) {
                          const cursor = obAmountInputRef.current.selectionStart;
                          const { formatted, cursorPosition } = formatAmountWithCursor(e.target.value, cursor);
                          setObAmount(formatted);
                          setTimeout(() => obAmountInputRef.current?.setSelectionRange(cursorPosition, cursorPosition), 0);
                        } else setObAmount(e.target.value);
                      }}
                    />
                  </Field>

                  <button type="submit" disabled={isSubmitting}
                    style={{
                      padding: "8px 18px", fontSize: 13, fontWeight: 500,
                      border: `1px solid ${c.gray300}`, borderRadius: c.radiusXs,
                      background: c.white, color: c.gray700,
                      cursor: isSubmitting ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                    }}>
                    {isSubmitting ? "Saving…" : isUpdate ? "Update" : "Obligate"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* PR/SO tab — obligation section below, same as Image 3 */}
          {tableType === "PR/SO" && (
            <div
              style={{
                border: `1px solid ${c.gray200}`,
                borderRadius: c.radiusSm,
                overflow: "hidden",
                background: c.white,
              }}
            >
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: c.gray700 }}>
                    {formData.noPR ? "Direct obligation (no PR)" : "Add obligation to existing PR"}
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: c.gray600, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!formData.noPR}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, noPR: e.target.checked }));
                        setObAmount("");
                        if (e.target.checked) setSelectedRow(null);
                      }}
                      style={{ accentColor: c.green, cursor: "pointer" }}
                    />
                    No PR / Direct obligation
                  </label>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setFormData((p) => ({ ...p, type: "Obligation" }));
                    handleSubmit(e);
                  }}
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}
                >
                  {/* OBR number */}
                  <Field label="OBR Number">
                    <input
                      style={inp} type="text"
                      placeholder="OBR-2026-06-001"
                      value={formData.obrno}
                      onChange={(e) => handleInputChange("obrno", e.target.value)}
                    />
                  </Field>

                  {/* PRNO — disabled if noPR */}
                  {!formData.noPR ? (
                    <Field label="PRNO">
                      <select
                        style={{ ...inp, cursor: "pointer" }}
                        value={selectedRow?.PRNO || ""}
                        onChange={(e) => {
                          const found = tableData.find((d) => d.prno === e.target.value);
                          if (found) {
                            setSelectedRow({ PRNO: found.prno, "AMOUNT PR": found.amount });
                            setObAmount(formatPHP(found.amount - (found.amount_obligated || 0)));
                          } else {
                            setSelectedRow(null);
                            setObAmount("");
                          }
                        }}
                      >
                        <option value="">— select PR —</option>
                        {tableData.map((d) => (
                          <option key={d.prno} value={d.prno}>
                            {d.prno} (bal: {formatPHP(d.amount - (d.amount_obligated || 0))})
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : (
                    <Field label="PRNO">
                      <input style={{ ...inp, background: c.gray100, color: c.gray400 }}
                        type="text" value="No PR" disabled />
                    </Field>
                  )}

                  <Field label="Particular">
                    <input style={inp} type="text" placeholder="Enter particulars"
                      value={formData.particular}
                      onChange={(e) => handleInputChange("particular", e.target.value)} />
                  </Field>

                  <Field label="Obligation amount">
                    <input
                      ref={obAmountInputRef}
                      style={{ ...inp, textAlign: "right" }}
                      type="text" placeholder="0.00"
                      value={obAmount}
                      onChange={(e) => {
                        if (obAmountInputRef.current) {
                          const cursor = obAmountInputRef.current.selectionStart;
                          const { formatted, cursorPosition } = formatAmountWithCursor(e.target.value, cursor);
                          setObAmount(formatted);
                          setTimeout(() => obAmountInputRef.current?.setSelectionRange(cursorPosition, cursorPosition), 0);
                        } else setObAmount(e.target.value);
                      }}
                    />
                  </Field>

                  <button type="submit" disabled={isSubmitting}
                    style={{
                      padding: "8px 18px", fontSize: 13, fontWeight: 500,
                      border: `1px solid ${c.gray300}`, borderRadius: c.radiusXs,
                      background: c.white, color: c.gray700,
                      cursor: isSubmitting ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                    }}>
                    {isSubmitting ? "Saving…" : "Obligate"}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>{/* end body */}
      </div>
    </div>
  );
};

export default PRObligationModal;
