import React from 'react';

const statusConfig = {
  // Workflow Statuses
  'Draft': { bg: 'bg-neutral-100', text: 'text-neutral-600' },
  'For Review': { bg: 'bg-amber-50', text: 'text-amber-700' },
  'For Approval': { bg: 'bg-blue-50', text: 'text-blue-700' },
  'Reviewed': { bg: 'bg-blue-50', text: 'text-blue-700' },
  'Approved': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  'Rejected': { bg: 'bg-rose-50', text: 'text-rose-700' },
  'Partially Obligated': { bg: 'bg-blue-50', text: 'text-blue-700' },
  'Obligated': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  'Returned': { bg: 'bg-amber-50', text: 'text-amber-800' },
  'Cancelled': { bg: 'bg-neutral-100', text: 'text-neutral-500' },

  // Budget Statuses (Dynamic from view)
  'NOT_OBLIGATED': { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Not Obligated' },
  'PARTIALLY_OBLIGATED': { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Partially Obligated' },
  'FULLY_OBLIGATED': { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Fully Obligated' },
};

const StatusBadge = ({ status, size = 'md', showDot = false }) => {
  const config = statusConfig[status] || { bg: 'bg-neutral-100', text: 'text-neutral-600', label: status };
  const displayLabel = config.label || status;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={`inline-flex items-center font-bold rounded-full ${config.bg} ${config.text} ${sizeClasses[size]} uppercase tracking-tight`}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.text.replace('text', 'bg')}`} />
      )}
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
