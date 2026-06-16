import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { activitiesAPI } from "../../utils/api";
import GroupedTable from "./GroupedTable";

const allotmentOptions = [
  "PS - Personnel Services",
  "MOOE - Maintenance and Other Operating Expense",
  "FinEx - Financial Expenditures",
  "CO - Capital Outlay",
];

export default function BudgetForm() {
  const [allActivities, setAllActivities] = useState([]);
  const [papTypes, setPapTypes] = useState([]);
  const [papOptions, setPapOptions] = useState([]);

  const [selectedPapType, setSelectedPapType] = useState("");
  const [selectedPapDes, setSelectedPapDes] = useState("");
  const [selectedAllotment, setSelectedAllotment] = useState("");

  const [retrievedData, setRetrievedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRetrieved, setHasRetrieved] = useState(false);

  // Fetch unique PAP descriptions and types using the logic from your Records
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await activitiesAPI.getAll();
        const activities = response.data.data;
        setAllActivities(activities);

        // Extract unique PAP Types
        const uniqueTypes = Array.from(
          new Set(activities.map((a) => a.pap_type).filter(Boolean))
        ).sort();

        setPapTypes(uniqueTypes);
      } catch (err) {
        console.error("Failed to fetch PAP data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update PAP Description options based on selected PAP Type
  useEffect(() => {
    const filtered = selectedPapType
      ? allActivities.filter(a => a.pap_type === selectedPapType)
      : allActivities;

    const uniquePaps = Array.from(
      new Set(filtered.map((a) => a.pap_des).filter(Boolean))
    ).sort();

    setPapOptions(uniquePaps);
    setSelectedPapDes("");
  }, [selectedPapType, allActivities]);

  const handleRetrieve = () => {
    setIsLoading(true);

    // Filtering logic
    let filtered = allActivities;

    if (selectedPapType) {
      filtered = filtered.filter(a => a.pap_type === selectedPapType);
    }

    if (selectedPapDes) {
      filtered = filtered.filter(a => a.pap_des === selectedPapDes);
    }

    // Note: If you have an allotment_class field in your data, filter by it here
    // For now, we show the records matching PAP Type and Description

    setRetrievedData(filtered);
    setHasRetrieved(true);
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col gap-4 bg-slate-100 p-4">
      <div className="max-w-7xl w-full mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b bg-white">
          <h2 className="text-xl font-bold text-slate-800">Entry Form</h2>
        </div>

        {/* Form Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* 1. P/A/P Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              P/A/P Type
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={selectedPapType}
              onChange={(e) => setSelectedPapType(e.target.value)}
              disabled={isLoading}
            >
              <option value="">{isLoading ? "Loading..." : "Select P/A/P Type..."}</option>
              {papTypes.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* 2. P/A/P Description Dropdown */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              P/A/P Description
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={selectedPapDes}
              onChange={(e) => setSelectedPapDes(e.target.value)}
              disabled={isLoading || !selectedPapType}
            >
              <option value="">
                {!selectedPapType ? "Select P/A/P Type first..." : "Select P/A/P Description..."}
              </option>
              {papOptions.map((des, index) => (
                <option key={index} value={des}>{des}</option>
              ))}
            </select>
          </div>

          {/* 3. Allotment Class (Fixed) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Allotment Class
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={selectedAllotment}
              onChange={(e) => setSelectedAllotment(e.target.value)}
            >
              <option value="">Choose Allotment Class...</option>
              {allotmentOptions.map((item, index) => (
                <option key={index} value={item}>{item}</option>
              ))}
            </select>
          </div>

          {/* Action Button */}
          <div className="md:col-span-2 xl:col-span-3 flex justify-end">
            <button
              onClick={handleRetrieve}
              className="w-full md:w-auto min-w-[180px] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 py-3 font-semibold transition-all shadow-md"
            >
              Retrieve
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {hasRetrieved && (
        <div className="flex-1 min-h-0">
          <GroupedTable
            data={retrievedData}
            tableLabel="Retrieved Records"
            interactive={true}
          />
        </div>
      )}
    </div>
  );
}
