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
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // ================= FILTER =================
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      columns.some((col) =>
        (row[col] ?? "").toString().toLowerCase().includes(query),
      ),
    );
  }, [data, columns, searchQuery]);

  // ================= TOTALS =================
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

  // ================= HELPERS =================
  const getColumnWidth = (col, colIndex) => {
    if (colIndex === 0) return "250px";
    if (col.toLowerCase().includes("date")) return "90px";
    if (
      col.toLowerCase().includes("name") ||
      col.toLowerCase().includes("performance") ||
      col.toLowerCase().includes("expense")
    )
      return "200px";
    return "100px";
  };

  const getCellPadding = () => (isSummary ? "px-3 py-2" : "px-2 py-1");

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
    return "text-left";
  };

  const totalColSpan = columns.length + (!isSummary ? 1 : 0);

  // ================= RENDER =================
  return (
    <div className="flex flex-col w-full">
      {/* Header */}
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
          {/* ================= THEAD ================= */}
          <thead className="bg-green-600 text-white sticky top-0 z-10">
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

              {/* ✅ ACTION COLUMN */}
              {!isSummary && (
                <th className="px-2 py-1 border border-green-500 text-center w-[90px]">
                  ACTION
                </th>
              )}
            </tr>
          </thead>

          {/* ================= TBODY ================= */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={totalColSpan} className="py-8 text-center border">
                  <div className="h-8 w-8 mx-auto animate-spin border-4 border-green-600 border-t-transparent rounded-full" />
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={totalColSpan}
                  className="py-8 text-center text-gray-500 border"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`
                    ${isSummary ? "bg-gray-50 font-medium" : ""}
                    ${
                      onRowClick
                        ? "cursor-pointer hover:bg-green-50"
                        : ""
                    }
                    border-b last:border-b-0
                  `}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      className={`${getCellPadding()} border border-gray-200 ${getAlignment(
                        col,
                        colIndex,
                      )}`}
                      style={{ width: getColumnWidth(col, colIndex) }}
                    >
                      {row[col] ?? ""}
                    </td>
                  ))}

                  {/* ✅ ACTION BUTTONS */}
                  {!isSummary && (
                    <td className="px-2 py-1 border text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          className="text-green-600 hover:text-green-800"
                          title="Proceed"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Proceed:", row);
                          }}
                        >
                          ✔️
                        </button>

                        <button
                          className="text-blue-600 hover:text-blue-800"
                          title="Update"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Update:", row);
                          }}
                        >
                          ✏️
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>

          {/* ================= FOOTER ================= */}
          {filteredData.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 text-sm font-bold border-t border-gray-300">
                {(() => {
                  const dateIndex = columns.findIndex((col) =>
                    col.toLowerCase().includes("date"),
                  );

                  return (
                    <>
                      {/* ✅ Grand Total under DATE */}
                      <td
                        colSpan={dateIndex + 1}
                        className="px-2 py-1 border text-right font-semibold"
                      >
                        Grand Total
                      </td>

                      {/* ✅ Totals */}
                      {columns.slice(dateIndex + 1).map((col, idx) => {
                        const lower = col.toLowerCase();

                        const isNumeric =
                          lower.includes("amount") ||
                          lower.includes("obligated") ||
                          lower.includes("unobligated") ||
                          lower.includes("balance");

                        return (
                          <td
                            key={idx}
                            className="px-2 py-1 border text-right"
                          >
                            {isNumeric
                              ? formatPHP(grandTotals[col] || 0)
                              : ""}
                          </td>
                        );
                      })}

                      {/* ✅ ACTION EMPTY CELL */}
                      {!isSummary && (
                        <td className="px-2 py-1 border"></td>
                      )}
                    </>
                  );
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