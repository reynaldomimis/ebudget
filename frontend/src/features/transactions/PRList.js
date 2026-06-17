import React, { useState } from 'react';
import { Plus, Download, Search, Eye, Edit, RotateCcw } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';

const PRList = ({ onCreateClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const columns = [
    {
      header: 'PR NO',
      accessor: 'prNo',
      render: (row) => <span className="font-mono text-[13px] font-bold text-primary-700">{row.prNo}</span>
    },
    {
      header: 'DATE',
      accessor: 'date',
      render: (row) => <span className="text-neutral-600">{row.date}</span>
    },
    {
      header: 'SUMMARY / PURPOSE',
      accessor: 'summary',
      render: (row) => (
        <div className="max-w-[300px]">
          <p className="font-medium text-neutral-800 truncate">{row.summary}</p>
          <p className="text-[10px] text-neutral-400 truncate uppercase">{row.purpose}</p>
        </div>
      )
    },
    {
      header: 'BUDGET SOURCE',
      accessor: 'budgetSource',
      render: (row) => <span className="text-[11px] font-semibold text-neutral-500">{row.budgetSource}</span>
    },
    {
      header: 'AMOUNT',
      accessor: 'amount',
      align: 'right',
      render: (row) => <span className="font-mono font-bold text-neutral-900">₱{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    },
    {
      header: 'STATUS',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
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

  const mockData = [
    { id: 1, prNo: 'PR-2024-0012', date: '05/12/2024', summary: 'Office Supplies Q4', purpose: 'For administrative use', budgetSource: '01 - Regular Agency Fund', amount: 45200.00, status: 'Draft' },
    { id: 2, prNo: 'PR-2024-0011', date: '05/11/2024', summary: 'IT Equipment', purpose: 'Replacement of old units', budgetSource: '01 - Regular Agency Fund', amount: 125000.00, status: 'For Review' },
    { id: 3, prNo: 'PR-2024-0010', date: '05/10/2024', summary: 'Janitorial Supplies', purpose: 'Monthly replenishment', budgetSource: '01 - Regular Agency Fund', amount: 15300.00, status: 'Approved' },
    { id: 4, prNo: 'PR-2024-0009', date: '05/08/2024', summary: 'Fuel & Oil', purpose: 'Fleet consumption', budgetSource: '01 - Regular Agency Fund', amount: 85000.00, status: 'Rejected' },
    { id: 5, prNo: 'PR-2024-0008', date: '05/05/2024', summary: 'Security Services', purpose: 'Quarterly payment', budgetSource: '07 - Trust Receipts', amount: 320000.00, status: 'Obligated' },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Procurement Requests"
        subtitle="Manage your PR drafts and submitted requests"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Export</Button>
            <Button variant="primary" icon={Plus} size="sm" onClick={onCreateClick}>Create PR</Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[300px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search PR No. or description..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100">
          <option>All Status</option>
          <option>Draft</option>
          <option>For Review</option>
          <option>Approved</option>
          <option>Obligated</option>
        </select>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Date Range</span>
           <input
             type="date"
             className="bg-white border border-neutral-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-100"
             value={startDate}
             onChange={(e) => setStartDate(e.target.value)}
           />
           <span className="text-neutral-300">-</span>
           <input
             type="date"
             className="bg-white border border-neutral-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-100"
             value={endDate}
             onChange={(e) => setEndDate(e.target.value)}
           />
        </div>
        <button
            className="flex items-center gap-1.5 px-3 py-2 text-neutral-500 hover:text-neutral-800 transition-colors"
            onClick={() => {setSearchTerm(''); setStartDate(''); setEndDate('');}}
        >
            <RotateCcw size={14} />
            <span className="text-xs font-bold uppercase">Reset</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={mockData}
        pagination={{
          currentPage: 1,
          totalPages: 1,
          totalItems: 5,
          onPageChange: () => {}
        }}
      />
    </div>
  );
};

export default PRList;
