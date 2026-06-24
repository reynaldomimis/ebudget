import React, { useState, useEffect } from "react";
import { Plus, Download, Search, Eye, Edit, RotateCcw, Send, CheckCircle, XCircle, Wallet, Trash2 } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import ToastService from "../../services/ToastService";
import { prAPI, monitoringAPI } from "../../services/api";
import { formatPHP } from "../../utils/formatters";

const PRList = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [prData, setPrData] = useState([]);

  useEffect(() => {
    fetchPRs();
  }, []);

  const fetchPRs = async () => {
    try {
      setLoading(true);
      const res = await monitoringAPI.getPRs();
      if (res.success) setPrData(res.data || []);
    } catch (err) {
      console.error("Failed to fetch PRs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (id) => {
    try {
      await prAPI.submit(id);
      ToastService.toastSuccess("PR submitted for review");
      fetchPRs();
    } catch (err) {
      ToastService.toastError(err.message || "Failed to submit PR");
    }
  };

  const handleApprove = async (id) => {
    try {
      await prAPI.approve(id);
      ToastService.toastSuccess("PR approved");
      fetchPRs();
    } catch (err) {
      ToastService.toastError(err.message || "Failed to approve PR");
    }
  };

  const handleReject = async (id) => {
    const remarks = window.prompt("Enter rejection remarks:");
    if (remarks === null) return;
    try {
      await prAPI.reject(id, remarks);
      ToastService.toastSuccess("PR rejected");
      fetchPRs();
    } catch (err) {
      ToastService.toastError(err.message || "Failed to reject PR");
    }
  };

  const columns = [
    {
      header: "PR NO",
      accessor: "prno",
      render: (row) => (
        <span className="font-mono text-[12px] font-semibold text-emerald-700">
          {row.prno}
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
      header: "PURPOSE",
      accessor: "purpose",
      render: (row) => (
        <div className="max-w-[200px]">
          <p className="text-[12px] font-medium text-slate-700 truncate">
            {row.purpose || "No purpose provided"}
          </p>
          {row.remarks && (
            <p className="text-[10px] text-rose-500 font-medium truncate mt-0.5">
              Ref: {row.remarks}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "AMOUNT",
      accessor: "pr_amount",
      align: "right",
      render: (row) => (
        <span className="font-mono text-[12px] font-semibold text-slate-800">
          ₱{formatPHP(row.pr_amount)}
        </span>
      ),
    },
    {
        header: "OBLIGATED",
        accessor: "obligated_amount",
        align: "right",
        render: (row) => (
          <span className="font-mono text-[12px] font-semibold text-emerald-600">
            ₱{formatPHP(row.obligated_amount)}
          </span>
        ),
    },
    {
        header: "REMAINING",
        accessor: "remaining_balance",
        align: "right",
        render: (row) => (
          <span className="font-mono text-[12px] font-semibold text-slate-800">
            ₱{formatPHP(row.remaining_balance)}
          </span>
        ),
    },
    {
      header: "WORKFLOW",
      accessor: "workflow_status",
      render: (row) => <StatusBadge status={row.workflow_status} />,
    },
    {
        header: "BUDGET",
        accessor: "budget_status",
        render: (row) => <StatusBadge status={row.budget_status} />,
    },
    {
      header: "ACTIONS",
      accessor: "id",
      render: (row) => (
        <div className="flex gap-1">
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="View Details"
          >
            <Eye size={15} />
          </button>

          {(row.workflow_status === 'Draft' || row.workflow_status === 'Rejected') && (
            <>
              <button
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Edit PR"
                onClick={() => onNavigate('edit-pr', { id: row.id })}
              >
                <Edit size={15} />
              </button>
              <button
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="Submit PR"
                onClick={() => handleSubmit(row.id)}
              >
                <Send size={15} />
              </button>
            </>
          )}

          {row.workflow_status === 'For Review' && (
             <>
               <button
                 className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                 title="Approve PR"
                 onClick={() => handleApprove(row.id)}
               >
                 <CheckCircle size={15} />
               </button>
               <button
                 className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                 title="Reject PR"
                 onClick={() => handleReject(row.id)}
               >
                 <XCircle size={15} />
               </button>
             </>
          )}

          {(row.workflow_status === 'Approved' || row.workflow_status === 'Partially Obligated') && (
            <button
              className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              title="Create Obligation"
              onClick={() => onNavigate('create-obligation', { prno: row.prno })}
            >
              <Wallet size={15} className="mr-1 inline" />
              <span className="text-[10px] font-bold uppercase">Obligate</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  const filtered = prData.filter(
    (row) =>
      (row.prno || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.purpose || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        path="Transactions / Purchase Requests"
        title="Purchase Requests"
        subtitle="Manage your PR drafts and submitted requests"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">
              Export
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              size="sm"
              onClick={() => onNavigate("create-pr")}
            >
              Create PR
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
            placeholder="Search PR No. or purpose…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
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

export default PRList;
