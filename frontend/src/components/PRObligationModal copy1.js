import React, { useState, useRef, useEffect } from "react";
import {
  formatPHP,
  formatAmountWithCursor,
  parsePHP,
  formatDate,
  toInputDate,
} from "../utils/formatters";
import { prSoAPI, obligationAPI } from "../utils/api";
import Table from "./ui/Table";
import { toast } from "react-toastify";

const PRObligationModal = ({ isOpen, onClose, onSubmit, selectedActivity }) => {
  const [formData, setFormData] = useState({
    type: "PR",
    prno: "",
    obrno: "",
    transaction_date: new Date().toISOString().split("T")[0],
    amount: "",
    particular: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [tableType, setTableType] = useState("PR/SO");
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [totalAllocation, setTotalAllocation] = useState(
    selectedActivity?.totalFq || 0,
  );
  const [mode, setMode] = useState("create");
  const amountInputRef = useRef(null);

  const tableColumns = {
    "PR/SO": [
      "PRNO",
      "DATE",
      "AMOUNT PR",
      "OBLIGATED",
      "UNOBLIGATED",
      "BALANCE PR",
    ],
    OBLIGATION: ["OBRNO", "PARTICULAR", "DATE", "OBLIGATED", "UNOBLIGATED"],
  };

  const fetchNextNumber = async (dateStr) => {
    try {
      const date = dateStr ? new Date(dateStr) : new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      if (formData.type === "PR") {
        const res = await prSoAPI.getNextNo(year, month);
        setFormData((prev) => ({ ...prev, prno: res.data.nextPrNo || "" }));
      } else {
        const res = await obligationAPI.getNextNo(year, month);
        setFormData((prev) => ({ ...prev, obrno: res.data.nextObrNo || "" }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch next number");
    }
  };

  useEffect(() => {
    if (isOpen) fetchNextNumber(formData.transaction_date);
  }, [isOpen, formData.transaction_date, formData.type]);

  useEffect(() => {
    if (selectedActivity) {
      setFormData((prev) => ({
        ...prev,
        activities: selectedActivity.Activities || "",
        expense_items: selectedActivity["EXPENSE ITEMS"] || "",
        expense_items_sub: selectedActivity["EXPENSE SUB-ITEM"] || "",
        pap_type: selectedActivity.pap_type || "",
        pap_des: selectedActivity.pap_des || "",
      }));
      setTotalAllocation(selectedActivity.totalFq || 0);
    }
  }, [selectedActivity]);

  useEffect(() => {
    if (selectedActivity && isOpen) fetchTableData();
  }, [selectedActivity, tableType, mode, isOpen]);

  const fetchTableData = async () => {
    if (!selectedActivity) return;
    setIsLoadingTable(true);
    try {
      let response =
        tableType === "PR/SO"
          ? await prSoAPI.getActivity()
          : await obligationAPI.getActivity();
      let data = (response.data.data || []).filter(
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
    setFormData((prev) => ({ ...prev, type }));
    setTableType(type === "PR" ? "PR/SO" : "OBLIGATION");
    setMode("create");
    setSelectedRow(null);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (value) =>
    handleInputChange("transaction_date", value);

  const handleAmountChange = (field, value) => {
    if (amountInputRef.current) {
      const cursor = amountInputRef.current.selectionStart;
      const { formatted, cursorPosition } = formatAmountWithCursor(
        value,
        cursor,
      );
      setFormData((prev) => ({ ...prev, [field]: formatted }));
      setTimeout(() => {
        amountInputRef.current?.setSelectionRange(
          cursorPosition,
          cursorPosition,
        );
      }, 0);
    } else setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const amount = parsePHP(formData.amount);

    // 1️⃣ PR validation
    if (formData.type === "PR" && !formData.prno.trim()) {
      toast.error("PR Number is required");
      return false;
    }

    // 2️⃣ Obligation validations
    if (formData.type === "Obligation") {
      if (!formData.obrno.trim()) {
        toast.error("OBR Number is required");
        return false;
      }

      if (!formData.particular.trim()) {
        toast.error("Particular is required");
        return false;
      }
    }

    // 3️⃣ Transaction date
    if (!formData.transaction_date) {
      toast.error("Transaction Date is required");
      return false;
    }

    // 4️⃣ Amount basic validation
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return false;
    }

    // 5️⃣ Check if PR Amount is greater than Obligation Amount
    if (
      formData.type === "Obligation" &&
      selectedRow?.PRNO &&
      amount > Number(selectedRow["AMOUNT PR"])
    ) {
      toast.error(
        `Invalid Obligation Amount: Amount must be greater than the PR amount (₱${Number(
          selectedRow["AMOUNT PR"],
        ).toLocaleString()}).`,
      );
      return false;
    }

    // 6️⃣ Allocation check
    if (amount > totalAllocation) {
      toast.error(
        `Invalid Amount: Amount must not exceed the allocation.
      Allocation: ₱${totalAllocation.toLocaleString()}`,
      );
      return false;
    }

    // ✅ lahat pasado
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const amount = parsePHP(formData.amount);

      // ======= PURCHASE REQUEST (PR) =======
      if (formData.type === "PR") {
        const prData = {
          activities_id: selectedActivity?.id,
          prno: formData.prno,
          transaction_date: formData.transaction_date,
          amount,
          amount_unobligated: totalAllocation,
        };

        if (mode === "update" && selectedRow?.PRNO) {
          await prSoAPI.update(selectedRow.PRNO, prData);
        } else {
          await prSoAPI.create(prData);
        }

        toast.success(`PR/SO ${mode === "update" ? "updated" : "created"}`);
      }
      // ======= OBLIGATION (OBR) =======
      else {
        const deductAllocation = parsePHP(selectedRow?.["AMOUNT PR"] || amount);
        const unobligatedAmount =
          totalAllocation > 0
            ? totalAllocation - deductAllocation
            : deductAllocation - totalAllocation;

        const obrData = {
          activities_id: selectedActivity?.id,
          prno: selectedRow?.PRNO || "",
          obrno: formData.obrno,
          transaction_date: formData.transaction_date,
          particular: formData.particular,
          amount,
          amount_unobligated: unobligatedAmount,
        };

        let isSuccess = false;

        try {
          if (mode === "update" && selectedRow?.OBRNO) {
            await obligationAPI.update(selectedRow.OBRNO, obrData);
          } else {
            await obligationAPI.create(obrData);
          }
          isSuccess = true;
          toast.success(
            `Obligation ${mode === "update" ? "updated" : "created"}`,
          );
        } catch (obrError) {
          console.error("Failed to save OBR:", obrError);
          toast.error("Failed to save OBR");
        }

        // Update PR unobligated only if OBR succeeded
        if (isSuccess) {
          if (selectedRow?.PRNO) {
            try {
              await prSoAPI.updateUnobligatedAmount(selectedRow.PRNO, {
                obligated: amount,
                unobligated: unobligatedAmount,
              });
            } catch (prError) {
              console.error("Failed to update PR unobligated amount:", prError);
              toast.error("Failed to update PR unobligated amount");
            }
          }

          // Pass updated row back to parent
          onSubmit({
            ...selectedActivity,
            totalFq: unobligatedAmount,
          });

          setTotalAllocation(unobligatedAmount);
        }
      }

      // ======= RESET FORM =======
      const today = new Date().toISOString().split("T")[0];
      setFormData({
        type: "PR",
        prno: "",
        obrno: "",
        transaction_date: today,
        amount: "",
        particular: "",
      });
      await fetchNextNumber(today);
      await fetchTableData();
      setMode("create");
      setSelectedRow(null);
      setTableType("PR/SO");
    } catch (err) {
      console.error(err);
      toast.error("Error saving transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTableData = (data) =>
    data.map((item) =>
      tableType === "PR/SO"
        ? {
            id: item.id,
            PRNO: item.prno,
            DATE: formatDate(item.transaction_date),
            "AMOUNT PR": formatPHP(item.amount),
            OBLIGATED: formatPHP(item.amount_obligated),
            UNOBLIGATED: formatPHP(item.amount_unobligated),
            "BALANCE PR": formatPHP(item.amount - item.amount_obligated),
            IS_OBLIGATED: item.is_obligated,
          }
        : {
            id: item.id,
            OBRNO: item.obrno,
            PARTICULAR: item.particular,
            DATE: formatDate(item.transaction_date),
            OBLIGATED: formatPHP(item.amount),
            UNOBLIGATED: formatPHP(item.amount_unobligated),
          },
    );

  const handleProceed = (row) => {
    // Only proceed if the PR is NOT yet fully obligated
    if (!row?.IS_OBLIGATED) {
      setSelectedRow(row);
      setFormData((prev) => ({
        ...prev,
        type: "Obligation",
        amount: row["AMOUNT PR"] || "0.00",
        particular: "",
      }));
      setTableType("OBLIGATION");
      setMode("create");
    } else {
      toast.error("This PR has already been obligated");
    }
  };

  const handleUpdate = (row) => {
    if (tableType === "PR/SO") {
      if (!row?.IS_OBLIGATED) {
        setMode("update");
        setSelectedRow(row);
        setFormData((prev) => ({
          ...prev,
          type: "PR",
          prno: row.PRNO,
          transaction_date: toInputDate(row.DATE),
          amount: row["AMOUNT PR"] || "0.00",
        }));
      } else {
        toast.error("This PR has already been obligated");
      }
    } else {
      setMode("update");
      setSelectedRow(row);
      setFormData((prev) => ({
        ...prev,
        type: "Obligation",
        obrno: row.OBRNO,
        particular: row.PARTICULAR,
        transaction_date: toInputDate(row.DATE),
        amount: row.OBLIGATED || "0.00",
      }));
    }
  };

  const handleCancel = async () => {
    if (!isSubmitting) {
      const currentDate = formData.transaction_date;
      setFormData({
        ...formData,
        amount: "",
        prno: formData.type === "PR" ? "" : formData.prno,
        obrno: formData.type === "Obligation" ? "" : formData.obrno,
        particular: "",
      });
      setSelectedRow(null);
      setMode("create");
      await fetchNextNumber(currentDate);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      const today = new Date().toISOString().split("T")[0];
      setFormData({
        type: "PR",
        prno: "",
        obrno: "",
        transaction_date: today,
        amount: "",
        particular: "",
      });
      setSelectedRow(null);
      setMode("create");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-green-600 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-semibold">
            {mode === "update"
              ? "Update Entry"
              : formData.type === "PR"
                ? "Purchase Request"
                : "Obligation"}
          </h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white hover:bg-green-700 rounded-full p-1"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left Panel */}
          <div className="flex-[0_0_30%] p-4 border-b lg:border-r border-gray-200 overflow-y-auto">
            {/* Activity Info */}
            <div className="mb-2 text-xs space-y-1">
              <div>
                <span className="font-medium">PAP Type:</span>{" "}
                {selectedActivity?.pap_type || "-"}
              </div>
              <div>
                <span className="font-medium">PAP Des:</span>{" "}
                {selectedActivity?.pap_des || "-"}
              </div>
              <div>
                <span className="font-medium">Activities:</span>{" "}
                {selectedActivity?.name || "-"}
              </div>
              {selectedActivity?.expense_items && (
                <div>
                  <span className="font-medium">Expense Items:</span>{" "}
                  {selectedActivity.expense_items}
                </div>
              )}
              {selectedActivity?.expense_items_sub && (
                <div>
                  <span className="font-medium">Expense Sub-Items:</span>{" "}
                  {selectedActivity.expense_items_sub}
                </div>
              )}
              <div>
                <span className="font-bold">Total Allocation: </span>{" "}
                {selectedActivity?.total_amount || "0.00"}
              </div>
              <div>
                <span className="font-bold"> Balance: </span>{" "}
                {totalAllocation || "0.00"}
              </div>
            </div>

            {/* Entry Type */}
            <div className="mb-4 text-sm border-t pt-2">
              <span className="font-medium text-sm block mb-2">Entry Type</span>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.type === "PR"}
                    onChange={() => handleTypeChange("PR")}
                  />
                  Purchase Request (PR)
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={formData.type === "Obligation"}
                    onChange={() => handleTypeChange("Obligation")}
                  />
                  Obligation (OBR)
                </label>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-2">
              {formData.type === "PR" ? (
                <div>
                  <label className="block font-medium text-sm mb-1">
                    PR Number *
                  </label>
                  <input
                    type="text"
                    value={formData.prno}
                    onChange={(e) => handleInputChange("prno", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block font-medium text-sm mb-1">
                      OBR Number *
                    </label>
                    <input
                      type="text"
                      value={formData.obrno}
                      onChange={(e) =>
                        handleInputChange("obrno", e.target.value)
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-sm mb-1">
                      Particular *
                    </label>
                    <textarea
                      value={formData.particular}
                      onChange={(e) =>
                        handleInputChange("particular", e.target.value)
                      }
                      rows={3}
                      className="w-full px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter particular details..."
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Transaction Date *
                  </label>
                  <input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Amount *
                  </label>
                  <input
                    ref={amountInputRef}
                    type="text"
                    value={formData.amount}
                    onChange={(e) =>
                      handleAmountChange("amount", e.target.value)
                    }
                    className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-4 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving..."
                    : mode === "update"
                      ? "Update"
                      : "Save"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Panel: Table */}
          <div className="flex-1 p-4 overflow-y-auto overflow-x-auto">
            <Table
              columns={tableColumns[tableType]}
              data={formatTableData(tableData)}
              loading={isLoadingTable}
              maxHeight="500px"
              onRowClick={null}
              isSummary={false}
              actionHandlers={{ handleProceed, handleUpdate }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PRObligationModal;
