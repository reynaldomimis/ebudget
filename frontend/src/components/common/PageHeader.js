import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const PageHeader = ({ title, subtitle, actions, showFiscalBadge = false, center = false }) => {
  const words = title.split(' ');
  let displayTitle;

  if (words.length > 1) {
    const mainTitle = words.slice(0, -1).join(' ');
    const lastWord = words[words.length - 1];
    displayTitle = (
      <>
        {mainTitle} <span className="text-slate-300 italic">{lastWord}</span>
      </>
    );
  } else {
    displayTitle = title;
  }

  return (
    <div className={`mb-12 flex flex-col ${center ? 'items-center text-center' : 'md:flex-row md:items-end justify-between'} gap-8 animate-in fade-in slide-in-from-top-4 duration-700`}>
      <div className={`space-y-4 ${center ? 'flex flex-col items-center' : ''}`}>
        {showFiscalBadge && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] w-fit shadow-sm">
                <Calendar size={12} className="text-emerald-500" />
                FISCAL YEAR: <span className="font-black">2024</span>
                <ChevronDown size={12} className="opacity-50" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1"></div>
            </div>
        )}
        <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            {displayTitle}
            </h2>
            {subtitle && <p className={`text-slate-500 font-medium text-lg leading-relaxed mt-2 ${center ? 'max-w-2xl' : 'max-w-xl'}`}>{subtitle}</p>}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-3 pb-1">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
