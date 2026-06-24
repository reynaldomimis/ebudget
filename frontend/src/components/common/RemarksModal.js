import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, MessageSquare, AlertCircle } from 'lucide-react';

const RemarksModal = ({
    isOpen,
    onClose,
    onSubmit,
    title = "Purchase Request Rejection",
    subtitle = "Technical Review Feedback",
    placeholder = "Provide technical reasons for rejection...",
    buttonLabel = "Confirm Rejection"
}) => {
  const [remarks, setRemarks] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(remarks);
    setRemarks("");
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Glass Backdrop - Adjusted blur as requested */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[6px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container - Matching eBudget Detail Style */}
      <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out">

        {/* Header - Matching PR Details Header Style */}
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">{title}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
                setRemarks("");
                onClose();
            }}
            className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="relative">
            <div className="absolute top-4 left-4 text-slate-300">
                <MessageSquare size={18} />
            </div>
            <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={placeholder}
                className="w-full h-40 pl-11 pr-5 py-4 bg-slate-50/50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-purple-50 focus:border-purple-200 transition-all resize-none placeholder:text-slate-300 placeholder:italic"
                autoFocus
            />
          </div>
        </div>

        {/* Footer - Matching PR Details Button Style */}
        <div className="px-8 pb-8">
          <button
            onClick={handleSubmit}
            disabled={!remarks.trim()}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RemarksModal;
