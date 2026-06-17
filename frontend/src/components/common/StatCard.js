import React from 'react';

const StatCard = ({ label, value, icon: Icon, accentColor, trend, onClick, isCurrency = false }) => {
  const formattedValue = isCurrency
    ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
    : value;

  return (
    <div
      onClick={onClick}
      className={`bg-white p-4 rounded-lg border border-neutral-200 shadow-sm transition-all duration-150 ${onClick ? 'cursor-pointer hover:border-primary-300 hover:shadow-md' : ''}`}
      style={{ borderLeftWidth: '4px', borderLeftColor: accentColor }}
    >
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-neutral-400 mb-0.5 uppercase tracking-widest">{label}</p>
          <h3 className="text-lg xl:text-xl font-bold font-mono text-neutral-900 truncate tracking-tighter leading-tight">{formattedValue}</h3>

          {trend && (
            <div className={`flex items-center mt-1 text-[10px] font-bold ${trend.direction === 'up' ? 'text-success-600' : 'text-danger-600'}`}>
              <span className="mr-0.5">{trend.direction === 'up' ? '↑' : '↓'}</span>
              <span>{trend.value}%</span>
              <span className="text-neutral-300 ml-1 font-medium">vs last month</span>
            </div>
          )}
        </div>

        {Icon && (
          <div className="p-1.5 bg-neutral-50 rounded-md ml-2 shrink-0">
            <Icon size={16} className="text-neutral-400" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
