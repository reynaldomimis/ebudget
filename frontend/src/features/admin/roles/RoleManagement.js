import React, { useState } from 'react';
import { Shield, Check, X, ShieldCheck, Lock, Edit3, Trash2, ChevronRight } from 'lucide-react';

const RoleManagement = () => {
  const [selectedRole, setSelectedRole] = useState('Administrator');

  const roles = [
    { id: 1, name: 'Administrator', description: 'Full access to all system governance and fiscal controls.' },
    { id: 2, name: 'Budget Officer', description: 'Management of GFWP registries and technical validation.' },
    { id: 3, name: 'Reviewer', description: 'Technical review of budget line items and justification.' },
    { id: 4, name: 'Approver', description: 'Final executive authorization of expenditures.' },
    { id: 5, name: 'Encoder', description: 'Data entry for workplans and purchase requests.' },
  ];

  const modules = [
    'Dashboard',
    'Budget Registry',
    'Purchase Requests',
    'Obligations',
    'Workflow',
    'Monitoring',
    'Reports',
    'Administration'
  ];

  const permissions = ['View', 'Create', 'Edit', 'Review', 'Approve', 'Delete', 'Export'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Roles List */}
        <div className="xl:col-span-1 space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">System Roles</h4>
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.name)}
              className={`w-full p-6 rounded-[32px] border text-left transition-all duration-300 group relative overflow-hidden ${
                selectedRole === role.name
                  ? 'border-blue-500 bg-blue-50/30 shadow-lg shadow-blue-900/5'
                  : 'border-slate-100 bg-white hover:border-blue-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${selectedRole === role.name ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <Shield size={18} />
                </div>
                <div className={`transition-opacity ${selectedRole === role.name ? 'opacity-100' : 'opacity-0'}`}>
                    <ChevronRight size={16} className="text-blue-500" />
                </div>
              </div>
              <h4 className="font-black text-slate-900 text-sm mb-1 uppercase tracking-tight">{role.name}</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{role.description}</p>
            </button>
          ))}
          <button className="w-full p-6 border-2 border-dashed border-slate-100 rounded-[32px] text-slate-400 hover:border-blue-200 hover:text-blue-600 transition-all flex flex-col items-center justify-center gap-2">
            <ShieldCheck size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Create Custom Role</span>
          </button>
        </div>

        {/* Permissions Matrix */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Lock size={16} className="text-blue-600" />
                  Permission Matrix: <span className="text-blue-600">{selectedRole}</span>
                </h3>
              </div>
              <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">
                Save Changes
              </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400 border-b border-slate-100">
                    <th className="px-8 py-6">Module</th>
                    {permissions.map(p => (
                        <th key={p} className="px-6 py-6 text-center">{p}</th>
                    ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {modules.map((module, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 text-xs font-black text-slate-900 uppercase tracking-tight">{module}</td>
                        {permissions.map((p, j) => (
                        <td key={j} className="px-6 py-5 text-center">
                            <div className="flex justify-center">
                            <button className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                                selectedRole === 'Administrator' || (i < 6 && j < 3)
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'bg-slate-50 border-slate-200 text-slate-200 hover:border-blue-300'
                            }`}>
                                <Check size={14} strokeWidth={3} />
                            </button>
                            </div>
                        </td>
                        ))}
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            <div className="p-8 bg-slate-50/30 border-t border-slate-50 flex justify-end gap-3">
              <button className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Discard Changes</button>
              <button className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:bg-blue-700 transition-all">Update Authority Level</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
