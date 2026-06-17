import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Download, Wallet, UserCheck } from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import DataTable from "../../components/common/DataTable";
import { activitiesAPI } from "../../services/api";
import {
  cleanString,
  getHierarchyLevel,
  matchProgram,
  removeNumberingPrefix,
  safeString,
  isSubTotalName,
  programMap
} from "../../utils/helper";
import { convertToThousandsNumber } from "../../utils/formatters";

const ImportBudget = () => {
  const [step, setStep] = useState(1);
  const [importType, setImportType] = useState(null);
  const [file, setFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  const handleTypeSelect = (type) => {
    setImportType(type);
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

        let formattedData = [];

        if (importType === "MOOE") {
          // MOOE Logic: Focus on Activity-based structure (WFP)
          let startRow = 0;
          for (let i = 0; i < Math.min(jsonData.length, 25); i++) {
            const rowStr = (jsonData[i] || []).join(" ").toLowerCase();
            if (rowStr.includes("division") || rowStr.includes("office") || rowStr.includes("activity")) {
              startRow = i + 1;
              break;
            }
          }
          if (startRow === 0) startRow = 10;

          formattedData = jsonData
            .slice(startRow)
            .map((row) => {
              const name = [row[1], row[2], row[3], row[4]].map(cleanString).filter(Boolean).join(" ").trim();
              const total_amount = parseFloat(row[17]) || 0;

              if (!name || total_amount === 0 || isSubTotalName(name)) return null;

              return {
                division: cleanString(row[0]),
                name: name,
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
                total_amount: total_amount,
                allotment_class: "MOOE"
              };
            })
            .filter(Boolean);
        } else {
          // PS Logic: Focus on PAP structure
          let currentPapType = "GENERAL ADMINISTRATION AND SUPPORT";
          let currentPapDes = "General Management and Supervision";
          let currentPapDesCode = "";

          let startIndex = jsonData.findIndex(row =>
            String(row[0] || "").toLowerCase().includes("particulars")
          );
          if (startIndex === -1) startIndex = 4;

          jsonData.slice(startIndex + 1).forEach((row) => {
            const firstCol = cleanString(row[0]);
            if (!firstCol) return;

            // Detect PAP Type
            if (firstCol.toUpperCase().includes("GENERAL ADMINISTRATION") || firstCol.toUpperCase().includes("SUPPORT")) {
              currentPapType = "GENERAL ADMINISTRATION AND SUPPORT";
              return;
            }
            if (firstCol.toUpperCase().includes("NUTRITION MANAGEMENT") || firstCol.toUpperCase().includes("OPERATIONS")) {
              currentPapType = "NATIONAL NUTRITION MANAGEMENT PROGRAM";
              return;
            }

            // Detect Sub-PAP / Description
            const isKnownSubProgram = Object.values(programMap || {}).flat().some(p => firstCol.toLowerCase().includes(p.toLowerCase()));
            const codeMatch = firstCol.match(/^(\d{10,})\s*(.*)$/);

            if (isKnownSubProgram || codeMatch) {
              if (codeMatch) {
                currentPapDesCode = codeMatch[1];
                currentPapDes = codeMatch[2] || firstCol;
              } else {
                currentPapDes = firstCol;
                currentPapDesCode = "";
              }
              return;
            }

            const amount = parseFloat(row[1]);
            if (!isNaN(amount) && amount > 0 && !isSubTotalName(firstCol)) {
              formattedData.push({
                pap_type: currentPapType,
                pap_des: currentPapDes,
                pap_des_code: currentPapDesCode,
                expense_items: firstCol,
                total_amount: amount,
                allotment_class: "PS",
                is_ps_expense: true,
                name: firstCol // For common preview
              });
            }
          });
        }

        if (formattedData.length === 0) {
          toast.warning("No valid records found. Check if the file matches the selected allotment class.");
        } else {
          setTableData(formattedData);
          toast.success(`Successfully parsed ${formattedData.length} records`);
        }
      } catch (err) {
        console.error(err);
        toast.error("Error processing file: " + err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      const payload = {
        title: `${importType} Budget Import - ${new Date().toLocaleDateString()}`,
        allotment_class: importType,
        activities: tableData,
        is_import: true,
        planDate: new Date().toISOString()
      };

      await activitiesAPI.createPlanWithActivities(payload);

      setImportSummary({
        count: tableData.length,
        type: importType,
        date: new Date().toLocaleString()
      });
      setStep(4);
      toast.success("Budget data imported and registered successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const steps = [
    { id: 1, title: "SELECT ALLOTMENT CLASS" },
    { id: 2, title: "UPLOAD & PROCESS" },
    { id: 3, title: "REVIEW & CONFIRM" },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Import Center</h1>
        <p className="text-slate-500 font-medium">Populate your budget registry using Excel workplans.</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-12 max-w-3xl mx-auto">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
          {steps.map((s) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${
                  step === s.id ? 'bg-emerald-500 text-white shadow-lg ring-4 ring-emerald-50' :
                  step > s.id ? 'bg-emerald-100 text-emerald-600' : 'bg-white border-2 border-slate-100 text-slate-300'
                }`}
              >
                {step > s.id ? <CheckCircle size={20} /> : s.id}
              </div>
              <span className={`mt-3 text-[10px] font-black uppercase tracking-[0.2em] ${step >= s.id ? 'text-slate-900' : 'text-slate-300'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[450px] flex flex-col transition-all duration-500">
        {step === 1 && (
          <div className="p-12 flex-1 flex flex-col items-center justify-center text-center">
            <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Select Allotment Class</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
              <button
                onClick={() => handleTypeSelect('PS')}
                className={`p-10 rounded-3xl border-2 transition-all duration-300 text-left group relative overflow-hidden ${
                  importType === 'PS' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${importType === 'PS' ? 'bg-emerald-500 text-white rotate-6' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                  <UserCheck size={28} />
                </div>
                <h4 className="font-black text-slate-900 text-lg mb-2">Personal Services (PS)</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Salaries, allowances, and benefits for government personnel.</p>
                {importType === 'PS' && <div className="absolute top-4 right-4 text-emerald-500"><CheckCircle size={24} /></div>}
              </button>

              <button
                onClick={() => handleTypeSelect('MOOE')}
                className={`p-10 rounded-3xl border-2 transition-all duration-300 text-left group relative overflow-hidden ${
                  importType === 'MOOE' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${importType === 'MOOE' ? 'bg-emerald-500 text-white rotate-6' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                  <Wallet size={28} />
                </div>
                <h4 className="font-black text-slate-900 text-lg mb-2">MOOE</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Maintenance and Other Operating Expenses for office and projects.</p>
                {importType === 'MOOE' && <div className="absolute top-4 right-4 text-emerald-500"><CheckCircle size={24} /></div>}
              </button>
            </div>

            <div className="mt-12">
              <button
                disabled={!importType}
                onClick={() => setStep(2)}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-emerald-600 transition-all active:scale-95"
              >
                Continue to Upload <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-12 flex-1 flex flex-col items-center">
            <label className="flex flex-col items-center cursor-pointer group w-full">
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
              />

              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
                <Upload size={32} className="text-slate-400 group-hover:text-emerald-600" />
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2">Upload {importType} Allotment File</h3>
              <p className="text-slate-400 text-sm font-medium mb-10">Drop your standard .xlsx workplan here or click to browse.</p>

              <div
                className="w-full max-w-xl aspect-[2/1] border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center p-12 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all mb-10"
              >
                <p className="font-black text-slate-300 text-xs uppercase tracking-[0.2em] group-hover:text-emerald-600 transition-colors text-center">
                  {file ? file.name : "Select Microsoft Excel File"}
                </p>
                <p className="text-[10px] text-slate-300 font-black mt-2 italic uppercase">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports .xlsx, .xls and .csv"}
                </p>
              </div>
            </label>

            <div className="flex items-center gap-6">
               <button onClick={() => setStep(1)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">Cancel</button>
               <button
                  disabled={!file || isProcessing}
                  onClick={() => setStep(3)}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all disabled:opacity-20"
                >
                  {isProcessing ? "Processing..." : "Process Workplan"}
                </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-tight">Review & Confirm</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{importType} ALLOTMENT</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tableData.length} records detected</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
                >
                  Change File
                </button>
                <button
                  disabled={isUploading}
                  onClick={handleUpload}
                  className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isUploading ? "Importing..." : "Confirm & Import"}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto max-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400 border-b border-slate-50">
                    {importType === "MOOE" ? (
                      <>
                        <th className="px-8 py-5">Office</th>
                        <th className="px-8 py-5">Activity / Expense Item</th>
                        <th className="px-8 py-5 text-right">Total Amount</th>
                      </>
                    ) : (
                      <>
                        <th className="px-8 py-5">PAP Type</th>
                        <th className="px-8 py-5">Particulars</th>
                        <th className="px-8 py-5 text-right">Total Amount</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tableData.slice(0, 50).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-4">
                        <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-900 transition-colors">
                          {importType === "MOOE" ? row.division : row.pap_type}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{row.name || row.expense_items}</span>
                          {importType === "PS" && <span className="text-[9px] text-slate-400 font-medium">{row.pap_des}</span>}
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <span className="text-xs font-mono font-black text-slate-900">
                          {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(row.total_amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tableData.length > 50 && (
                <div className="p-6 text-center bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-50">
                  Showing first 50 rows of {tableData.length} total records.
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="p-12 flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[40px] flex items-center justify-center mb-8 shadow-inner">
              <CheckCircle size={56} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Import Successful!</h3>
            <p className="text-slate-500 font-medium max-w-sm mb-10">
              Your {importSummary?.type} allotment records have been successfully added to the registry.
            </p>

            <div className="bg-slate-50 rounded-[32px] p-8 w-full max-w-md border border-slate-100 mb-10 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                {importSummary?.type === 'PS' ? <UserCheck size={80} /> : <Wallet size={80} />}
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</span>
                  <span className="text-xs font-black text-slate-900 italic">{importSummary?.type} Allotment</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Records</span>
                  <span className="text-xs font-black text-slate-900">{importSummary?.count} entries</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                  <span className="text-xs font-black text-slate-900">{importSummary?.date}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep(1);
                  setFile(null);
                  setImportType(null);
                  setTableData([]);
                }}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all"
              >
                Import Another
              </button>
              <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all">
                Go to Registry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Safety Warning */}
      {step < 4 && (
        <div className="mt-8 flex items-center gap-4 p-5 bg-amber-50 border border-amber-100 rounded-2xl max-w-3xl mx-auto">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle className="text-amber-600" size={20} />
          </div>
          <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
            Ensure your Excel file follows the standard NNC Workplan format. The system automatically detects PAP types and activity rows based on column structure.
          </p>
        </div>
      )}
    </div>
  );
};

export default ImportBudget;
