import React, { useState, useMemo } from "react";
import Dropdown from "./Dropdown";
import { columnConfig, officeNames, programMap } from "../../utils/helper";
import { convertToThousands, formatPHP } from "../../utils/formatters";

const GroupedTable = ({
  data,
  tableLabel = "Table",
  interactive = false,
  onRowClick,
  hideFilters = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [level1, setLevel1] = useState("");
  const [mainProgram, setMainProgram] = useState("");
  const [subProgram, setSubProgram] = useState("");

  // ---------------- FILTER ----------------
  const filteredData = useMemo(() => {
    let tempData = data;
    if (level1 === "Program" && mainProgram)
      tempData = tempData.filter((row) => row.pap_type === mainProgram);
    if (level1 === "Office" && mainProgram)
      tempData = tempData.filter((row) => row.division === mainProgram);
    if (subProgram)
      tempData = tempData.filter((row) => row.pap_des === subProgram);
    if (!searchTerm) return tempData;

    return tempData.filter((row) =>
      Object.values(row).some(
        (val) =>
          val &&
          val.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
  }, [data, searchTerm, level1, mainProgram, subProgram]);

  // ---------------- GROUP + FLATTEN ----------------
  const flattened = useMemo(() => {
    const grouped = {};

    filteredData.forEach((row) => {
      const papType = row.pap_type || "Unknown PAP Type";
      const papDes = row.pap_des || "Unknown PAP Description";

      if (!grouped[papType]) grouped[papType] = {};
      if (!grouped[papType][papDes]) grouped[papType][papDes] = [];

      grouped[papType][papDes].push(row);
    });

    const flat = [];

    Object.keys(grouped).forEach((papType) => {
      flat.push({ id: `header-${papType}`, isHeader: true, title: papType });

      Object.keys(grouped[papType]).forEach((papDes) => {
        flat.push({
          id: `sub-${papType}-${papDes}`,
          isSubHeader: true,
          title: papDes,
        });

        const rows = grouped[papType][papDes];
        const normalRows = rows.filter((r) => !r.is_subtotal);
        const subtotalRows = rows.filter((r) => r.is_subtotal);

        if (level1 === "Program" || level1 === "") {
          // Show all normal + subtotal rows
          flat.push(...normalRows);
          flat.push(...subtotalRows);
        } else if (level1 === "Office") {
          // Show only normal rows; grand total added later
          flat.push(...normalRows);
        }
      });

      // Add Grand Total row for Office view
      if (level1 === "Office") {
        const allRowsInOffice = Object.values(grouped[papType]).flat();
        const totalFqSum = allRowsInOffice.reduce(
          (acc, r) => acc + (Number(r.totalFq) || 0),
          0,
        );

        flat.push({
          id: `grandtotal-${papType}`,
          is_subtotal: true,
          sub_total_name: "Grand Total",
          totalFq: totalFqSum,
        });
      }
    });

    return flat;
  }, [filteredData, level1]);

  // ---------------- CELL RENDER ----------------
  const renderCell = (row, col) => {
    const rawValue = row?.[col.key] ?? "";

    const numericKeys = [
      "pt1",
      "pt2",
      "pt3",
      "pt4",
      "totalPt",
      "fq1",
      "fq2",
      "fq3",
      "fq4",
      "totalFq",
    ];

    const fqKeys = ["fq1", "fq2", "fq3", "fq4", "totalFq"];

    const alignClass =
      col.align === "center"
        ? "text-center"
        : col.align === "right"
          ? "text-right"
          : "text-left";

    const displayValue = numericKeys.includes(col.key)
      ? Number(rawValue) > 0
        ? fqKeys.includes(col.key)
          ? interactive
            ? formatPHP(rawValue)
            : convertToThousands(rawValue)
          : rawValue
        : ""
      : rawValue;

    return (
      <td
        key={col.key}
        className={`px-1 py-1 text-[11px] border-r border-gray-100 align-top ${alignClass}`}
        style={{
          width: col.width,
          minWidth: col.width,
          maxWidth: col.width,
          color: col.textColor || "",
          fontWeight: col.fontWeight || "normal",
          paddingRight: col.paddingRight,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          verticalAlign: "top",
        }}
      >
        {displayValue}
      </td>
    );
  };

  // ---------------- RENDER ----------------
  return (
    <div className="flex flex-col h-full w-full">
      {/* HEADER */}

      <div className="flex w-full items-center py-3 pr-2">
        {!interactive && (
          <h2 className="text-sm sm:text-base font-bold text-gray-800">
            {tableLabel}
          </h2>
        )}
        {/* LEFT SIDE (filters) */}
        {interactive && !hideFilters && (
          <div className="flex flex-wrap gap-2">
            <Dropdown
              options={[
                { value: "Program", label: "Program" },
                { value: "Office", label: "Office" },
              ]}
              value={level1}
              onChange={(val) => {
                setLevel1(val);
                setMainProgram("");
                setSubProgram("");
              }}
              placeholder="Select Program or Office"
              size="small"
            />

            {level1 === "Program" && (
              <Dropdown
                options={Object.keys(programMap).map((key) => ({
                  value: key,
                  label: key,
                }))}
                value={mainProgram}
                onChange={(val) => {
                  setMainProgram(val);
                  setSubProgram("");
                }}
                placeholder="Select Main Program"
                size="small"
              />
            )}

            {level1 === "Office" && (
              <Dropdown
                options={officeNames.map((div) => ({
                  value: div,
                  label: div,
                }))}
                value={mainProgram}
                onChange={(val) => setMainProgram(val)}
                placeholder="Select Office"
              />
            )}

            {mainProgram && programMap[mainProgram] && (
              <Dropdown
                options={programMap[mainProgram].map((sub) => ({
                  value: sub,
                  label: sub,
                }))}
                value={subProgram}
                onChange={(val) => setSubProgram(val)}
                placeholder="Select Sub-Program"
              />
            )}
          </div>
        )}

        {/* RIGHT SIDE (search) */}
        {!hideFilters && (
          <div className="ml-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="pl-3 pr-2 py-1.5 border border-gray-300 rounded-md text-sm w-44"
            />
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-md flex-1 overflow-auto">
        <table className="min-w-full table-fixed bg-white">
          <thead className="bg-green-600 text-white sticky top-0 z-30">
            <tr>
              {columnConfig.map((col) => (
                <th
                  key={col.key}
                  className="px-2 py-2 text-xs font-semibold text-center border-r border-green-500"
                  style={{
                    width: col.width,
                    minWidth: col.width,
                    maxWidth: col.width,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {flattened.length === 0 && (
              <tr>
                <td
                  colSpan={columnConfig.length}
                  className="py-6 text-center text-gray-500"
                >
                  No data found.
                </td>
              </tr>
            )}

            {flattened.map((row, idx) => {
              const isNNMP =
                row.pap_des?.toUpperCase() ===
                "NATIONAL NUTRITION MANAGEMENT PROGRAM";

              // 🔹 HEADER
              if (row.isHeader) {
                return (
                  <tr
                    key={`header-${row.id}`}
                    className="bg-gray-600 text-white font-bold sticky z-20"
                    style={{ top: "32px" }}
                  >
                    <td
                      colSpan={columnConfig.length}
                      className="px-3 py-1 text-xs"
                    >
                      {row.title}
                    </td>
                  </tr>
                );
              }

              // 🔹 SUB HEADER (FIXED: single row only)
              if (row.isSubHeader) {
                return (
                  <tr
                    key={`sub-${row.id}`}
                    className="bg-gray-400 text-white font-medium sticky z-10"
                    style={{ top: "56px" }}
                  >
                    <td
                      colSpan={columnConfig.length}
                      className="px-3 py-1 text-xs"
                    >
                      {row.title}
                    </td>
                  </tr>
                );
              }

              // 🔹 SUBTOTAL
              if (row.is_subtotal) {
                const totalFqIndex = columnConfig.findIndex(
                  (c) => c.key === "totalFq",
                );

                return (
                  <tr
                    key={`subtotal-${row.id || idx}`}
                    className={`${interactive ? "hover:bg-green-100 cursor-pointer" : ""} font-bold border-t border-b bg-gray-200 border-gray-300`}
                    onClick={
                      interactive && onRowClick
                        ? () => onRowClick(row, { isSubtotal: true })
                        : undefined
                    }
                  >
                    {columnConfig.map((col, colIdx) => {
                      if (colIdx < totalFqIndex) {
                        if (colIdx === 0)
                          return (
                            <td
                              key={col.key}
                              colSpan={totalFqIndex}
                              className="px-1 py-2 text-xs text-right"
                            >
                              {row.sub_total_name ?? "Subtotal"}
                            </td>
                          );
                        return null;
                      }

                      const hasAmount = row.totalFq > 0;

                      if (colIdx === totalFqIndex) {
                        return (
                          <td
                            key={col.key}
                            className={`px-1 py-2 pr-4 text-xs ${
                              hasAmount ? "text-right" : "text-center"
                            }`}
                          >
                            {interactive
                              ? hasAmount
                                ? formatPHP(row.totalFq)
                                : "-"
                              : convertToThousands(row.totalFq)}
                          </td>
                        );
                      }

                      return null;
                    })}
                  </tr>
                );
              }

              // 🔹 NORMAL ROW
              return (
                <tr
                  key={`row-${idx}`}
                  className={
                    interactive ? "hover:bg-green-50 cursor-pointer" : ""
                  }
                  onClick={
                    interactive && onRowClick
                      ? () => onRowClick(row)
                      : undefined
                  }
                >
                  {columnConfig.map((col) => renderCell(row, col))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GroupedTable;
