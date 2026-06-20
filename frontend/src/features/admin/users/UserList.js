import React, { useState } from 'react';
import { Plus, Search, Mail, Shield, MoreVertical, Edit, Trash2, UserPlus, ToggleLeft, ToggleRight, UserCircle } from 'lucide-react';

const UserList = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const mockData = [
    { id: 1, name: 'Reynaldo Mimis', position: 'Chief Budget Officer', role: 'Administrator', office: 'Finance Office', status: 'Active', lastLogin: '2m ago' },
    { id: 2, name: 'Juan Dela Cruz', position: 'Administrative Assistant', role: 'Encoder', office: 'Operations Office', status: 'Active', lastLogin: '1h ago' },
    { id: 3, name: 'Maria Clara', position: 'Office Chief', role: 'Reviewer', office: 'Office of the Director', status: 'Active', lastLogin: '1d ago' },
    { id: 4, name: 'Pedro Penduko', position: 'Assistant Secretary', role: 'Approver', office: 'Finance Office', status: 'Active', lastLogin: '3h ago' },
    { id: 5, name: 'Elena Guerrero', position: 'Budget Specialist', role: 'Budget Officer', office: 'Technical Services', status: 'Inactive', lastLogin: '5d ago' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all">
          <UserPlus size={16} /> Add New User
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
              <th className="px-10 py-6">User</th>
              <th className="px-10 py-6">Position</th>
              <th className="px-10 py-6">Role</th>
              <th className="px-10 py-6">Office</th>
              <th className="px-10 py-6">Status</th>
              <th className="px-10 py-6">Last Login</th>
              <th className="px-10 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {mockData.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-10 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <UserCircle size={20} />
                    </div>
                    <span className="text-xs font-black text-slate-900 uppercase">{user.name}</span>
                  </div>
                </td>
                <td className="px-10 py-5">
                  <span className="text-xs font-bold text-slate-500">{user.position}</span>
                </td>
                <td className="px-10 py-5">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-600">
                    {user.role}
                  </span>
                </td>
                <td className="px-10 py-5 text-xs font-bold text-slate-500 uppercase">{user.office}</td>
                <td className="px-10 py-5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${user.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {user.status}
                    </span>
                  </div>
                </td>
                <td className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase">{user.lastLogin}</td>
                <td className="px-10 py-5">
                  <div className="flex justify-end gap-2">
                    <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit">
                      <Edit size={16} />
                    </button>
                    <button className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Deactivate">
                      <ToggleRight size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;
