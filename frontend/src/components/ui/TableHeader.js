import React from "react";

const TableHeader = ({ columns, theme = "green" }) => {
  return (
    <thead className="sticky top-0 z-10 bg-green-600 text-white">
      <tr>
        {columns.map((col, index) => (
          <th
            key={index}
            className="px-3 py-2 text-xs font-semibold text-center whitespace-nowrap
                       border border-green-700"
          >
            {col.toUpperCase()}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default TableHeader;