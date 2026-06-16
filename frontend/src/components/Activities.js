import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { activitiesAPI } from "../utils/api";
import { officeNames, programMap } from "../utils/helper";
import GroupedTable from "./ui/GroupedTable";
import PSTable from "./ui/PSTable";
import PRObligationModal from "./PRObligationModal";
import { deductFromFqs, parsePHP } from "../utils/formatters";
import { toast } from "react-toastify";

const allotmentOptions = [
  { value: "MOOE", label: "MOOE - Maintenance and Other Operating Expense" },
  { value: "PS", label: "PS - Personnel Services" },
];

const staticPapTypes = [
  "GENERAL ADMINISTRATION AND SUPPORT",
  "NATIONAL NUTRITION MANAGEMENT PROGRAM",
];

const Activities = () => {
  const [allActivities, setAllActivities] = useState([]);
  const [papOptions, setPapOptions] = useState([]);

  const [selectedPapType, setSelectedPapType] = useState("");
  const [selectedPapDes, setSelectedPapDes] = useState("");
  const [selectedAllotment, setSelectedAllotment] = useState("");
  const [selectedFundSource, setSelectedFundSource] = useState("");

  const fundSourceOptions = [
    { value: "101101 - Specific Budgets", label: "101101 - Specific Budgets" },
    { value: "104102 - RLIP", label: "104102 - RLIP" },
  ];

  const [retrievedData, setRetrievedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRetrieved, setHasRetrieved] = useState(false);

  // Modal states for interaction
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // Clear table results whenever any filter dropdown changes
  useEffect(() => {
    setHasRetrieved(false);
    setRetrievedData([]);
  }, [selectedPapType, selectedPapDes, selectedAllotment, selectedFundSource]);

  // Fetch unique PAP descriptions and types
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await activitiesAPI.getAll();
        const allData = response.data.data || [];
        setAllActivities(allData);
        setHasRetrieved(false);
        setRetrievedData([]);
      } catch (err) {
        console.error("Failed to fetch Activities data:", err);
        toast.error("Failed to fetch records");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update PAP Description options based on static programMap
  useEffect(() => {
    if (!selectedPapType) {
      setPapOptions([]);
      return;
    }

    // Use all static descriptions for the selected Type
    const staticList = programMap[selectedPapType] || [];
    setPapOptions(staticList);
  }, [selectedPapType]);

  const handleRetrieve = () => {
    setIsLoading(true);

    let filtered = allActivities.filter(a => {
        if (selectedAllotment === "PS") {
            return a.allotment_class === "PS" || a.is_ps_expense === true;
        }
        return a.allotment_class === "MOOE" && !a.is_ps_expense && !a.is_subtotal;
    });

    if (selectedPapType) {
      filtered = filtered.filter(a => a.pap_type === selectedPapType);
    }

    if (selectedPapDes) {
      filtered = filtered.filter(a => {
        const target = selectedPapDes.toLowerCase().trim();
        const current = (a.pap_des || "").toLowerCase().trim();
        if (current === target) return true;
        const normalize = (str) =>
          str.replace(/nutriiton/g, "nutrition")
             .replace(/supervision/g, "support")
             .replace(/plans and/g, "plan,")
             .replace(/,\s*/g, " ")
             .replace(/\s+/g, " ")
             .trim();
        return normalize(current) === normalize(target);
      });
    }

    setRetrievedData(filtered);
    setHasRetrieved(true);
    setIsLoading(false);
  };

  const handleRowClick = (row) => {
    if (selectedAllotment === "PS") return;
    setSelectedRow(row);
    setIsModalOpen(true);
  };

  const handleObligationSubmit = async ({ activityId, obligatedAmount }) => {
    let updatedActivity = null;
    const updateList = (list) => list.map((r) => {
      if (r.id !== activityId) return r;
      const updated = deductFromFqs(r, obligatedAmount);
      updatedActivity = {
        ...r,
        fq1: updated.fq1,
        fq2: updated.fq2,
        fq3: updated.fq3,
        fq4: updated.fq4,
        totalFq: updated.totalFq,
      };
      return updatedActivity;
    });

    setRetrievedData(prev => updateList(prev));
    setAllActivities(prev => updateList(prev));

    try {
      if (updatedActivity) {
        await activitiesAPI.update(activityId, {
          fq1: parsePHP(updatedActivity.fq1),
          fq2: parsePHP(updatedActivity.fq2),
          fq3: parsePHP(updatedActivity.fq3),
          fq4: parsePHP(updatedActivity.fq4),
        });
        toast.success("Obligation saved and Activity updated.");
      }
    } catch (err) {
      toast.error("Failed to update activity FQs: " + err.message);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden shrink-0">
        <div className="px-6 py-4 border-b bg-white flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Activities Entry Form</h2>
          <span className="text-sm text-slate-500 font-medium">Unified Activities Flow</span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
            {/* 1. P/A/P Type */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">
                P/A/P Type
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={selectedPapType}
                onChange={(e) => {
                  setSelectedPapType(e.target.value);
                  setSelectedPapDes("");
                  setSelectedAllotment("");
                  setSelectedFundSource("");
                }}
                disabled={isLoading}
              >
                <option value="">Select P/A/P Type...</option>
                {staticPapTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* 2. P/A/P Description */}
            {selectedPapType && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">
                  P/A/P Description
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={selectedPapDes}
                  onChange={(e) => {
                    setSelectedPapDes(e.target.value);
                    setSelectedAllotment("");
                    setSelectedFundSource("");
                  }}
                  disabled={isLoading}
                >
                  <option value="">Select P/A/P Description...</option>
                  {papOptions.map((des, index) => (
                    <option key={index} value={des}>{des}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 3. Allotment Class */}
            {selectedPapDes && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">
                  Allotment Class
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-blue-600"
                  value={selectedAllotment}
                  onChange={(e) => {
                    setSelectedAllotment(e.target.value);
                    if (e.target.value === "PS") {
                      setSelectedFundSource("101101 - Specific Budgets");
                    } else {
                      setSelectedFundSource("");
                    }
                  }}
                  disabled={isLoading}
                >
                  <option value="">Select Allotment...</option>
                  {allotmentOptions.map((item, index) => (
                    <option key={index} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 4. Fund Source (Show only if PS is selected) */}
            {selectedAllotment === "PS" && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">
                  Fund Source
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                  value={selectedFundSource}
                  onChange={(e) => setSelectedFundSource(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Select Fund Source...</option>
                  {fundSourceOptions.map((option, index) => (
                    <option key={index} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Button */}
          {selectedAllotment && ((selectedAllotment === "MOOE") || (selectedAllotment === "PS" && selectedFundSource)) && (
            <div className="flex justify-end">
              <button
                onClick={handleRetrieve}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg px-6 py-2 text-sm font-semibold transition-all shadow-md"
              >
                Retrieve
                <Search size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Table */}
      {hasRetrieved && (
        <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
          {selectedAllotment === "PS" ? (
             <PSTable
                data={retrievedData}
                tableLabel="Retrieved PS Records"
                fundSource={selectedFundSource}
             />
          ) : (
            <GroupedTable
                data={retrievedData}
                tableLabel={`Retrieved ${selectedAllotment} Activities`}
                interactive={true}
                hideFilters={true}
                onRowClick={handleRowClick}
            />
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedRow && (
        <PRObligationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedActivity={selectedRow}
          onSubmit={handleObligationSubmit}
        />
      )}
    </div>
  );
};

export default Activities;