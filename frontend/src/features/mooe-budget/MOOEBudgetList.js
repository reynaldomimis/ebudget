import React, { useState } from 'react';
import { Plus, Download, Search, Filter, Eye, ShoppingCart, FilePlus, RotateCcw } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';

const MOOEBudgetList = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const columns = [
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">{row.category}</span>
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
      header: 'Available for PR',
      accessor: 'availableForPR',
      align: 'right',
      render: (row) => <span className="font-mono font-bold text-success-700">{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(row.availableForPR)}</span>
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
          <button className="p-1.5 hover:bg-neutral-100 rounded text-neutral-400 hover:text-primary-600 transition-colors" title="Create PR">
            <ShoppingCart size={16} />
          </button>
          <button className="p-1.5 hover:bg-neutral-100 rounded text-neutral-400 hover:text-success-600 transition-colors" title="Direct Obligation">
            <FilePlus size={16} />
          </button>
        </div>
      )
    },
  ];

  const mockData = [
    { id: 1, category: 'Office Supplies', description: 'Office Supplies - General', allocated: 250000, obligated: 125000, availableForPR: 80000, status: 'Active' },
    { id: 2, category: 'Utilities', description: 'Electricity Expenses', allocated: 800000, obligated: 450000, availableForPR: 200000, status: 'Active' },
    { id: 3, category: 'Utilities', description: 'Water Expenses', allocated: 120000, obligated: 45000, availableForPR: 50000, status: 'Active' },
    { id: 4, category: 'Communication', description: 'Telephone Expenses - Landline', allocated: 80000, obligated: 35000, availableForPR: 20000, status: 'Active' },
    { id: 5, category: 'Training', description: 'Training & Seminar Expenses', allocated: 1500000, obligated: 320000, availableForPR: 900000, status: 'Active' },
  ];

  const totalAllocated = 3200500.00;
  const totalObligated = 1120000.00;
  const activePRs = 450000.00;
  const utilization = (totalObligated / totalAllocated) * 100;

  return (
    <div className="space-y-3">
      <PageHeader
        path="Budget / MOOE Budget"
        title="MOOE Budget"
        subtitle="Maintenance and Other Operating Expenses"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Export</Button>
            <Button variant="primary" icon={Plus} size="sm">Import Budget</Button>
          </div>
        }
      />

      {/* Budget Summary Bar (Phase 3 Specification) */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
          <div className="p-2.5 bg-neutral-50/30">
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Total Allocated</p>
            <p className="text-lg font-bold font-mono text-neutral-900 tracking-tighter">₱3,200,500.00</p>
          </div>
          <div className="p-2.5">
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Total Obligated</p>
            <p className="text-lg font-bold font-mono text-primary-700 tracking-tighter">₱1,120,000.00</p>
          </div>
          <div className="p-2.5">
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Active PRs</p>
            <p className="text-lg font-bold font-mono text-warning-600 tracking-tighter">₱450,000.00</p>
          </div>
          <div className="p-2.5">
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Rem. Balance</p>
            <p className="text-lg font-bold font-mono text-success-700 tracking-tighter">₱1,630,500.00</p>
          </div>
          <div className="p-2.5 bg-primary-900 text-white">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[9px] font-bold text-primary-200 uppercase tracking-widest">Utilization</p>
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
            placeholder="Search category or item description..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100">
          <option>All Categories</option>
          <option>Office Supplies</option>
          <option>Utilities</option>
          <option>Training</option>
        </select>
        <select className="bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100">
          <option>All Periods</option>
          <option>Q1</option>
          <option>Q2</option>
          <option>Q3</option>
          <option>Q4</option>
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

export default MOOEBudgetList;
