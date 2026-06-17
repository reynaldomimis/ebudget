import React, { useState } from 'react';
import { Plus, Download, Search, Eye, RotateCcw, FileCheck, Filter, FileText } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';

const ObligationList = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const columns = [
    {
      header: 'OBLIGATION NO',
      accessor: 'obNo',
      render: (row) => <span className="font-mono text-[13px] font-bold text-primary-700">{row.obNo}</span>
    },
    {
      header: 'DATE',
      accessor: 'date',
      render: (row) => <span className="text-neutral-600">{row.date}</span>
    },
    {
      header: 'BUDGET SOURCE',
      accessor: 'source',
      render: (row) => (
        <div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mr-1.5 ${row.type === 'PS' ? 'bg-indigo-50 text-indigo-600' : 'bg-cyan-50 text-cyan-600'}`}>
            {row.type}
          </span>
          <span className="text-xs font-medium text-neutral-800">{row.source}</span>
        </div>
      )
    },
    {
      header: 'PAYEE / SUPPLIER',
      accessor: 'payee',
      render: (row) => <span className="text-neutral-700 font-medium">{row.payee}</span>
    },
    {
      header: 'AMOUNT',
      accessor: 'amount',
      align: 'right',
      render: (row) => <span className="font-mono font-bold text-neutral-900">{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(row.amount)}</span>
    },
    {
      header: 'OFFICE',
      accessor: 'office',
      render: (row) => <span className="text-[11px] font-semibold text-neutral-500">{row.office}</span>
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
        <div className="flex gap-1">
          <button className="p-1.5 hover:bg-neutral-100 rounded text-neutral-400 hover:text-primary-600 transition-colors" title="View Details">
            <Eye size={16} />
          </button>
        </div>
      )
    },
  ];

  const mockData = [
    { id: 1, obNo: 'OB-2024-1054', date: '05/12/2024', type: 'MOOE', source: 'Office Supplies', payee: 'National Bookstore', amount: 15400.00, office: 'Finance Division', status: 'Obligated' },
    { id: 2, obNo: 'OB-2024-1053', date: '05/10/2024', type: 'PS', source: 'Basic Salary', payee: 'Various Employees', amount: 1250000.00, office: 'Administrative Div', status: 'Obligated' },
    { id: 3, obNo: 'OB-2024-1052', date: '05/08/2024', type: 'MOOE', source: 'Electricity', payee: 'Meralco', amount: 45200.00, office: 'General Services', status: 'Obligated' },
    { id: 4, obNo: 'OB-2024-1051', date: '05/05/2024', type: 'MOOE', source: 'Janitorial Services', payee: 'CleanMaster Inc.', amount: 12500.00, office: 'General Services', status: 'Obligated' },
    { id: 5, obNo: 'OB-2024-1050', date: '05/02/2024', type: 'PS', source: 'PERA', payee: 'Various Employees', amount: 450000.00, office: 'Administrative Div', status: 'Obligated' },
  ];

  return (
    <div className="space-y-3">
      <PageHeader
        path="Transactions / Obligation Register"
        title="Obligation Register"
        subtitle="Full list of all obligated budget items"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Export</Button>
            <Button variant="primary" icon={Plus} size="sm" onClick={() => onNavigate('create-obligation')}>Create Obligation</Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search OB No, Payee or Source..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100">
          <option>All Fund Types</option>
          <option>PS - Personal Services</option>
          <option>MOOE - Operating Expenses</option>
        </select>
        <select className="bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100">
          <option>All Offices</option>
          <option>Finance Division</option>
          <option>Administrative Div</option>
        </select>
        <div className="flex items-center gap-2">
           <span className="text-xs font-bold text-neutral-400 uppercase">Date Range</span>
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
        <Button variant="ghost" size="sm" icon={RotateCcw}>Reset</Button>
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

export default ObligationList;
