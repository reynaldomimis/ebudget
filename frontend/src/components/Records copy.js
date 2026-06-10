import React, { useState, useEffect } from "react";
import { activitiesAPI } from "../utils/api";
import PRObligationModal from "./PRObligationModal";
import GroupedTable from "./ui/GroupedTable";
import SubtotalModal from "./ui/SubtotalModal";

const Records = () => {
  const [records, setRecords] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [isSubtotalModalOpen, setIsSubtotalModalOpen] = useState(false);
  const [selectedSubtotal, setSelectedSubtotal] = useState(null);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data
  const fetchRecords = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await activitiesAPI.getAll();
      const activities = response.data.data;
      const formattedRecords = activities.map((act) => ({
        id: act.id,
        pap_type: act.pap_type || "",
        pap_des: act.pap_des || "",
        is_subtotal: act.is_subtotal || false,
        division: act.division || "",
        name: act.name || act.pap_des || "",
        performance_indicator: act.performance_indicator || "",
        pt1: act.pt1 || 0,
        pt2: act.pt2 || 0,
        pt3: act.pt3 || 0,
        pt4: act.pt4 || 0,
        totalPt: act.totalPt || 0,
        expense_items: act.expense_items || "",
        expense_items_sub: act.expense_items_sub || "",
        fq1: act.fq1 || 0,
        fq2: act.fq2 || 0,
        fq3: act.fq3 || 0,
        fq4: act.fq4 || 0,
        totalFq: act.totalFq || 0,
        total_amount: act.total_amount || 0,
        sub_total_name: act.sub_total_name || "",
      }));
      setRecords(formattedRecords);
    } catch (err) {
      setError(
        "Failed to fetch records: " +
          (err.response?.data?.error || err.message),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Handle clicks on table rows
  const handleRowClick = (row, options = {}) => {
    if (options.isSubtotal) {
      setSelectedSubtotal(row);
      setIsSubtotalModalOpen(true);
    } else {
      setSelectedRow(row);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <GroupedTable
        data={records}
        tableLabel="Records"
        interactive={true}
        onRowClick={handleRowClick}
      />

      {/* Normal row modal */}
      {isModalOpen && selectedRow && (
        <PRObligationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedActivity={selectedRow}
        />
      )}

      {/* Subtotal row modal */}
      {isSubtotalModalOpen && selectedSubtotal && (
        <SubtotalModal
          isOpen={isSubtotalModalOpen}
          onClose={() => setIsSubtotalModalOpen(false)}
          selectedSubtotal={selectedSubtotal}
          onSubmit={(updatedRow) => {
            setRecords((prev) =>
              prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)),
            );
            setIsSubtotalModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Records;
