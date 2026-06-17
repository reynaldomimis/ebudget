import React from 'react';

const statusConfig = {
  'Draft': { bg: 'bg-neutral-100', text: 'text-neutral-600' },
  'For Review': { bg: 'bg-warning-50', text: 'text-warning-700' },
  'For Approval': { bg: 'bg-info-50', text: 'text-info-700' },
  'Approved': { bg: 'bg-success-50', text: 'text-success-700' },
  'Rejected': { bg: 'bg-danger-50', text: 'text-danger-700' },
  'Returned': { bg: 'bg-warning-50', text: 'text-warning-800' },
  'Obligated': { bg: 'bg-primary-50', text: 'text-primary-700' },
  'Cancelled': { bg: 'bg-neutral-100', text: 'text-neutral-500' },
};

const StatusBadge = ({ status, size = 'md', showDot = false }) => {
  const config = statusConfig[status] || statusConfig['Draft'];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-sm ${config.bg} ${config.text} ${sizeClasses[size]}`}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.text.replace('text', 'bg')}`} />
      )}
      {status}
    </span>
  );
};

export default StatusBadge;
