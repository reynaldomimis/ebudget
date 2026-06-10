import React from "react";

const TableRow = ({ data, columns, onClick = null, isSubtotal = false }) => {
  const rowClasses = `
    ${isSubtotal ? "bg-gray-50 font-semibold" : ""}
    ${onClick ? "cursor-pointer hover:bg-gray-50" : ""}
    transition-colors duration-150
  `;

  return (
    <tr className={rowClasses} onClick={onClick}>
      {columns.map((column, index) => {
        const isParticular =
          column === "particular" || column === "particulars";

        // Alignment logic
        let alignmentClass = "";
        if (index === 0)
          alignmentClass = "text-left"; // first column left
        else if (column === "date")
          alignmentClass = "text-center"; // date column center
        else alignmentClass = "text-right"; // other columns right

        return (
          <td
            key={index}
            className={`
              px-3 py-1.5 text-[11px] text-gray-900 ${alignmentClass}
              ${
                isParticular
                  ? "whitespace-normal break-words"
                  : "whitespace-nowrap overflow-hidden truncate"
              }
              ${isSubtotal ? "" : "border border-gray-200"}
            `}
            style={{
              maxWidth: isParticular
                ? "420px"
                : column === "date"
                  ? "80px"
                  : "160px",
            }}
            title={!isParticular ? data[column] : undefined}
          >
            {data[column] || ""}
          </td>
        );
      })}
    </tr>
  );
};

export default TableRow;
