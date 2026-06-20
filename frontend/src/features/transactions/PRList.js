import React, { useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Edit, RotateCcw } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { prAPI } from '../../services/api';
import { formatPHP } from '../../utils/formatters';

const PRList = ({ onCreateClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [prData, setPrData] = useState([]);

  useEffect(() => {
    fetchPRs();
  }, []);

  const fetchPRs = async () => {
    try {
      setLoading(true);
      const res = await prAPI.getAll();
      if (res.success) setPrData(res.data);
    } catch (err) {
      console.error("Failed to fetch PRs", err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'PR NO',
      accessor: 'prno',
      render: (row) => <span className="font-mono text-[12px] font-bold text-primary-700">{row.prno}</span>
    },
    {
      header: 'DATE',
      accessor: 'transaction_date',
      render: (row) => <span className="text-neutral-600 text-[12px]">{row.transaction_date ? new Date(row.transaction_date).toLocaleDateString() : 'N/A'}</span>
    },
    {
      header: 'PURPOSE',
      accessor: 'purpose',
      render: (row) => (
        <div className="max-w-[250px]">
          <p className="text-[12px] font-medium text-neutral-800 truncate">{row.purpose || "No purpose provided"}</p>
        </div>
      )
    },
    {
      header: 'AMOUNT',
      accessor: 'pr_amount',
      align: 'right',
      render: (row) => <span className="font-mono text-[12px] font-bold text-neutral-900">₱{formatPHP(row.pr_amount)}</span>
    },
    {
        header: 'OBLIGATED AMOUNT',
        accessor: 'obligated_amount',
        align: 'right',
        render: (row) => <span className="font-mono text-[12px] font-bold text-emerald-600">₱{formatPHP(row.obligated_amount)}</span>
    },
    {
        header: 'REMAINING BALANCE',
        accessor: 'remaining_balance',
        align: 'right',
        render: (row) => <span className="font-mono text-[12px] font-bold text-neutral-900">₱{formatPHP(row.remaining_balance)}</span>
    },
    {
      header: 'WORKFLOW STATUS',
      accessor: 'workflow_status',
      render: (row) => <StatusBadge status={row.workflow_status} size="sm" />
    },
    {
        header: 'BUDGET STATUS',
        accessor: 'budget_status',
        render: (row) => <StatusBadge status={row.budget_status} size="sm" />
    },
    {
      header: 'ACTIONS',
      accessor: 'id',
      render: (row) => (
        <div className="flex gap-1 justify-center">
          <button className="p-1.5 hover:bg-neutral-100 rounded text-neutral-400 hover:text-primary-600 transition-colors" title="View Details">
            <Eye size={16} />
          </button>
          <button className="p-1.5 hover:bg-neutral-100 rounded text-neutral-400 hover:text-primary-600 transition-colors" title="Edit Draft">
            <Edit size={16} />
          </button>
        </div>
      )
    },
  ];

  const filtered = prData.filter(
    (row) =>
      row.prno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    if (filtered.length === 0) return;

    const headers = ["PR No", "Date", "Purpose", "Amount", "Obligated", "Balance", "Status"];
    const rows = filtered.map(pr => [
      pr.prno,
      new Date(pr.transaction_date).toLocaleDateString(),
      pr.purpose,
      pr.pr_amount,
      pr.obligated_amount,
      pr.remaining_balance,
      pr.workflow_status
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Purchase_Requests_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Purchase Requests"
        subtitle="Manage your PR drafts and submitted requests"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm" onClick={handleExport}>Export</Button>
            <Button variant="primary" icon={Plus} size="sm" onClick={onCreateClick}>Create PR</Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[300px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search PR No. or purpose..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
            className="flex items-center gap-1.5 px-3 py-2 text-neutral-500 hover:text-neutral-800 transition-colors"
            onClick={() => setSearchTerm('')}
        >
            <RotateCcw size={14} />
            <span className="text-xs font-bold uppercase">Reset</span>
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
