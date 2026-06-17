import React, { useState } from 'react';
import { Search, Clock, User, HardDrive, Filter, Download, RotateCcw, Info, Activity, Shield } from 'lucide-react';

const AuditTrail = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const mockData = [
    { id: 1, timestamp: '2024-10-24 10:45:22', user: 'reynaldo.mimis', action: 'Imported PS Budget', module: 'IMPORT', reference: 'PS_FY2024_Q4', ip: '192.168.1.15' },
    { id: 2, timestamp: '2024-10-24 09:12:05', user: 'admin.approver', action: 'Approved Obligation', module: 'OBLIGATIONS', reference: 'OB-2024-1054', ip: '192.168.1.10' },
    { id: 3, timestamp: '2024-10-23 16:30:12', user: 'juan.delacruz', action: 'Created Purchase Request', module: 'PROCUREMENT', reference: 'PR-2024-0012', ip: '10.0.5.22' },
    { id: 4, timestamp: '2024-10-23 14:20:45', user: 'sys_admin', action: 'Archived Fiscal Year', module: 'SYSTEM', reference: 'FY2023_ARCHIVE', ip: '172.16.0.45' },
    { id: 5, timestamp: '2024-10-22 11:05:33', user: 'reynaldo.mimis', action: 'Modified Role: Encoder', module: 'SECURITY', reference: 'ROLE_MOD_01', ip: '127.0.0.1' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity log..."
            className="w-full pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all">
                <Filter size={16} /> Filters
            </button>
            <button className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all">
                <Download size={16} /> Export Audit Log
            </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
              <th className="px-10 py-6">Timestamp</th>
              <th className="px-10 py-6">User</th>
              <th className="px-10 py-6">Action</th>
              <th className="px-10 py-6">Module</th>
              <th className="px-10 py-6">Reference No.</th>
              <th className="px-10 py-6">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {mockData.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-10 py-5">
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
                        <Clock size={12} />
                        {log.timestamp}
                    </div>
                </td>
                <td className="px-10 py-5">
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-300" />
                        <span className="font-black text-slate-900 uppercase">{log.user}</span>
                    </div>
                </td>
                <td className="px-10 py-5">
                    <span className="font-bold text-slate-600">{log.action}</span>
                </td>
                <td className="px-10 py-5">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest border border-blue-100">
                        {log.module}
                    </span>
                </td>
                <td className="px-10 py-5">
                    <span className="font-mono font-bold text-blue-600">{log.reference}</span>
                </td>
                <td className="px-10 py-5 font-mono text-slate-400 text-[10px]">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-8 bg-blue-50/50 rounded-[32px] border border-blue-100 flex items-start gap-4">
          <Shield className="text-blue-500 shrink-0" size={20} />
          <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Security Notice</p>
              <p className="text-xs text-blue-700 font-medium mt-1">This audit trail is immutable. All system-level events and data modifications are logged with high precision to ensure accountability in the financial work plan cycle.</p>
          </div>
      </div>
    </div>
  );
};

export default AuditTrail;
