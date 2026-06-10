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
import SubmitPlanInfoModal from "./ui/SubmitPlanInfoModal";
import { activitiesAPI } from "../utils/api";
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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setError("");
    setSuccess("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const startRow = 10;
        const endRow = 372;

        const formattedData = jsonData
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

        setTableData(formattedData);
        const isValid = validateData(formattedData);
        setHasValidData(isValid);
        if (isValid)
          setSuccess(
            `Successfully loaded ${formattedData.length} rows from ${file.name}`,
          );
        else setError("No valid data found in the uploaded file");
      } catch (err) {
        setError("Error reading file: " + err.message);
        setHasValidData(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRebuild = () => {
    if (!hasValidData) {
      setError("Please upload a valid Excel file first");
      return;
    }

    let refMain = "",
      refMiddle = "",
      refCenter = "",
      refLast = "";
    let lastPapType = "",
      lastPapDes = "",
      lastDivision = "",
      lastName = "";
    let lastExpenseByName = {};

    const rebuiltData = tableData.reduce((acc, row) => {
      const rawName = row.name || "";
      const papTypeMatch = matchProgram(rawName, "key");
      const papDesMatch = matchProgram(rawName, "value");
      const isSubtotal = isSubTotalName(row.sub_total_name);
      const cleanedName = removeNumberingPrefix(rawName);
      const hierarchyLevel = getHierarchyLevel(rawName);

      const nextPapType = papTypeMatch || lastPapType;
      const nextPapDes = papDesMatch || lastPapDes;
      const papTypeChanged =
        safeString(nextPapType) !== safeString(lastPapType);

      if (papTypeChanged) {
        refMain = "";
        refMiddle = "";
        refCenter = "";
        refLast = "";
        lastName = "";
        lastExpenseByName = {};
      }

      if (papTypeMatch) lastPapType = papTypeMatch;
      if (papDesMatch) lastPapDes = papDesMatch;

      const papType = nextPapType;
      const papDes = nextPapDes;

      if (
        safeString(cleanedName) === safeString(papType) ||
        safeString(cleanedName) === safeString(papDes)
      )
        return acc;

      const division = row.division || lastDivision;
      if (row.division) lastDivision = row.division;

      if (hierarchyLevel === 1) {
        refMain = cleanedName;
        refMiddle = "";
        refCenter = "";
        refLast = "";
      } else if (hierarchyLevel === 2) {
        refMiddle = cleanedName;
        refCenter = "";
        refLast = "";
      } else if (hierarchyLevel === 3) {
        refCenter = cleanedName;
        refLast = "";
      } else if (hierarchyLevel >= 4) {
        refLast = cleanedName;
      }

      const finalName = cleanedName || lastName;
      if (safeString(cleanedName)) lastName = cleanedName;

      const nameKey = safeString(finalName).toLowerCase().trim();
      if (safeString(row.expense_items))
        lastExpenseByName[nameKey] = row.expense_items;
      const expenseItems = safeString(row.expense_items)
        ? row.expense_items
        : lastExpenseByName[nameKey] || "";

      const record = {
        ...row,
        count_type: hierarchyLevel,
        division,
        pap_type: papType,
        pap_des: papDes,
        name: finalName,
        ref_main_name: refMain,
        ref_middle_name: refMiddle,
        ref_center_name: refCenter,
        ref_last_name: refLast,
        expense_items: expenseItems,
        expense_items_sub: row.expense_items_sub || "",
        has_expense_items: true,
        is_subtotal: isSubtotal,
      };

      acc.push(record);
      return acc;
    }, []);

    setTableData(rebuiltData);
    setShowTable(true);
  };

  const handleUpload = async (planData) => {
    if (!hasPermission("User")) {
      setError("You do not have permission to upload data.");
      return;
    }
    if (tableData.length === 0) {
      setError("No data to upload.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Create activities array
      const activities = tableData.map((row, index) => {
        const activity = {
          ...row,

          fq1: convertToThousandsNumber(row.fq1),
          fq2: convertToThousandsNumber(row.fq2),
          fq3: convertToThousandsNumber(row.fq3),
          fq4: convertToThousandsNumber(row.fq4),
          totalFq: convertToThousandsNumber(row.totalFq),
          total_amount: convertToThousandsNumber(row.total_amount),
          sort_order: index,
          plan_year: new Date(planData.planDate).getFullYear(),
        };
        return activity;
      });

      // Validate activities before sending
      if (!activities || activities.length === 0) {
        throw new Error("No activities to upload");
      }

      // Check if all activities have required fields
      const invalidActivities = activities.filter(
        (activity) => !activity.name || activity.name.trim() === "",
      );

      if (invalidActivities.length > 0) {
        throw new Error(
          `Found ${invalidActivities.length} activities missing required field (name)`,
        );
      }

      // Create plan and activities in one API call
      const response = await activitiesAPI.createPlanWithActivities({
        title: planData.planName,
        range_label: "Annual",
        activities: activities,
      });

      const createdPlan = response.data;
      setSuccess(
        `Successfully uploaded plan ${createdPlan.plan_id} with ${activities.length} activities!`,
      );
      setIsModalOpen(false);
      setTableData([]);
      setShowTable(false);
      setHasValidData(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
      // hide success message after clearing table
      setSuccess("");
    } catch (err) {
      setError("Upload failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Import WFP</h2>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-4">
          <div className="w-full lg:flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Excel File (.xlsx or .csv)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
          </div>

          <div className="flex gap-2 items-end w-full lg:w-auto">
            <Button
              onClick={handleRebuild}
              disabled={!hasValidData}
              variant="secondary"
              icon="🔄"
            >
              Rebuild
            </Button>
            {/* <Button
              onClick={handleUpload}
              disabled={tableData.length > 0 && (!showTable || isLoading)}
              loading={isLoading}
              icon="📤"
            >
              Upload
            </Button> */}

            <Button
              onClick={() => setIsModalOpen(true)}
              loading={isLoading}
              disabled={isUploadDisabled}
              icon="📤"
            >
              Upload
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}
      </div>

      {showTable && (
        <GroupedTable
          data={tableData}
          tableLabel="Excel Preview"
          interactive={false}
        />
      )}
      <SubmitPlanInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleUpload}
        submitDisabled={isUploadDisabled}
        title="Confirm Upload"
      >
        Are you sure you want to upload the data?
      </SubmitPlanInfoModal>
    </div>
  );
};

export default ImportWFP;
