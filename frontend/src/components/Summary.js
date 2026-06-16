import React, { useState, useEffect, useMemo } from "react";
import { prAPI, obligationAPI, activitiesAPI } from "../utils/api";
import { formatPHP, formatDate } from "../utils/formatters";
import Table from "./ui/Table";
import Dropdown from "./ui/Dropdown";
import { officeNames, programMap } from "../utils/helper";
import SummaryTable from "./ui/SummaryTable";
import ActivitiesTable from "./ui/ActivitiesTable";

const Summary = () => {
  const [selectedView, setSelectedView] = useState("SUMMARY");
  const [prSoData, setPrSoData] = useState([]);
  const [obligationData, setObligationData] = useState([]);
  const [expenseItems, setExpenseItems] = useState([]);
  const [activitiesItem, setactivitiesItem] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Filter states
  const [selectedOffice, setSelectedOffice] = useState("");
  const [selectedPapKey, setSelectedPapKey] = useState("");
  const [selectedPapValue, setSelectedPapValue] = useState("");
  const [selectedActivityItem, setSelectedActivityItem] = useState("");
  const [selectedExpenseItem, setSelectedExpenseItem] = useState("");

  const viewOptions = [
    { value: "SUMMARY", label: "SUMMARY" },
    { value: "PR/SO", label: "PR/SO" },
    { value: "OBLIGATION", label: "OBLIGATION" },
  ];

  const prSoColumns = [
    "PRNO",
    "ACTIVITIES",
    "EXPENSE ITEMS",
    "EXPENSE SUB-ITEMS",
    "DATE",
    "AMOUNT PR",
    "OBLIGATED",
    "UNOBLIGATED",
    "BALANCE PR",
  ];

  const obligationColumns = [
    "OBRNO",
    "ACTIVITIES",
    "EXPENSE ITEMS",
    "EXPENSE SUB-ITEMS",
    "DATE",
    "OBLIGATED",
    "UNOBLIGATED",
  ];

  // --- Fetch all data once
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [prSoRes, oblRes, nameRes, expenseRes] = await Promise.all([
        prAPI.getWithBalance(),
        obligationAPI.getActivity(),
        activitiesAPI.getDistinctValues("ref_main_name"),
        activitiesAPI.getDistinctValues("expense_items"),
      ]);

      setPrSoData(prSoRes.data.data || []);
      setObligationData(oblRes.data.data || []);
      setactivitiesItem([
        ...new Set((nameRes.data.data || []).map((s) => s.trim())),
      ]);

      setExpenseItems([
        ...new Set((expenseRes.data.data || []).map((s) => s.trim())),
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Format rows
  const formatPrSoRow = (item) => ({
    PRNO: item.prno || "",
    ACTIVITIES: item.name || "",
    "EXPENSE ITEMS": item.expense_items || "",
    "EXPENSE SUB-ITEMS": item.expense_items_sub || "",

    DATE: formatDate(item.transaction_date),
    "AMOUNT PR": formatPHP(item.amount),
    OBLIGATED: formatPHP(item.amount_obligated),
    UNOBLIGATED: formatPHP(item.amount_unobligated),
    "BALANCE PR": formatPHP(
      (parseFloat(item.amount) || 0) - (parseFloat(item.amount_obligated) || 0),
    ),
    pap_type: item.pap_type,
    pap_des: item.pap_des,
    division: item.division,
    expense_items: item.expense_items || "",
  });

  const formatObligationRow = (item) => ({
    OBRNO: item.obrno || "",
    ACTIVITIES: item.name || "",
    "EXPENSE ITEMS": item.expense_items || "",
    "EXPENSE SUB-ITEMS": item.expense_items_sub || "",
    DATE: formatDate(item.transaction_date),
    OBLIGATED: formatPHP(item.amount),
    UNOBLIGATED: formatPHP(item.amount_unobligated),
    division: item.division,
    expense_items: item.expense_items || "",
  });

  // --- Filtered Data (in-memory)
  const filteredPrSoData = useMemo(() => {
    return prSoData.filter((row) => {
      return (
        (!selectedOffice || row.division === selectedOffice) &&
        (!selectedPapKey || row.pap_type === selectedPapKey) &&
        (!selectedPapValue || row.pap_des === selectedPapValue) &&
        (!selectedActivityItem || row.ref_main_name === selectedActivityItem) &&
        (!selectedExpenseItem || row.expense_items === selectedExpenseItem)
      );
    });
  }, [
    prSoData,
    selectedDivision,
    selectedPapKey,
    selectedPapValue,
    selectedActivityItem,
    selectedExpenseItem,
  ]);

  const filteredObligationData = useMemo(() => {
    return obligationData.filter((row) => {
      return (
        (!selectedOffice || row.division === selectedOffice) &&
        (!selectedPapKey || row.pap_type === selectedPapKey) &&
        (!selectedPapValue || row.pap_des === selectedPapValue) &&
        (!selectedActivityItem || row.ref_main_name === selectedActivityItem) &&
        (!selectedExpenseItem || row.expense_items === selectedExpenseItem)
      );
    });
  }, [
    obligationData,
    selectedDivision,
    selectedPapKey,
    selectedPapValue,
    selectedActivityItem,
    selectedExpenseItem,
  ]);

  // --- Totals for summary cards
  const filteredPrSoTotals = useMemo(() => {
    const totalAmountPR = filteredPrSoData.reduce(
      (sum, i) => sum + parseFloat(i.amount || 0),
      0,
    );
    const totalObligated = filteredPrSoData.reduce(
      (sum, i) => sum + parseFloat(i.amount_obligated || 0),
      0,
    );
    const totalUnobligated = filteredPrSoData.reduce(
      (sum, i) => sum + parseFloat(i.amount_unobligated || 0),
      0,
    );
    return {
      totalAmountPR,
      totalObligated,
      totalUnobligated,
      balancePR: totalAmountPR - totalObligated,
    };
  }, [filteredPrSoData]);

  const filteredObligationTotals = useMemo(() => {
    const totalObligated = filteredObligationData.reduce(
      (sum, i) => sum + parseFloat(i.amount || 0),
      0,
    );
    const totalUnobligated = filteredObligationData.reduce(
      (sum, i) => sum + parseFloat(i.amount_unobligated || 0),
      0,
    );
    return { totalObligated, totalUnobligated };
  }, [filteredObligationData]);

  // --- Render Summary Cards
  const renderSummaryView = () => (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Total PR/SO</p>
          <p className="text-2xl font-bold">
            {formatPHP(filteredPrSoTotals.totalAmountPR)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Total Obligated</p>
          <p className="text-2xl font-bold text-green-600">
            {formatPHP(filteredObligationTotals.totalObligated)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Total Unobligated</p>
          <p className="text-2xl font-bold text-yellow-600">
            {formatPHP(filteredObligationTotals.totalUnobligated)}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header with view selector + filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap items-center gap-2 ">
        <div className="flex items-center gap-2 flex-wrap">
          {/* View selector using Dropdown */}
          <Dropdown
            options={viewOptions}
            value={selectedView}
            onChange={(val) => {
              setSelectedView(val);

              // Reset other filters when view changes
              setSelectedOffice("");
              setSelectedPapKey("");
              setSelectedPapValue("");
              setSelectedActivityItem("");
              setSelectedExpenseItem("");
            }}
            size="small"
          />

          {/* PAP dropdown */}
          <Dropdown
            options={[
              { value: "", label: "Select Program" },
              ...Object.keys(programMap).map((k) => ({ value: k, label: k })),
            ]}
            value={selectedPapKey}
            onChange={(val) => {
              setSelectedPapKey(val);
              setSelectedPapValue("");
            }}
            size="small"
          />
          {selectedPapKey && (
            <Dropdown
              options={[
                { value: "", label: "Select Item" },
                ...programMap[selectedPapKey].map((v) => ({
                  value: v,
                  label: v,
                })),
              ]}
              value={selectedPapValue}
              onChange={setSelectedPapValue}
              size="small"
            />
          )}

          {/* Office dropdown */}
          <Dropdown
            options={[
              { value: "", label: "Select Office" },
              ...officeNames.map((d) => ({ value: d, label: d })),
            ]}
            value={selectedOffice}
            onChange={setSelectedOffice}
            size="small"
          />

          {/* Activity dropdown */}
          <Dropdown
            options={[
              { value: "", label: "Select Activity" },
              ...activitiesItem.map((a) => ({
                value: a,
                label: a,
              })),
            ]}
            value={selectedActivityItem}
            onChange={setSelectedActivityItem}
            size="small"
          />

          {/* Expense Item dropdown */}
          <Dropdown
            options={[
              { value: "", label: "Select Expense Items" },
              ...expenseItems.map((e) => ({ value: e, label: e })),
            ]}
            value={selectedExpenseItem}
            onChange={setSelectedExpenseItem}
            size="small"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-8 flex-1 overflow-auto flex flex-col items-center">
        {selectedView === "SUMMARY" &&
          !selectedOffice &&
          !selectedActivityItem &&
          !selectedExpenseItem && (
            <>
              {renderSummaryView()}
              <SummaryTable
                office={selectedOffice}
                papType={selectedPapKey}
                papDes={selectedPapValue}
                expenseItem={selectedExpenseItem}
              />
            </>
          )}

        {selectedView === "SUMMARY" &&
          (selectedOffice || selectedActivityItem || selectedExpenseItem) && (
            <>
              <ActivitiesTable
                office={selectedOffice}
                papType={selectedPapKey}
                papDes={selectedPapValue}
                activitiesItem={selectedActivityItem}
                expenseItem={selectedExpenseItem}
              />
            </>
          )}

        {selectedView === "PR/SO" && (
          <Table
            columns={prSoColumns}
            data={filteredPrSoData.map(formatPrSoRow)}
            loading={isLoading}
            tableLabel="PR/SO Records"
            isSummary={true}
            maxHeight="100%"
          />
        )}

        {selectedView === "OBLIGATION" && (
          <Table
            columns={obligationColumns}
            data={filteredObligationData.map(formatObligationRow)}
            loading={isLoading}
            tableLabel="Obligation Records"
            isSummary={true}
            maxHeight="100%"
          />
        )}
      </div>
    </div>
  );
};

export default Summary;
