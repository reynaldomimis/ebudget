import React, { useState } from 'react';
import { Plus, Download, Search, Filter, Eye, FilePlus, RotateCcw } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';

const PSBudgetList = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const columns = [
    {
      header: 'Object Code',
      accessor: 'objectCode',
      render: (row) => <span className="font-mono text-[13px] font-bold text-neutral-600">{row.objectCode}</span>
    },
    {
      header: 'Budget Item Description',
      accessor: 'description',
      render: (row) => <span className="font-medium text-neutral-800">{row.description}</span>
    },
    {
      header: 'Allocated',
      accessor: 'allocated',
      align: 'right',
      render: (row) => <span className="font-mono font-bold text-neutral-900">{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(row.allocated)}</span>
    },
    {
      header: 'Obligated',
      accessor: 'obligated',
      align: 'right',
      render: (row) => <span className="font-mono font-bold text-primary-700">{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(row.obligated)}</span>
    },
    {
      header: 'Balance',
      accessor: 'balance',
      align: 'right',
      render: (row) => (
        <span className={`font-mono font-bold ${row.balance < 100000 ? 'text-danger-600' : 'text-success-700'}`}>
          {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(row.balance)}
        </span>
      )
    },
    {
      header: 'Utilization',
      accessor: 'utilization',
      render: (row) => {
        const pct = (row.obligated / row.allocated) * 100;
        let color = 'bg-success-500';
        if (pct > 60) color = 'bg-warning-500';
        if (pct > 85) color = 'bg-danger-500';

        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 w-16 bg-neutral-100 rounded-full overflow-hidden">
              <div className={`h-full ${color}`} style={{ width: `${pct}%` }}></div>
            </div>
            <span className="text-[10px] font-bold text-neutral-500">{pct.toFixed(0)}%</span>
          </div>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div className="flex gap-1">
          <button className="p-1.5 hover:bg-neutral-100 rounded text-neutral-400 hover:text-primary-600 transition-colors" title="View Details">
            <Eye size={16} />
          </button>
          <button className="p-1.5 hover:bg-neutral-100 rounded text-neutral-400 hover:text-success-600 transition-colors" title="Create Obligation">
            <FilePlus size={16} />
          </button>
        </div>
      )
    },
  ];

  const mockData = [
    { id: 1, objectCode: '50101010 01', description: 'Basic Salary - Civilian', allocated: 2500000, obligated: 1200000, balance: 1300000, status: 'Active' },
    { id: 2, objectCode: '50102010 01', description: 'PERA - Civilian', allocated: 450000, obligated: 150000, balance: 300000, status: 'Active' },
    { id: 3, objectCode: '50102020 01', description: 'Representation Allowance (RA)', allocated: 120000, obligated: 60000, balance: 60000, status: 'Active' },
    { id: 4, objectCode: '50102030 01', description: 'Transportation Allowance (TA)', allocated: 120000, obligated: 60000, balance: 60000, status: 'Active' },
    { id: 5, objectCode: '50102040 01', description: 'Clothing/Uniform Allowance', allocated: 180000, obligated: 180000, balance: 0, status: 'Active' },
  ];

  const totalAllocated = 5800300.00;
  const totalObligated = 1850200.00;
  const utilization = (totalObligated / totalAllocated) * 100;

  return (
    <div className="space-y-3">
      <PageHeader
        path="Budget / PS Budget"
        title="PS Budget"
        subtitle="Personal Services Budget Allocations"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Export</Button>
            <Button variant="primary" icon={Plus} size="sm">Import Budget</Button>
          </div>
        }
      />

      {/* Budget Summary Bar (Phase 3 Specification) */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
          <div className="p-2.5 bg-neutral-50/30">
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Total Allocated</p>
            <p className="text-lg font-bold font-mono text-neutral-900 tracking-tighter">₱5,800,300.00</p>
          </div>
          <div className="p-2.5">
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Total Obligated</p>
            <p className="text-lg font-bold font-mono text-primary-700 tracking-tighter">₱1,850,200.00</p>
          </div>
          <div className="p-2.5">
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Remaining Balance</p>
            <p className="text-lg font-bold font-mono text-success-700 tracking-tighter">₱3,950,100.00</p>
          </div>
          <div className="p-2.5 bg-primary-900 text-white">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[9px] font-bold text-primary-200 uppercase tracking-widest">Utilization Rate</p>
              <p className="text-xs font-bold font-mono text-white">{utilization.toFixed(1)}%</p>
            </div>
            <div className="w-full h-1.5 bg-primary-800 rounded-full overflow-hidden">
              <div className="h-full bg-success-400 transition-all duration-500" style={{ width: `${utilization}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search budget item or object code..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100">
          <option>All Offices</option>
          <option>Office of the Director</option>
          <option>Finance Division</option>
        </select>
        <select className="bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100">
          <option>All Object Codes</option>
          <option>50101010 01</option>
          <option>50102010 01</option>
        </select>
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

export default PSBudgetList;
