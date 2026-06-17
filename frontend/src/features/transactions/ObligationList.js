import React, { useState } from 'react';
import { Plus, Download, Search, Eye, RotateCcw } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';

const ObligationList = ({ onCreateClick }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const columns = [
    {
      header: 'OBLIGATION NO',
      accessor: 'obNo',
      render: (row) => <span className="font-mono text-[13px] font-bold text-emerald-600">{row.obNo}</span>
    },
    {
      header: 'DATE',
      accessor: 'date',
      render: (row) => <span className="text-neutral-600">{row.date}</span>
    },
    {
      header: 'BUDGET SOURCE',
      accessor: 'budgetSource',
      render: (row) => (
        <div className="flex items-center gap-2">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${row.type === 'MOOE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                {row.type}
            </span>
            <span className="text-[11px] font-semibold text-neutral-500">{row.budgetSource}</span>
        </div>
      )
    },
    {
      header: 'PAYEE / SUPPLIER',
      accessor: 'payee',
      render: (row) => <span className="text-sm font-medium text-neutral-800">{row.payee}</span>
    },
    {
      header: 'AMOUNT',
      accessor: 'amount',
      align: 'right',
      render: (row) => <span className="font-mono font-bold text-neutral-900">₱{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    },
    {
        header: 'OFFICE',
        accessor: 'office',
        render: (row) => <span className="text-[11px] font-medium text-neutral-400">{row.office}</span>
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
        </div>
      )
    },
  ];

  const mockData = [
    { id: 1, obNo: 'OB-2024-1054', date: '05/12/2024', type: 'MOOE', budgetSource: 'Office Supplies', payee: 'National Bookstore', amount: 15400.00, office: 'Finance Division', status: 'Obligated' },
    { id: 2, obNo: 'OB-2024-1053', date: '05/10/2024', type: 'PS', budgetSource: 'Basic Salary', payee: 'Various Employees', amount: 1250000.00, office: 'Administrative Div', status: 'Obligated' },
    { id: 3, obNo: 'OB-2024-1052', date: '05/08/2024', type: 'MOOE', budgetSource: 'Electricity', payee: 'Meralco', amount: 45200.00, office: 'General Services', status: 'Obligated' },
  ];

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
      <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[300px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search OB No, Payee or Source..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 min-w-[150px]">
          <option>All Fund Types</option>
          <option>MOOE</option>
          <option>PS</option>
        </select>
        <select className="bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 min-w-[150px]">
          <option>All Offices</option>
          <option>Finance Division</option>
          <option>Administrative Div</option>
          <option>General Services</option>
        </select>
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
        data={mockData}
        pagination={{
          currentPage: 1,
          totalPages: 1,
          totalItems: 3,
          onPageChange: () => {}
        }}
      />
    </div>
  );
};

export default ObligationList;
