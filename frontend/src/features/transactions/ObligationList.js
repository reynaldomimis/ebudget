import React, { useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, RotateCcw } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { obligationAPI } from '../../services/api';
import { formatPHP } from '../../utils/formatters';

const ObligationList = ({ onCreateClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [obData, setObData] = useState([]);

  useEffect(() => {
    fetchObligations();
  }, []);

  const fetchObligations = async () => {
    try {
      setLoading(true);
      const res = await obligationAPI.getAll();
      if (res.success) setObData(res.data);
    } catch (err) {
      console.error("Failed to fetch obligations", err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'OBR NO',
      accessor: 'obrno',
      render: (row) => <span className="font-mono text-[12px] font-bold text-blue-700">{row.obrno}</span>
    },
    {
      header: 'DATE',
      accessor: 'transaction_date',
      render: (row) => <span className="text-neutral-600 text-[12px]">{row.transaction_date ? new Date(row.transaction_date).toLocaleDateString() : 'N/A'}</span>
    },
    {
        header: 'PR NO',
        accessor: 'prno',
        render: (row) => <span className="font-mono text-[11px] font-bold text-slate-500">{row.prno || "DIRECT"}</span>
    },
    {
      header: 'PAYEE',
      accessor: 'payee',
      render: (row) => <span className="text-[12px] font-medium text-neutral-800">{row.payee || "N/A"}</span>
    },
    {
      header: 'AMOUNT',
      accessor: 'amount',
      align: 'right',
      render: (row) => <span className="font-mono text-[12px] font-bold text-neutral-900">₱{formatPHP(row.amount)}</span>
    },
    {
        header: 'PR AMOUNT',
        accessor: 'pr_amount',
        align: 'right',
        render: (row) => <span className="font-mono text-[11px] text-slate-400">{row.pr_amount ? `₱${formatPHP(row.pr_amount)}` : 'N/A'}</span>
    },
    {
        header: 'TOTAL OBLIGATED',
        accessor: 'total_obligated',
        align: 'right',
        render: (row) => <span className="font-mono text-[11px] text-emerald-600 font-bold">{row.total_obligated ? `₱${formatPHP(row.total_obligated)}` : 'N/A'}</span>
    },
    {
        header: 'REMAINING BALANCE',
        accessor: 'remaining_balance',
        align: 'right',
        render: (row) => <span className="font-mono text-[11px] text-slate-500">{row.remaining_balance !== undefined ? `₱${formatPHP(row.remaining_balance)}` : 'N/A'}</span>
    },
    {
        header: 'PR STATUS',
        accessor: 'pr_status',
        render: (row) => <StatusBadge status={row.pr_status} size="sm" />
    },
    {
      header: 'ACTIONS',
      accessor: 'id',
      render: (row) => (
        <div className="flex gap-1 justify-center">
          <button className="p-1.5 hover:bg-neutral-100 rounded text-neutral-400 hover:text-primary-600 transition-colors" title="View Details">
            <Eye size={16} />
          </button>
        </div>
      )
    },
  ];

  const filtered = obData.filter(
    (row) =>
      row.obrno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.prno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.payee?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Obligation Register"
        subtitle="Full list of all obligated budget items"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Export</Button>
            <Button variant="primary" icon={Plus} size="sm" onClick={onCreateClick}>Create Obligation</Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[300px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search OBR No, Payee or PR No..."
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

export default ObligationList;
