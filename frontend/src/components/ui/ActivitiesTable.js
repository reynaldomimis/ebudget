import React, { useState, useEffect } from "react";
import { activitiesAPI } from "../../utils/api";
import { formatPHP, parsePHP } from "../../utils/formatters";

const ActivitiesTable = ({
  papType = "",
  papDes = "",
  division = "",
  activitiesItem = "",
  expenseItem = "",
}) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState("");

  // Fetch all activities
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await activitiesAPI.getAll();
        let activities = res.data?.data || [];
        activities = activities.filter((i) => i.is_subtotal === 0);
        setData(activities);
      } catch (error) {
        console.error("Error fetching activities:", error);
      }
    };
    fetchData();
  }, []);

  // Filter data based on props and search
  useEffect(() => {
    let temp = [...data];
    if (division) temp = temp.filter((i) => i.division === division);
    if (papType) temp = temp.filter((i) => i.pap_type === papType);
    if (papDes) temp = temp.filter((i) => i.pap_des === papDes);

    if (activitiesItem) {
      temp = temp.filter(
        (i) => i.ref_main_name?.toLowerCase() === activitiesItem.toLowerCase(),
      );
    }

    if (expenseItem) temp = temp.filter((i) => i.expense_items === expenseItem);
    if (search) {
      const lower = search.toLowerCase();
      temp = temp.filter(
        (i) =>
          i.expense_items.toLowerCase().includes(lower) ||
          i.expense_items_sub.toLowerCase().includes(lower),
      );
    }
    temp = temp.filter((i) => parsePHP(i.totalFq) > 0);
    setFilteredData(temp);
  }, [division, activitiesItem, expenseItem, papType, papDes, data, search]);

  const grandTotal = filteredData.reduce(
    (sum, item) => sum + parsePHP(item.totalFq),
    0,
  );

  return (
    <div className="space-y-2">
      {/* Label + Search */}
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-gray-700 text-sm">
          Activities Table
        </span>
        <div className="relative w-56">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-4 pr-3 py-1 border border-gray-300 rounded
                         text-sm w-full focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="relative border border-gray-300 rounded">
        {/* Scrollable table body */}
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full min-w-full table-fixed text-xs border-collapse">
            <thead className="bg-green-600 text-white sticky top-0 z-10">
              <tr>
                <th className="px-2 py-2 text-center border-r border-white">
                  Expense Items
                </th>
                <th className="px-2 py-2 text-center border-r border-white">
                  Expense Items Sub
                </th>
                <th className="px-2 py-2 text-center border-white w-[150px]">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center px-2 py-4 w-full">
                    No records available
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={index} className="even:bg-gray-50">
                    <td className="px-2 py-2">{item.expense_items}</td>
                    <td className="px-2 py-2">{item.expense_items_sub}</td>
                    <td className="px-2 py-2 text-right font-bold">
                      {formatPHP(item.totalFq)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Grand Total Sticky Bottom */}
        {filteredData.length > 0 && (
          <div className="sticky bottom-0 bg-gray-100 font-semibold text-sm text-right px-2 py-1 border-t border-gray-300 z-20">
            <span className="mr-2">Grand Total: {"    "}</span>
            <span className="font-bold">{formatPHP(grandTotal)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitiesTable;
