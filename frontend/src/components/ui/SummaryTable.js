import { useEffect, useState } from "react";
import { activitiesAPI } from "../../utils/api";
import { getKeyFromLabel } from "../../utils/helper";

const SummaryTable = ({
  office = "",
  papType = "",
  papDes = "",
  // expenseItem = "",
}) => {
  const [summaryData, setSummaryData] = useState([]);
  const [planYear, setPlanYear] = useState("");

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await activitiesAPI.getAll();
        const activities = res.data.data || [];

        // --- Filter only if filter value exists
        const filtered = activities.filter((a) => {
          const matchOffice =
            !office || a.division?.toLowerCase() === office.toLowerCase();
          const matchPapType =
            !papType || a.pap_type?.toLowerCase() === papType.toLowerCase();
          const matchPapDes =
            !papDes || a.pap_des?.toLowerCase() === papDes.toLowerCase();
          return matchOffice && matchPapType && matchPapDes;
        });

        // --- Determine plan year
        const years = [...new Set(filtered.map((a) => a.plan_year))];
        setPlanYear(years[0] || "-");

        // --- Row labels
        let rows = [
          "GENERAL ADMINISTRATION AND SUPPORT",
          "Nutrition policy, standards, plans and program development and coordination",
          "Philippine food and nutrition surveillance",
          "Promotion of good nutrition",
          "Assistance to national, local nutrition and related programs",
        ];

        // --- Split GAS into GMS & HRD if user is filtering by papDes
        if (papType?.toLowerCase() === "general administration and support") {
          if (papDes?.toLowerCase() === "general management and supervision") {
            rows = ["General Management and Supervision"];
          } else if (papDes?.toLowerCase() === "human resource development") {
            rows = ["Human Resource Development"];
          } else {
            rows = [
              "General Management and Supervision",
              "Human Resource Development",
            ];
          }
        }

        // --- Map summary data
        const mappedSummary = rows.map((label) => {
          const normalizedLabel = label.trim().toLowerCase();

          // --- Subset logic
          const subset =
            normalizedLabel === "general administration and support"
              ? filtered.filter(
                  (a) => a.pap_type?.trim().toLowerCase() === normalizedLabel,
                )
              : filtered.filter((a) => {
                  if (
                    normalizedLabel === "general management and supervision"
                  ) {
                    return (
                      a.pap_type?.toLowerCase() ===
                        "general administration and support" &&
                      a.pap_des?.toLowerCase() ===
                        "general management and supervision"
                    );
                  }
                  if (normalizedLabel === "human resource development") {
                    return (
                      a.pap_type?.toLowerCase() ===
                        "general administration and support" &&
                      a.pap_des?.toLowerCase() === "human resource development"
                    );
                  }
                  return a.pap_des?.trim().toLowerCase() === normalizedLabel;
                });

          // --- Compute PS
          const ps = parseFloat(
            subset.find((a) =>
              a.sub_total_name?.toLowerCase().includes("total, ps"),
            )?.totalFq || 0,
          );

          // --- Compute MOOE
          let mooeKey = "total, mooe";
          if (normalizedLabel === "general administration and support")
            mooeKey = "total gsm, mooe";
          else if (normalizedLabel === "general management and supervision")
            mooeKey = "sub-total, gms, mooe";
          else if (normalizedLabel === "human resource development")
            mooeKey = "sub-total, hrd, mooe";

          const mooe = parseFloat(
            subset.find((a) =>
              a.sub_total_name?.toLowerCase().includes(mooeKey.toLowerCase()),
            )?.totalFq || 0,
          );

          // --- Compute CO
          const co = parseFloat(
            subset.find((a) =>
              a.sub_total_name?.toLowerCase().includes("total, co"),
            )?.totalFq || 0,
          );

          const total = ps + mooe + co;
          return { label, ps, mooe, co, total };
        });

        // --- Add GRAND TOTAL
        const grandTotal = mappedSummary.reduce(
          (acc, r) => {
            acc.ps += r.ps;
            acc.mooe += r.mooe;
            acc.co += r.co;
            acc.total += r.total;
            return acc;
          },
          { ps: 0, mooe: 0, co: 0, total: 0 },
        );

        mappedSummary.push({ label: "GRAND TOTAL", ...grandTotal });

        setSummaryData(mappedSummary);
      } catch (err) {
        console.error("Failed to fetch records", err);
        setSummaryData([]);
      }
    };

    fetchRecords();
  }, [office, papType, papDes]);

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-1 mb-6 w-full overflow-x-auto">
      {/* Header */}
      <div className="flex justify-between">
        <p className="font-bold">SUMMARY</p>
        <p className="text-red-600 font-bold">FY {planYear}</p>
      </div>

      {/* Column Titles */}
      <div className="grid grid-cols-[200px_repeat(4,1fr)] border-y-2 border-black py-1 font-semibold w-full min-w-full">
        <span className="text-right">NAME</span>
        <span className="text-right">PS</span>
        <span className="text-right">MOOE</span>
        <span className="text-right">CO</span>
        <span className="text-right">GRAND TOTAL</span>
      </div>

      {/* Rows */}
      {(() => {
        const dataRows = summaryData.filter(
          (r) =>
            r.label.toLowerCase() !== "grand total" &&
            (r.ps > 0 || r.mooe > 0 || r.co > 0 || r.total > 0),
        );

        const grandTotalRow = summaryData.find(
          (r) => r.label.toLowerCase() === "grand total",
        );

        if (dataRows.length === 0) {
          return (
            <div className="grid grid-cols-[200px_repeat(4,1fr)] py-2 w-full">
              <span className="col-span-5 text-center text-gray-500 font-medium">
                No records found
              </span>
            </div>
          );
        }

        return dataRows.map((r) => {
          const isAssistance = r.label
            .toLowerCase()
            .includes("assistance to national");
          return (
            <div
              key={r.label}
              className={`grid grid-cols-[200px_repeat(4,1fr)] py-1 w-full ${
                isAssistance ? "border-black border-b-2" : ""
              }`}
            >
              <span>{getKeyFromLabel(r.label)}</span>
              <span className="text-right">
                {r.ps?.toLocaleString() || "-"}
              </span>
              <span className="text-right">
                {r.mooe?.toLocaleString() || "-"}
              </span>
              <span className="text-right">
                {r.co?.toLocaleString() || "-"}
              </span>
              <span className="text-right">
                {r.total?.toLocaleString() || "-"}
              </span>
            </div>
          );
        });
      })()}

      {/* Always render GRAND TOTAL */}
      {summaryData
        .filter((r) => r.label.toLowerCase() === "grand total")
        .map((r) => {
          return (
            <div
              key={r.label}
              className="grid grid-cols-[200px_repeat(4,1fr)] py-1 font-bold text-right w-full"
            >
              <span>{getKeyFromLabel(r.label)}</span>
              <span>{r.ps?.toLocaleString() || "-"}</span>
              <span>{r.mooe?.toLocaleString() || "-"}</span>
              <span>{r.co?.toLocaleString() || "-"}</span>
              <span>{r.total?.toLocaleString() || "-"}</span>
            </div>
          );
        })}
    </div>
  );
};

export default SummaryTable;
