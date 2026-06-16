import React, { useState, useMemo } from "react";
import { formatAmount } from "../../utils/formatters";
import SearchInput from "./SearchInput";
import { getKeyFromLabel } from "../../utils/helper";

const PSTable = ({ data, tableLabel = "Retrieved PS Records", fundSource = "" }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const isRLIPSource = fundSource.includes("RLIP");

  // Check both pap_type and pap_des for RLIP keyword
  const getSection = (row) => {
    const type = (row.pap_type || "").toUpperCase();
    const des = (row.pap_des || "").toUpperCase();
    const isRLIP = type.includes("RLIP") || des.includes("RLIP") || type.includes("RETIREMENT AND LIFE INSURANCE");
    return isRLIP ? "RLIP" : "PS";
  };

  const processedRows = useMemo(() => {
    // 0. Filter by Fund Source first: only rows belonging to the selected source
    let validItems = data.filter(item => {
        // Items must have a name/expense item and shouldn't be existing headers
        const isItem = (item.expense_items || item.name) && !item.isHeader && !item.isSubHeader;
        if (!isItem) return false;

        const section = getSection(item);
        return isRLIPSource ? section === "RLIP" : section === "PS";
    });

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      validItems = validItems.filter(r =>
        (r.expense_items || "").toLowerCase().includes(s) ||
        (r.pap_des || "").toLowerCase().includes(s) ||
        (r.pap_type || "").toLowerCase().includes(s)
      );
    }

    const rows = [];
    const grouped = {};

    // 1. Group by pap_type (Major) -> then by pap_des_code (Sub)
    validItems.forEach(item => {
      const type = item.pap_type || "GENERAL ADMINISTRATION AND SUPPORT";
      const code = item.pap_des_code || "";
      const des = item.pap_des || "";

      if (!grouped[type]) grouped[type] = {};

      // Use code as the key for the sub-group
      const groupKey = code || des || "Miscellaneous";

      if (!grouped[type][groupKey]) {
        grouped[type][groupKey] = {
          code: code,
          description: des,
          items: []
        };
      }
      grouped[type][groupKey].items.push(item);
    });

    let totalPS = 0;
    let totalRLIP = 0;

    // 2. Build rows with subtotals
    Object.keys(grouped).forEach(papType => {
      rows.push({ name: papType, isHeader: true });

      let categorySubtotal = 0;
      // Use the first item in the group to determine the section (PS or RLIP)
      const firstItem = Object.values(grouped[papType])[0].items[0];
      const section = getSection(firstItem);

      Object.keys(grouped[papType]).forEach(code => {
        const group = grouped[papType][code];
        rows.push({ name: `${code} ${group.description}`, isSubHeader: true });

        let codeSubtotal = 0;
        group.items.forEach(item => {
          const amt = parseFloat(item.total_amount || item.total || 0);
          codeSubtotal += amt;
          rows.push({
            ...item,
            name: item.expense_items,
            total_amount: amt,
            isItem: true
          });
        });

        categorySubtotal += codeSubtotal;
        // Sub-total row per code
        rows.push({
          name: `Sub-total, ${code}`,
          total_amount: codeSubtotal,
          isCodeSubtotal: true
        });
      });

      // Sub-total row per category (GAS, OPERATIONS, etc)
      const label = getKeyFromLabel(papType);
      rows.push({
        name: `Sub-Total, ${label}`,
        total_amount: categorySubtotal,
        isCategorySubtotal: true
      });

      if (section === "PS") totalPS += categorySubtotal;
      else totalRLIP += categorySubtotal;
    });

    // 3. Section Totals
    if (isRLIPSource) {
        if (totalRLIP > 0) {
            rows.push({ name: "Total, RLIP", total_amount: totalRLIP, isSectionTotal: true });
        }
    } else {
        if (totalPS > 0) {
            rows.push({ name: "Total, PS", total_amount: totalPS, isSectionTotal: true });
        }
    }

    return rows;
  }, [data, searchTerm, isRLIPSource]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex w-full items-center justify-between py-3 pr-2 bg-white">
        <h2 className="text-sm sm:text-base font-bold text-gray-800 ml-4">
          {tableLabel}
        </h2>
        <div className="w-64">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search PS items..." />
        </div>
      </div>

      <div className="bg-white shadow-md flex-1 overflow-auto border border-gray-200">
        <table className="min-w-full table-fixed bg-white border-collapse">
          <thead className="bg-green-600 text-white sticky top-0 z-30">
            <tr>
              <th className="px-2 py-2 text-xs font-semibold text-center border-r border-green-500 w-[70%]">
                PARTICULARS
              </th>
              <th className="px-2 py-2 text-xs font-semibold text-center w-[30%]">
                TOTAL
              </th>
            </tr>
          </thead>

          <tbody>
            {processedRows.length === 0 ? (
              <tr>
                <td colSpan="2" className="py-6 text-center text-gray-500 text-xs">No data found.</td>
              </tr>
            ) : (
              processedRows.map((row, idx) => {
                const name = row.name || "";
                const amount = row.total_amount || 0;

                // Major Header (GAS / OPERATIONS)
                if (row.isHeader) {
                  return (
                    <tr key={idx} className="bg-gray-600 text-white font-bold sticky z-20">
                      <td colSpan="2" className="px-3 py-1 text-[11px] uppercase">{name}</td>
                    </tr>
                  );
                }

                // Sub Header (Code + Description)
                if (row.isSubHeader) {
                  return (
                    <tr key={idx} className="bg-gray-400 text-white font-medium sticky z-10 border-b border-gray-500">
                      <td colSpan="2" className="px-3 py-1 text-[11px] underline font-bold">{name}</td>
                    </tr>
                  );
                }

                // Sub-total per code
                if (row.isCodeSubtotal) {
                    return (
                      <tr key={idx} className="bg-white border-b-2 border-black font-bold">
                        <td className="px-10 py-1 text-[11px] text-left">{name}</td>
                        <td className="px-4 py-1 text-[11px] text-right">{formatAmount(amount)}</td>
                      </tr>
                    );
                }

                // Sub-total per category (GAS/OPERATIONS) - Blue Text Style
                if (row.isCategorySubtotal) {
                  return (
                    <tr key={idx} className="bg-white border-b border-gray-200 font-bold text-blue-700">
                      <td className="px-3 py-1 text-[11px] uppercase">{name}</td>
                      <td className="px-4 py-1 text-[11px] text-right border-t border-black">{formatAmount(amount)}</td>
                    </tr>
                  );
                }

                // Section Total (Total PS / Total RLIP) - Yellow BG
                if (row.isSectionTotal) {
                  return (
                    <tr key={idx} className="bg-yellow-300 border-y-2 border-black font-extrabold">
                      <td className="px-3 py-1 text-[12px]">{name}</td>
                      <td className="px-4 py-1 text-[12px] text-right">{formatAmount(amount)}</td>
                    </tr>
                  );
                }

                // Grand Total - Light Green BG
                if (row.isGrandTotal) {
                  return (
                    <tr key={idx} className="bg-[#d1e7dd] border-y-2 border-black font-extrabold text-blue-900">
                      <td className="px-3 py-2 text-[13px]">{name}</td>
                      <td className="px-4 py-2 text-[13px] text-right border-double border-t-4 border-black">{formatAmount(amount)}</td>
                    </tr>
                  );
                }

                // Normal Item
                return (
                  <tr key={idx} className="hover:bg-green-50 border-b border-gray-100">
                    <td className="px-3 py-1 text-[11px] border-r border-gray-100 text-gray-700 pl-8">
                      {name}
                    </td>
                    <td className="px-4 py-1 text-[11px] text-right text-gray-800">
                      {amount > 0 ? formatAmount(amount) : "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PSTable;
