import React, { useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import * as XLSX from "xlsx";
import { Upload, CheckCircle, AlertCircle, ArrowRight, Wallet, UserCheck, History, RefreshCcw, Send } from "lucide-react";
import ToastService from "../../../services/ToastService";
import { mooeAPI, psAPI } from "../../../services/api";
import PageHeader from "../../../components/common/PageHeader";
import GroupedTable from "../../../components/ui/GroupedTable";
import PSTable from "../../../components/ui/PSTable";
import SubmitPlanInfoModal from "../../../components/ui/SubmitPlanInfoModal";
import {
  cleanString,
  getHierarchyLevel,
  matchProgram,
  removeNumberingPrefix,
  safeString,
  isSubTotalName,
  programMap
} from "../../../utils/helper";
import { convertToThousandsNumber } from "../../../utils/formatters";

const ImportCenter = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [importType, setImportType] = useState("MOOE");
  const [file, setFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  const fileInputRef = useRef(null);

  const detectImportType = (rows) => {
    const headerContent = rows.slice(0, 15).map(row =>
      row.map(cell => String(cell || "").toLowerCase()).join(" ")
    ).join(" ");

    const isMOOE = headerContent.includes("physical targets") || headerContent.includes("financial targets");
    const isPS = headerContent.includes("particulars") && headerContent.includes("total") && !isMOOE;

    if (isMOOE) return "MOOE";
    if (isPS) return "PS";
    return null;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = (file) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const detectedType = detectImportType(jsonData);

        if (!detectedType) {
          ToastService.toastError("Unrecognized Excel format! Please use the standard template.");
          setFile(null);
          setIsProcessing(false);
          return;
        }

        if (detectedType !== importType) {
          ToastService.toastError(`Invalid File! You selected ${importType} but the uploaded file appears to be a ${detectedType} workplan.`);
          setFile(null);
          setIsProcessing(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        let formattedData = [];
        if (importType === "MOOE") {
          const startRow = 10;
          const endRow = 372;
          formattedData = jsonData
            .slice(startRow - 1, Math.min(endRow, jsonData.length))
            .map((row) => ({
              office: cleanString(row[0]),
              name: [row[1], row[2], row[3], row[4]].map(cleanString).join(" ").trim(),
              performance_indicator: cleanString(row[5]),
              pt1: parseInt(row[6]) || 0,
              pt2: parseInt(row[7]) || 0,
              pt3: parseInt(row[8]) || 0,
              pt4: parseInt(row[9]) || 0,
              totalPt: parseInt(row[10]) || 0,
              expense_items: cleanString(row[11]),
              expense_items_sub: cleanString(row[12]),
              fq1: parseFloat(row[13]) || 0,
              fq2: parseFloat(row[14]) || 0,
              fq3: parseFloat(row[15]) || 0,
              fq4: parseFloat(row[16]) || 0,
              totalFq: parseFloat(row[17]) || 0,
              total_amount: parseFloat(row[17]) || 0,
              sub_total_name: cleanString(row[1] || row[2] || row[15] || row[16]),
            }));
        } else {
          let startRowIndex = jsonData.findIndex(row =>
            String(row[0] || "").toLowerCase().includes("particulars")
          );
          if (startRowIndex === -1) startRowIndex = 4;
          else startRowIndex += 1;

          let currentPapType = "";
          let currentPapDes = "";
          let currentPapDesCode = "";
          let currentCostCategory = "PS";

          formattedData = jsonData.slice(startRowIndex).reduce((acc, row) => {
            const rawName = String(row[0] || "").trim();
            if (!rawName) return acc;

            const noisePatterns = [/total/i, /sub-total/i, /grand total/i, /ceiling/i, /difference/i, /^oo:/i, /^operations$/i];
            if (noisePatterns.some(p => p.test(rawName))) return acc;

            // Detect RLIP Section
            const isRlipHeader = rawName.toUpperCase().includes("RETIREMENT AND LIFE INSURANCE PREMIUMS") || rawName.toUpperCase().includes("(RLIP)");
            if (isRlipHeader) {
                currentCostCategory = "RLIP";
            }

            const totalVal = parseFloat(row[1]) || 0;
            const isNumberedAccount = /^\d+\./.test(rawName);
            const cleanName = rawName.replace(/^\d+\.\s*/, "").replace(/^\d{10,}\s*/, "").trim();

            if (isNumberedAccount || totalVal > 0) {
              // Rule: If in RLIP section, the item name IS the actual PAP Description
              const finalPapDes = currentCostCategory === "RLIP" ? cleanName : currentPapDes;

              acc.push({
                name: cleanName,
                expense_items: currentCostCategory === "RLIP" ? "RLIP" : cleanName,
                total_amount: totalVal,
                is_ps_expense: true,
                is_header: false,
                pap_type: currentPapType,
                pap_des: finalPapDes,
                pap_des_code: currentPapDesCode,
                cost_category: currentCostCategory,
                aggregation_level: "ITEM"
              });
            } else {
              if (isRlipHeader) return acc; // Skip storing the header row itself to avoid "fake" PAP descriptions

              const upperName = cleanName.toUpperCase();
              let aggregationLevel = "ITEM";

              if (upperName.includes("NATIONAL NUTRITION MANAGEMENT PROGRAM") || upperName.includes("GENERAL ADMINISTRATION AND SUPPORT")) {
                currentPapType = upperName;
                currentPapDes = "";
                currentPapDesCode = "";
                currentCostCategory = "PS"; // Reset cost category when major type changes
                aggregationLevel = "PAP_TYPE";
              } else {
                const codeMatch = rawName.match(/^(\d{10,})\s+(.*)$/);
                if (codeMatch) {
                  currentPapDesCode = codeMatch[1];
                  currentPapDes = codeMatch[2].replace(/^\d+\.\s*/, "").trim();
                } else {
                  currentPapDes = cleanName;
                  currentPapDesCode = "";
                }
                aggregationLevel = "PAP_DESCRIPTION";
              }
              const isMajor = upperName.includes("NATIONAL NUTRITION MANAGEMENT PROGRAM") || upperName.includes("GENERAL ADMINISTRATION AND SUPPORT");
              acc.push({
                name: cleanName,
                expense_items: cleanName,
                total_amount: 0,
                pap_type: currentPapType,
                pap_des: currentPapDes,
                pap_des_code: currentPapDesCode,
                cost_category: currentCostCategory,
                aggregation_level: aggregationLevel,
                is_header: true,
                isHeader: isMajor,
                isSubHeader: !isMajor,
              });
            }
            return acc;
          }, []);
        }

        setTableData(formattedData);
        ToastService.toastSuccess(`Validated ${importType} file. ${formattedData.length} records ready.`);
      } catch (err) {
        ToastService.toastError("Error processing file: " + err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRebuild = () => {
    if (importType === "PS") {
      setShowTable(true);
      return;
    }

    let refMain = "", refMiddle = "", refCenter = "", refLast = "";
    let lastPapType = "", lastPapDes = "", lastOffice = "", lastName = "", lastExpenseItem = "";

    const rebuiltData = tableData.reduce((acc, row) => {
      const rawName = row.name || "";
      const papTypeMatch = matchProgram(rawName, "key");
      const papDesMatch = matchProgram(rawName, "value");
      const isSubtotal = isSubTotalName(row.sub_total_name);
      const cleanedName = removeNumberingPrefix(rawName);
      const hierarchyLevel = getHierarchyLevel(rawName);

      if (papTypeMatch || lastPapType === "") {
        if (papTypeMatch && papTypeMatch !== lastPapType) {
          refMain = ""; refMiddle = ""; refCenter = ""; refLast = ""; lastName = ""; lastExpenseItem = "";
        }
        lastPapType = papTypeMatch || lastPapType;
      }
      if (papDesMatch) {
        lastPapDes = papDesMatch;
        lastExpenseItem = "";
      }

      if (safeString(cleanedName) === safeString(lastPapType) || safeString(cleanedName) === safeString(lastPapDes)) return acc;

      const office = row.office || lastOffice;
      if (row.office) lastOffice = row.office;

      const finalName = cleanedName || lastName;
      if (safeString(cleanedName)) {
        if (hierarchyLevel === 1) { refMain = cleanedName; refMiddle = ""; refCenter = ""; refLast = ""; lastExpenseItem = ""; }
        else if (hierarchyLevel === 2) { refMiddle = cleanedName; refCenter = ""; refLast = ""; lastExpenseItem = ""; }
        else if (hierarchyLevel === 3) { refCenter = cleanedName; refLast = ""; lastExpenseItem = ""; }
        else if (hierarchyLevel >= 4) { refLast = cleanedName; lastExpenseItem = ""; }

        if (cleanedName !== lastName) {
            lastExpenseItem = "";
        }
        lastName = cleanedName;
      }

      const expense_items = row.expense_items || lastExpenseItem;
      if (row.expense_items) lastExpenseItem = row.expense_items;

      acc.push({
        ...row,
        count_type: hierarchyLevel,
        office,
        pap_type: lastPapType,
        pap_des: lastPapDes,
        name: finalName,
        expense_items,
        ref_main_name: refMain,
        ref_middle_name: refMiddle,
        ref_center_name: refCenter,
        ref_last_name: refLast,
        is_subtotal: isSubtotal,
      });
      return acc;
    }, []);

    setTableData(rebuiltData);
    setShowTable(true);
  };

  const handleUploadFinal = async (planData) => {
    setIsUploading(true);
    try {
      const isPS = planData.allotmentType === "PS";
      const records = tableData
        .filter((row) => !row.is_header)
        .map((row, index) => {
          const rawValue = (val) => Number(String(val || 0).replace(/,/g, "")) || 0;
          return {
            ...row,
            fq1: isPS ? rawValue(row.fq1) : convertToThousandsNumber(row.fq1),
            fq2: isPS ? rawValue(row.fq2) : convertToThousandsNumber(row.fq2),
            fq3: isPS ? rawValue(row.fq3) : convertToThousandsNumber(row.fq3),
            fq4: isPS ? rawValue(row.fq4) : convertToThousandsNumber(row.fq4),
            totalFq: isPS ? rawValue(row.totalFq) : convertToThousandsNumber(row.totalFq),
            total_amount: isPS ? rawValue(row.total_amount) : convertToThousandsNumber(row.total_amount),
            amount: isPS ? rawValue(row.total_amount) : 0,
            total: isPS ? rawValue(row.total_amount) : 0,
            sort_order: index,
            plan_year: new Date(planData.planDate).getFullYear(),
            allotment_class: planData.allotmentType,
          };
        });

      if (isPS) {
        await psAPI.createPlanWithPS({
          title: planData.planName,
          planDate: planData.planDate,
          range_label: "Annual",
          psItems: records,
        });
      } else {
        await mooeAPI.createPlanWithMOOE({
          title: planData.planName,
          planDate: planData.planDate,
          range_label: "Annual",
          allotment_class: planData.allotmentType,
          mooeItems: records,
        });
      }

      setImportSummary({ count: records.length, type: planData.allotmentType, date: new Date().toLocaleString() });
      setStep(4);
      ToastService.toastSuccess("Import successful!");
    } catch (err) {
      console.error("IMPORT ERROR:", err);
      ToastService.toastError("Upload failed!");
    } finally {
      setIsUploading(false);
      setIsModalOpen(false);
    }
  };

  const steps = [{ id: 1, title: "SELECT TYPE" }, { id: 2, title: "UPLOAD & PROCESS" }, { id: 3, title: "REVIEW & CONFIRM" }];

  return (
    <div className="w-full animate-in fade-in duration-700">
      <PageHeader
        title="Workplan Import"
        subtitle="Official portal for uploading and registering budget allocation files."
        center={true}
      />

      <div className="flex items-center justify-center gap-4 mb-12">
        {steps.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${step === s.id ? 'bg-emerald-600 text-white shadow-lg ring-4 ring-emerald-50' : step > s.id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                {step > s.id ? <CheckCircle size={20} /> : s.id}
              </div>
              <span className={`text-[11px] font-black uppercase tracking-[0.1em] ${step >= s.id ? 'text-slate-900' : 'text-slate-300'}`}>{s.title}</span>
            </div>
            {idx < steps.length - 1 && <div className="w-20 h-px bg-slate-100 mx-2"></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden min-h-[450px] flex flex-col mx-auto w-full transition-all">
        {step === 1 && (
          <div className="p-12 flex-1 flex flex-col items-center justify-center text-center">
            <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Select Allotment Class</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
              <button onClick={() => { setImportType('PS'); setStep(2); }} className={`p-10 rounded-3xl border-2 transition-all duration-300 text-left group relative overflow-hidden ${importType === 'PS' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${importType === 'PS' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <UserCheck size={28} />
                </div>
                <h4 className="font-black text-slate-900 text-lg mb-2">Personal Services (PS)</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Salaries, allowances, and benefits.</p>
              </button>
              <button onClick={() => { setImportType('MOOE'); setStep(2); }} className={`p-10 rounded-3xl border-2 transition-all duration-300 text-left group relative overflow-hidden ${importType === 'MOOE' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${importType === 'MOOE' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <Wallet size={28} />
                </div>
                <h4 className="font-black text-slate-900 text-lg mb-2">MOOE</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Maintenance and Operating Expenses.</p>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-12 flex-1 flex flex-col items-center justify-center">
            <label className="flex flex-col items-center cursor-pointer group w-full">
              <input type="file" className="hidden" onChange={handleFileChange} accept=".xlsx,.xls,.csv" />
              <div className="w-20 h-20 bg-slate-50 rounded-[24px] flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors shadow-inner border border-slate-100">
                <Upload size={32} className="text-slate-300 group-hover:text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Upload {importType} Allotment File</h3>
              <p className="text-slate-400 text-sm font-medium mb-10">Click here to browse your standard .xlsx workplan.</p>
              <div className="w-full max-w-xl aspect-[2/1] border-4 border-dashed border-slate-100 rounded-[32px] bg-slate-50/50 flex flex-col items-center justify-center p-12 hover:border-emerald-200 hover:bg-white transition-all shadow-inner group">
                <p className="font-black text-slate-400 text-xs uppercase tracking-[0.2em] group-hover:text-emerald-600 text-center">{file ? file.name : "Select Microsoft Excel File"}</p>
              </div>
            </label>
            <div className="mt-10 flex gap-6">
              <button onClick={() => setStep(1)} className="text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">Cancel</button>
              <button disabled={!file || isProcessing} onClick={() => setStep(3)} className="px-10 py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all disabled:opacity-20">{isProcessing ? "Processing..." : "Process Workplan"}</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center px-8">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Review Data Registry</h3>
                <p className="text-[10px] font-black text-emerald-600 mt-1 uppercase tracking-widest">{importType} • {tableData.length} records detected</p>
              </div>
              <div className="flex gap-4">
                <button
                  disabled={tableData.length === 0 || isProcessing}
                  onClick={handleRebuild}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <RefreshCcw size={14} className={isProcessing ? "animate-spin" : ""} />
                  Rebuild Structure
                </button>
                <button
                  disabled={!showTable || tableData.length === 0 || isUploading}
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/10 hover:bg-emerald-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                  Confirm & Upload
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50/30 p-4">
              {showTable ? (
                importType === "PS" ? <PSTable data={tableData} /> : <GroupedTable data={tableData} tableLabel={`MOOE Preview`} interactive={false} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-white rounded-[24px] border border-slate-100 border-dashed">
                  <RefreshCcw size={48} className="text-slate-200 mb-4 animate-spin-slow" />
                  <h4 className="text-lg font-black text-slate-900">Structure Ready</h4>
                  <p className="text-slate-500 text-sm max-w-md mt-2">Click the <b>Rebuild Structure</b> button to organize the raw Excel data into the official registry format.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="p-12 flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[40px] flex items-center justify-center mb-8 shadow-inner"><CheckCircle size={56} /></div>
            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Import Successful!</h3>
            <p className="text-slate-500 font-medium max-w-sm mb-10">Your {importSummary?.type} allotment records have been successfully added.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setStep(1);
                  setFile(null);
                  setShowTable(false);
                  setTableData([]);
                }}
                className="px-10 py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95"
              >
                Import Another
              </button>
              <button
                onClick={() => navigate('/registry')}
                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-2"
              >
                View Registry <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <SubmitPlanInfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleUploadFinal} submitDisabled={!showTable} title="Confirm Allotment Registration" initialAllotmentType={importType} />

      <div className="flex justify-center mt-12 pb-20">
         <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-emerald-600 transition-all group">
            <History size={16} /> View Full Import History
         </button>
      </div>
    </div>
  );
};

export default ImportCenter;
