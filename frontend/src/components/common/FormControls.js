import React from 'react';

const inputBaseClasses = "w-full rounded-xl border border-neutral-200 px-4 text-sm font-bold text-neutral-800 transition-all outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 disabled:opacity-50 disabled:bg-neutral-50 disabled:cursor-not-allowed placeholder:text-neutral-300 caret-emerald-600";
const heightClass = "min-h-[48px]";

export const Input = ({ className = "", disabled, ...props }) => (
  <input
    disabled={disabled}
    className={`${inputBaseClasses} ${heightClass} ${disabled ? 'cursor-not-allowed' : 'cursor-text'} ${className}`}
    {...props}
  />
);

export const Select = ({ className = "", children, disabled, ...props }) => (
  <div className="relative w-full">
    <select
      disabled={disabled}
      className={`${inputBaseClasses} ${heightClass} appearance-none pr-10 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      {...props}
    >
      {children}
    </select>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
);

export const Textarea = ({ className = "", disabled, ...props }) => (
  <textarea
    disabled={disabled}
    className={`${inputBaseClasses} py-3 min-h-[100px] ${disabled ? 'cursor-not-allowed' : 'cursor-text'} ${className}`}
    {...props}
  />
);

export const FormField = ({ label, error, children, className = "" }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && (
      <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">
        {label}
      </label>
    )}
    {children}
    {error && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase tracking-tight">{error}</p>}
  </div>
);
