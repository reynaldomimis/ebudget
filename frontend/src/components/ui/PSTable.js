import React, { useState, useMemo } from "react";
import { formatAmount } from "../../utils/formatters";
import SearchInput from "./SearchInput";
import { getKeyFromLabel } from "../../utils/helper";

const PSTable = ({ data, tableLabel = "Retrieved PS Records", fundSource = "" }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const processedRows = useMemo(() => {
    let items = data;

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      items = items.filter(r =>
        (r.expense_items || "").toLowerCase().includes(s) ||
        (r.pap_des || "").toLowerCase().includes(s) ||
        (r.pap_type || "").toLowerCase().includes(s) ||
        (r.name || "").toLowerCase().includes(s)
      );
    }

    const rows = [];

    // Grouping logic
    const psItems = items.filter(i => i.cost_category === "PS" && !i.isSectionHeader);
    const rlipItems = items.filter(i => i.cost_category === "RLIP" && !i.isSectionHeader);
    const rlipHeader = items.find(i => i.cost_category === "RLIP" && i.isSectionHeader);

    // 1. Process PS Items with Hierarchies
    const groupedPS = {};
    psItems.forEach(item => {
        if (item.is_header) return;
        const type = item.pap_type || "GENERAL ADMINISTRATION AND SUPPORT";
        const code = item.pap_des_code || "";
        const des = item.pap_des || "";
        if (!groupedPS[type]) groupedPS[type] = {};
        const groupKey = code || des || "Miscellaneous";
        if (!groupedPS[type][groupKey]) {
            groupedPS[type][groupKey] = { code, description: des, items: [] };
        }
        groupedPS[type][groupKey].items.push(item);
    });

    let totalPS = 0;
    Object.keys(groupedPS).forEach(type => {
        rows.push({ name: type, isHeader: true });
        let typeSubtotal = 0;

        Object.keys(groupedPS[type]).forEach(code => {
            const group = groupedPS[type][code];
            rows.push({ name: `${code} ${group.description}`, isSubHeader: true });

            let codeSubtotal = 0;
            group.items.forEach(item => {
                const amt = parseFloat(item.total_amount || item.amount || 0);
                codeSubtotal += amt;
                rows.push({
                    name: item.rawName || item.name || item.expense_items,
                    total_amount: amt,
                    isItem: true
                });
            });

            typeSubtotal += codeSubtotal;
            rows.push({
                name: `Sub-total, ${code}`,
                total_amount: codeSubtotal,
                isCodeSubtotal: true
            });
        });

        const typeKey = getKeyFromLabel(type);
        rows.push({
            name: `Sub-total, ${typeKey}`,
            total_amount: typeSubtotal,
            isCategorySubtotal: true
        });
        totalPS += typeSubtotal;
    });

    // 2. Total, PS Row (Yellow)
    if (totalPS > 0) {
        rows.push({ name: "Total, PS", total_amount: totalPS, isSectionTotal: true });
    }

    // Divider
    rows.push({ isDivider: true });

    // 3. RLIP Section
    if (rlipHeader) {
        rows.push({ name: rlipHeader.name, isRlipHeader: true });
    } else if (rlipItems.length > 0) {
        rows.push({ name: "Retirement and Life Insurance Premiums (RLIP)", isRlipHeader: true });
    }

    let totalRLIP = 0;
    rlipItems.forEach(item => {
        const amt = parseFloat(item.total_amount || item.amount || 0);
        totalRLIP += amt;
        rows.push({
            name: item.rawName || item.name,
            total_amount: amt,
            isItem: true,
            isRlipItem: true
        });
    });

    if (totalRLIP > 0) {
        rows.push({ name: "Total, RLIP", total_amount: totalRLIP, isSectionTotal: true });
    }

    // Divider
    rows.push({ isDivider: true });

    // 4. Grand Total Row (Green)
    if (totalPS > 0 || totalRLIP > 0) {
        rows.push({ name: "Grand Total, PS + RLIP", total_amount: totalPS + totalRLIP, isGrandTotal: true });
    }

    return rows;
  }, [data, searchTerm]);

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
              <th className="px-2 py-2 text-xs font-semibold text-center border-r border-green-500 w-[75%]">
                PARTICULARS
              </th>
              <th className="px-2 py-2 text-xs font-semibold text-center w-[25%]">
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

                if (row.isDivider) {
                    return <tr key={idx} className="h-4 bg-white"><td colSpan="2"></td></tr>;
                }

                if (row.isHeader) {
                    return (
                      <tr key={idx} className="bg-gray-100 border-b border-gray-300">
                        <td colSpan="2" className="px-3 py-1 text-[11px] font-black text-gray-700 uppercase">{name}</td>
                      </tr>
                    );
                }

                if (row.isSubHeader) {
                    return (
                      <tr key={idx} className="bg-white border-b border-gray-200">
                        <td colSpan="2" className="px-3 py-1 text-[11px] font-bold text-gray-600 pl-6 underline">{name}</td>
                      </tr>
                    );
                }

                if (row.isCodeSubtotal) {
                    return (
                      <tr key={idx} className="bg-white border-b border-black font-bold">
                        <td className="px-10 py-1 text-[11px] text-left">{name}</td>
                        <td className="px-4 py-1 text-[11px] text-right border-t border-black">{formatAmount(amount)}</td>
                      </tr>
                    );
                }

                if (row.isCategorySubtotal) {
                    return (
                      <tr key={idx} className="bg-white font-bold text-blue-700">
                        <td className="px-3 py-1 text-[11px] uppercase">{name}</td>
                        <td className="px-4 py-1 text-[11px] text-right border-t border-black">{formatAmount(amount)}</td>
                      </tr>
                    );
                }

                if (row.isSectionTotal) {
                    return (
                      <tr key={idx} className="bg-[#ffff00] border-y-2 border-black font-bold">
                        <td className="px-3 py-1.5 text-[12px]">{name}</td>
                        <td className="px-4 py-1.5 text-[12px] text-right">{formatAmount(amount)}</td>
                      </tr>
                    );
                }

                if (row.isRlipHeader) {
                    return (
                        <tr key={idx} className="bg-white">
                          <td colSpan="2" className="px-3 py-2 text-[11px] font-bold text-blue-800 italic">{name}</td>
                        </tr>
                    );
                }

                if (row.isGrandTotal) {
                    return (
                      <tr key={idx} className="bg-[#d9ead3] border-y-2 border-blue-800 font-bold text-blue-900">
                        <td className="px-3 py-2 text-[13px]">{name}</td>
                        <td className="px-4 py-2 text-[13px] text-right border-double border-t-2 border-blue-900">{formatAmount(amount)}</td>
                      </tr>
                    );
                }

                return (
                  <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className={`px-3 py-1 text-[11px] text-gray-700 ${row.isRlipItem ? 'pl-8 italic' : 'pl-12'}`}>
                      {name}
                    </td>
                    <td className="px-4 py-1 text-[11px] text-right text-gray-800 font-mono">
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
