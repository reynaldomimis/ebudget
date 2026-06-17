import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const DataTable = ({
  columns,
  data,
  isLoading,
  onRowClick,
  emptyState,
  pagination = { currentPage: 1, totalPages: 1, totalItems: 0, onPageChange: () => {} }
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="animate-pulse">
          <div className="h-10 bg-neutral-50 border-b border-neutral-100"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-neutral-100 flex items-center px-6 gap-4">
              <div className="h-4 bg-neutral-100 rounded w-1/4"></div>
              <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
              <div className="h-4 bg-neutral-100 rounded w-1/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return emptyState || (
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-12 text-center">
        <p className="text-neutral-500">No records found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-neutral-50 text-neutral-600 text-[11px] uppercase tracking-wider font-semibold border-b border-neutral-200">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-3 whitespace-nowrap ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors group ${onRowClick ? 'cursor-pointer hover:bg-neutral-50' : ''}`}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-6 py-4 text-sm ${col.align === 'right' ? 'text-right font-mono' : 'text-neutral-800'}`}
                  >
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-neutral-100 bg-white flex items-center justify-between">
        <span className="text-sm text-neutral-500">
          Showing <span className="font-medium text-neutral-900">{(pagination.currentPage - 1) * 15 + 1}</span> to <span className="font-medium text-neutral-900">{Math.min(pagination.currentPage * 15, pagination.totalItems)}</span> of <span className="font-medium text-neutral-900">{pagination.totalItems}</span> results
        </span>

        <div className="flex items-center gap-2">
          <button
            disabled={pagination.currentPage === 1}
            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            className="p-1.5 rounded border border-neutral-200 text-neutral-600 disabled:opacity-50 hover:bg-neutral-50"
          >
            <ChevronLeft size={18} />
          </button>

          {[...Array(pagination.totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => pagination.onPageChange(i + 1)}
              className={`w-8 h-8 rounded text-sm font-medium transition-colors ${pagination.currentPage === i + 1 ? 'bg-primary-600 text-white' : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            className="p-1.5 rounded border border-neutral-200 text-neutral-600 disabled:opacity-50 hover:bg-neutral-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
