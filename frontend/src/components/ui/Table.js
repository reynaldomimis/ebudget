import React, { useState, useMemo } from "react";
import { formatPHP, parsePHP } from "../../utils/formatters";

const Table = ({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available",
  onRowClick = null,
  maxHeight = "800px",
  tableLabel = "Records",
  isSummary = false,
  actionHandlers = null,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      columns.some((col) =>
        (row[col] ?? "").toString().toLowerCase().includes(query),
      ),
    );
  }, [data, columns, searchQuery]);

  // Calculate grand totals for numeric columns
  const grandTotals = useMemo(() => {
    const totals = {};
    columns.forEach((col) => {
      const lower = col.toLowerCase();
      const isNumeric =
        lower.includes("amount") ||
        lower.includes("obligated") ||
        lower.includes("unobligated") ||
        lower.includes("balance");
      if (isNumeric) {
        totals[col] = filteredData.reduce(
          (sum, row) => sum + parsePHP(row[col] || 0),
          0,
        );
      }
    });
    return totals;
  }, [filteredData, columns]);

  // Column width logic
  const getColumnWidth = (col, colIndex) => {
    if (colIndex === 0) return "160px";
    if (col.toLowerCase().includes("date")) return "90px";
    if (
      col.toLowerCase().includes("name") ||
      col.toLowerCase().includes("performance") ||
      // col.toLowerCase().includes("expense") ||
      col.toLowerCase() === "particular"
    )
      return "200px";
    if (col === "Action") return "80px";
    return "100px";
  };

  const getAlignment = (col, colIndex) => {
    const lowerCol = col.toLowerCase();
    if (lowerCol.includes("date")) return "text-center";
    if (colIndex === 0) return "text-left";
    if (
      lowerCol.includes("amount") ||
      lowerCol.includes("obligated") ||
      lowerCol.includes("unobligated") ||
      lowerCol.includes("balance") ||
      lowerCol.includes("total") ||
      lowerCol.includes("pr")
    )
      return "text-right";
    return "text-left"; // Particular stays left-aligned
  };

  const getCellPadding = () => (isSummary ? "px-3 py-2" : "px-2 py-1");

  return (
    <div className="flex flex-col w-full">
      {/* Label + Search */}
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-gray-700 text-sm">
          {tableLabel}
        </span>
        <div className="relative w-56">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="pl-4 pr-3 py-1 border border-gray-300 rounded text-sm w-full focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-auto border border-gray-300 rounded-lg shadow-sm w-full"
        style={{ maxHeight }}
      >
        <table className="w-full min-w-full table-auto border-collapse text-xs">
          <thead className="text-xs font-medium bg-green-600 text-white sticky top-0 z-10">
            <tr>
              {columns.map((col, colIndex) => (
                <th
                  key={col}
                  className={`${getCellPadding()} border border-green-500 text-center`}
                  style={{ width: getColumnWidth(col, colIndex) }}
                >
                  {col.toUpperCase()}
                </th>
              ))}
              {/* Only one ACTION column if actionHandlers exist */}
              {!isSummary && actionHandlers && (
                <th
                  className={`${getCellPadding()} border border-green-500 text-center`}
                  style={{ width: "80px" }}
                >
                  ACTION
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (actionHandlers ? 1 : 0)}
                  className="py-8 text-center border"
                >
                  <div className="h-8 w-8 mx-auto animate-spin border-4 border-green-600 border-t-transparent rounded-full" />
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actionHandlers ? 1 : 0)}
                  className="py-8 text-center text-gray-500 border"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIndex) => (
                <tr
                  key={`${row.id}-${rowIndex}`}
                  className={`${isSummary ? "bg-gray-50 font-medium" : ""} border-b last:border-b-0`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      className={`${getCellPadding()} border border-gray-200 ${getAlignment(col, colIndex)}`}
                      style={{ width: getColumnWidth(col, colIndex) }}
                    >
                      {row[col] ?? ""}
                    </td>
                  ))}

                  {/* Only render action buttons in tbody */}
                  {!isSummary && actionHandlers && (
                    <td className="px-1 py-1 border border-gray-200 text-center flex justify-center gap-1">
                      {/* Show Proceed only for PR rows */}
                      {row.isPR && actionHandlers.handleProceed && (
                        <button
                          onClick={() => actionHandlers.handleProceed(row)}
                          title="Proceed"
                          className="bg-green-100 hover:bg-green-200 text-green-700 text-xs px-2 py-1 rounded-full transition-colors"
                        >
                          Obligate
                        </button>
                      )}
                      {/* Always show Update if available */}
                      {actionHandlers.handleUpdate && (
                        <button
                          onClick={() => actionHandlers.handleUpdate(row)}
                          title="Update"
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs px-2 py-1 rounded-full transition-colors"
                        >
                          Update
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>

          {/* Grand Total */}
          {filteredData.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 text-sm font-bold border-t border-gray-300">
                {(() => {
                  const dateIndex = columns.findIndex((col) =>
                    col.toLowerCase().includes("date"),
                  );

                  return columns.map((col, colIndex) => {
                    const lower = col.toLowerCase();
                    const isNumeric =
                      lower.includes("amount") ||
                      lower.includes("obligated") ||
                      lower.includes("unobligated") ||
                      lower.includes("balance");

                    if (colIndex === 0) {
                      return (
                        <td
                          key={colIndex}
                          colSpan={dateIndex + 1}
                          className="px-2 py-1 border text-right font-semibold"
                        >
                          Grand Total
                        </td>
                      );
                    }

                    if (colIndex <= dateIndex) return null;

                    if (isNumeric) {
                      return (
                        <td
                          key={colIndex}
                          className="px-2 py-1 border text-right"
                        >
                          {formatPHP(grandTotals[col] || 0)}
                        </td>
                      );
                    }

                    return (
                      <td key={colIndex} className="px-2 py-1 border"></td>
                    );
                  });
                })()}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default Table;
