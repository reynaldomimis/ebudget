import React, { useState, useEffect } from "react";
import { Plus, Download, Search, Eye, Edit, RotateCcw } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import Button from "../../components/common/Button";
import { obligationAPI } from "../../services/api";
import { formatPHP } from "../../utils/formatters";

const ObligationList = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [obData, setObData] = useState([]);

  useEffect(() => {
    fetchObligations();
  }, []);

  const fetchObligations = async () => {
    try {
      setLoading(true);
      const res = await obligationAPI.getAll();
      if (res.success) setObData(res.data || []);
    } catch (err) {
      console.error("Failed to fetch obligations", err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: "OBR NO",
      accessor: "obrno",
      render: (row) => (
        <span className="font-mono text-[12px] font-semibold text-blue-700">
          {row.obrno}
        </span>
      ),
    },
    {
      header: "DATE",
      accessor: "transaction_date",
      render: (row) => (
        <span className="text-[12px] text-slate-500">
          {row.transaction_date ? new Date(row.transaction_date).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      header: "PR NO",
      accessor: "prno",
      render: (row) => (
        <span className="font-mono text-[11px] text-slate-600">
          {row.prno || "N/A"}
        </span>
      ),
    },
    {
      header: "PAYEE",
      accessor: "payee",
      render: (row) => (
        <span className="text-[12px] font-medium text-slate-700">
          {row.payee || "N/A"}
        </span>
      ),
    },
    {
      header: "AMOUNT",
      accessor: "amount",
      align: "right",
      render: (row) => (
        <span className="font-mono text-[12px] font-semibold text-slate-800">
          ₱{formatPHP(row.amount)}
        </span>
      ),
    },
    {
        header: "PR AMOUNT",
        accessor: "pr_amount",
        align: "right",
        render: (row) => (
          <span className="font-mono text-[11px] text-slate-500">
            {row.pr_amount ? `₱${formatPHP(row.pr_amount)}` : 'N/A'}
          </span>
        ),
    },
    {
        header: "TOTAL OBLIGATED",
        accessor: "total_obligated",
        align: "right",
        render: (row) => (
          <span className="font-mono text-[11px] text-emerald-600">
            {row.total_obligated ? `₱${formatPHP(row.total_obligated)}` : 'N/A'}
          </span>
        ),
    },
    {
        header: "REMAINING",
        accessor: "remaining_balance",
        align: "right",
        render: (row) => (
          <span className="font-mono text-[11px] text-slate-500">
            {row.remaining_balance !== undefined ? `₱${formatPHP(row.remaining_balance)}` : 'N/A'}
          </span>
        ),
    },
    {
      header: "ACTIONS",
      accessor: "id",
      render: (row) => (
        <div className="flex gap-1">
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="View Details"
          >
            <Eye size={15} />
          </button>
        </div>
      ),
    },
  ];

  const filtered = obData.filter(
    (row) =>
      (row.obrno || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.prno || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.payee || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        path="Transactions / Obligations"
        title="Budget Obligations"
        subtitle="View and manage official OBR transactions"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">
              Export
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              size="sm"
              onClick={() => onNavigate("create-obligation")}
            >
              New Obligation
            </Button>
          </div>
        }
      />

      <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search OBR No, PR No, or Payee…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          />
        </div>

        <button
          onClick={() => setSearchTerm("")}
          className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400 hover:text-slate-700 transition-colors"
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
      />
    </div>
  );
};

export default ObligationList;
