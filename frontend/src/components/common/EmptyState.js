import React from 'react';

const EmptyState = ({ message = "No records found." }) => {
  return (
    <div className="p-16 text-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <p className="text-sm font-medium italic tracking-wide text-slate-400">
          {message}
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
