import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import {
  cleanString,
  getHierarchyLevel,
  matchProgram,
  removeNumberingPrefix,
  safeString,
  isSubTotalName,
} from "../utils/helper";
import GroupedTable from "./ui/GroupedTable";
import PSTable from "./ui/PSTable";
import SubmitPlanInfoModal from "./ui/SubmitPlanInfoModal";
import { activitiesAPI } from "../utils/api";
import { toast } from "react-toastify";
import {
  convertToThousands,
  convertToThousandsNumber,
} from "../utils/formatters";

const ImportWFP = () => {
  const [tableData, setTableData] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [hasValidData, setHasValidData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importType, setImportType] = useState("MOOE");

  const fileInputRef = useRef(null);
  const { hasPermission } = useAuth();

  // Determine if Upload should be disabled
  const isUploadDisabled = !showTable;

  const validateData = (data) =>
    data.filter((row) =>
      Object.values(row).some(
        (v) => v !== null && v !== undefined && v.toString().trim() !== "",
      ),
    ).length > 0;

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

  const clearState = () => {
    setTableData([]);
    setShowTable(false);
    setHasValidData(false);
    setError("");
    setSuccess("");
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // ALWAYS CLEAR PREVIOUS STATE ON NEW FILE SELECTION
    clearState();

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Auto-detect type
        const detectedType = detectImportType(jsonData);

        if (!detectedType) {
          toast.error("Unrecognized Excel format!");
          setError("Invalid file format detected.");
          if (fileInputRef.current) fileInputRef.current.value = null;
          return;
        }

        // SYNC Import Type state with detected type
        setImportType(detectedType);

        if (detectedType !== importType) {
          toast.info(`Detected ${detectedType} format.`);
        }

        let formattedData = [];

        if (detectedType === "MOOE") {
          const startRow = 10;
          const endRow = 372;
          formattedData = jsonData
            .slice(startRow - 1, Math.min(endRow, jsonData.length))
            .map((row) => {
              const nameBase = [row[1], row[2], row[3], row[4]]
                .map(cleanString)
                .join(" ")
                .trim();

              return {
                division: cleanString(row[0]),
                name: nameBase,
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
                sub_total_name: cleanString(
                  row[1] || row[2] || row[15] || row[16],
                ),
              };
            });
        } else {
          let startRowIndex = jsonData.findIndex(row =>
            String(row[0] || "").toLowerCase().includes("particulars")
          );

          if (startRowIndex === -1) startRowIndex = 4;
          else startRowIndex += 1;

          let currentPapType = "";
          let currentPapDes = "";
          let currentPapDesCode = "";

          formattedData = jsonData
            .slice(startRowIndex)
            .reduce((acc, row) => {
              const rawName = String(row[0] || "").trim();
              if (!rawName) return acc;

              // 1. Senior AI filter for noise and unwanted program headers
              const noisePatterns = [
                /^total/i, /sub-total/i, /grand total/i, /^ceiling/i, /^difference/i,
                /^oo:/i, // Exclude program objectives
                /^operations$/i, // Exclude "OPERATIONS" as requested
                /nutrition sensitive programs/i,
                /^\d+\s*$/ // Exclude pure numeric codes
              ];
              if (noisePatterns.some(p => p.test(rawName))) return acc;

              const totalVal = parseFloat(row[1]) || 0;
              const isNumberedAccount = /^\d+\./.test(rawName);

              // 2. Smart Cleaning: Remove numbering/codes
              const cleanName = rawName
                .replace(/^\d+\.\s*/, "") // Remove "1. " pattern
                .replace(/^\d{10,}\s*/, "") // Remove long account codes
                .trim();

              if (isNumberedAccount || totalVal > 0) {
                // It's an Actual Expense Row
                acc.push({
                  division: "",
                  name: cleanName,
                  performance_indicator: "",
                  pt1: 0, pt2: 0, pt3: 0, pt4: 0, totalPt: 0,
                  expense_items: cleanName,
                  expense_items_sub: "",
                  fq1: 0, fq2: 0, fq3: 0,
                  fq4: totalVal,
                  totalFq: totalVal,
                  total_amount: totalVal,
                  is_ps_expense: true,
                  is_header: false,
                  pap_type: currentPapType,
                  pap_des: currentPapDes,
                  pap_des_code: currentPapDesCode,
                });
              } else {
                // It's a Context Header row
                const upperName = cleanName.toUpperCase();

                // Specific Logic for Promoting National Nutrition Management Program
                if (upperName.includes("NATIONAL NUTRITION MANAGEMENT PROGRAM") || upperName.includes("GENERAL ADMINISTRATION AND SUPPORT")) {
                  currentPapType = upperName;
                  currentPapDes = "";
                  currentPapDesCode = "";
                } else {
                  // Sub Header Logic
                  const codeMatch = rawName.match(/^(\d{10,})\s+(.*)$/);
                  if (codeMatch) {
                    currentPapDesCode = codeMatch[1];
                    currentPapDes = codeMatch[2].replace(/^\d+\.\s*/, "").trim();
                  } else {
                    currentPapDes = cleanName;
                    currentPapDesCode = "";
                  }
                }

                // Show in preview for context, but mark as header so it's NOT saved to DB
                const isMajor = upperName.includes("NATIONAL NUTRITION MANAGEMENT PROGRAM") || upperName.includes("GENERAL ADMINISTRATION AND SUPPORT");

                acc.push({
                  name: cleanName,
                  expense_items: cleanName,
                  total_amount: 0,
                  pap_type: currentPapType,
                  pap_des: currentPapDes,
                  pap_des_code: currentPapDesCode,
                  is_header: true,
                  isHeader: isMajor, // Level 1
                  isSubHeader: !isMajor, // Level 2
                });
              }
              return acc;
            }, []);
        }

        setTableData(formattedData);
        const isValid = validateData(formattedData);
        setHasValidData(isValid);
        if (isValid) {
          setSuccess(`Successfully loaded ${formattedData.length} rows.`);
        }
      } catch (err) {
        toast.error("Error reading file: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRebuild = () => {
    if (!hasValidData) return toast.error("No valid data loaded");

    if (importType === "PS") {
      setShowTable(true);
      return;
    }

    let refMain = "", refMiddle = "", refCenter = "", refLast = "";
    let lastPapType = "", lastPapDes = "", lastDivision = "", lastName = "";
    let lastExpenseByName = {};

    const rebuiltData = tableData.reduce((acc, row) => {
      const rawName = row.name || "";
      const papTypeMatch = matchProgram(rawName, "key");
      const papDesMatch = matchProgram(rawName, "value");
      const isSubtotal = isSubTotalName(row.sub_total_name);
      const cleanedName = removeNumberingPrefix(rawName);
      const hierarchyLevel = getHierarchyLevel(rawName);

      if (papTypeMatch || lastPapType === "") {
        if (papTypeMatch && papTypeMatch !== lastPapType) {
          refMain = ""; refMiddle = ""; refCenter = ""; refLast = ""; lastName = ""; lastExpenseByName = {};
        }
        lastPapType = papTypeMatch || lastPapType;
      }
      if (papDesMatch) lastPapDes = papDesMatch;

      if (safeString(cleanedName) === safeString(lastPapType) || safeString(cleanedName) === safeString(lastPapDes)) return acc;

      const division = row.division || lastDivision;
      if (row.division) lastDivision = row.division;

      if (hierarchyLevel === 1) { refMain = cleanedName; refMiddle = ""; refCenter = ""; refLast = ""; }
      else if (hierarchyLevel === 2) { refMiddle = cleanedName; refCenter = ""; refLast = ""; }
      else if (hierarchyLevel === 3) { refCenter = cleanedName; refLast = ""; }
      else if (hierarchyLevel >= 4) { refLast = cleanedName; }

      const finalName = cleanedName || lastName;
      if (safeString(cleanedName)) lastName = cleanedName;

      const record = {
        ...row,
        count_type: hierarchyLevel,
        division,
        pap_type: lastPapType,
        pap_des: lastPapDes,
        name: finalName,
        ref_main_name: refMain,
        ref_middle_name: refMiddle,
        ref_center_name: refCenter,
        ref_last_name: refLast,
        is_subtotal: isSubtotal,
      };

      acc.push(record);
      return acc;
    }, []);

    setTableData(rebuiltData);
    setShowTable(true);
  };

  const handleUpload = async (planData) => {
    if (!hasPermission("User")) return toast.error("No permission!");
    setIsLoading(true);
    try {
      const isPS = planData.allotmentType === "PS";

      const activities = tableData
        .filter((row) => !row.is_header)
        .map((row, index) => {
          const rawValue = (val) =>
            Number(String(val || 0).replace(/,/g, "")) || 0;

          return {
            ...row,
            fq1: isPS ? rawValue(row.fq1) : convertToThousandsNumber(row.fq1),
            fq2: isPS ? rawValue(row.fq2) : convertToThousandsNumber(row.fq2),
            fq3: isPS ? rawValue(row.fq3) : convertToThousandsNumber(row.fq3),
            fq4: isPS ? rawValue(row.fq4) : convertToThousandsNumber(row.fq4),
            totalFq: isPS
              ? rawValue(row.totalFq)
              : convertToThousandsNumber(row.totalFq),
            total_amount: isPS
              ? rawValue(row.total_amount)
              : convertToThousandsNumber(row.total_amount),
            amount: isPS ? rawValue(row.total_amount) : 0,
            sort_order: index,
            plan_year: new Date(planData.planDate).getFullYear(),
            allotment_class: planData.allotmentType,
          };
        });

      await activitiesAPI.createPlanWithActivities({
        title: planData.planName,
        planDate: planData.planDate,
        range_label: "Annual",
        allotment_class: planData.allotmentType,
        activities,
      });

      toast.success("Import successful!");
      setIsModalOpen(false); // Close the modal
      clearState();
      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (err) {
      toast.error("Upload failed!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Import Plan</h2>
        </div>

        <div className="flex flex-wrap items-end gap-10 mb-4">
          <div className="shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Allotment Type</label>
            <div className="flex gap-4 py-2">
               {["MOOE", "PS"].map(type => (
                 <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      value={type}
                      checked={importType === type}
                      onChange={(e) => {
                        setImportType(e.target.value);
                      }}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700 font-medium">{type}</span>
                 </label>
               ))}
            </div>
          </div>

          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Excel File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
          </div>

          <div className="flex gap-2 shrink-0">
            <Button onClick={handleRebuild} disabled={!hasValidData} variant="secondary" icon="🔄">Rebuild</Button>
            <Button onClick={() => setIsModalOpen(true)} loading={isLoading} disabled={isUploadDisabled} icon="📤">Upload</Button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">{success}</div>}
      </div>

      {showTable && (
        importType === "PS" ? (
          <PSTable data={tableData} />
        ) : (
          <GroupedTable data={tableData} tableLabel={`Excel Preview (MOOE)`} interactive={false} />
        )
      )}

      <SubmitPlanInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleUpload}
        submitDisabled={isUploadDisabled}
        title="Confirm Upload"
        initialAllotmentType={importType}
      />
    </div>
  );
};

export default ImportWFP;
