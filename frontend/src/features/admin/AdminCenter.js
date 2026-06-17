import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Calendar,
  UploadCloud,
  History,
  Settings,
  LayoutDashboard,
  ArrowRight,
  Database,
  Activity,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import UserList from './users/UserList';
import RoleManagement from './roles/RoleManagement';
import AuditTrail from './audit/AuditTrail';
import ImportCenter from './import/ImportCenter';

const AdminDashboard = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Users</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter">42</h3>
          <div className="mt-4 flex items-center gap-2 text-emerald-600">
            <CheckCircle2 size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">System Access Secure</span>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-emerald-400">Active Fiscal Year</p>
          <h3 className="text-3xl font-black tracking-tighter italic">FY 2024</h3>
          <div className="mt-4 flex items-center gap-2 text-slate-400">
            <Clock size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Q4 Closing Phase</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Latest Import</p>
          <h3 className="text-xl font-black text-slate-900 truncate">MOOE_WFP_V2.xlsx</h3>
          <div className="mt-4 flex items-center gap-2 text-blue-600">
            <History size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Processed 2h ago</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Health</p>
          <h3 className="text-3xl font-black text-emerald-500 tracking-tighter">99.9%</h3>
          <div className="mt-4 flex items-center gap-2 text-emerald-600">
            <Activity size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">All Services Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Approvals</h4>
                <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest">View All</button>
            </div>
            <div className="divide-y divide-slate-50">
                {[
                    { ref: 'OB-24-105', user: 'Admin.Approver', date: 'Oct 24, 2024', status: 'Approved' },
                    { ref: 'PR-24-089', user: 'Finance.Director', date: 'Oct 23, 2024', status: 'Authorized' },
                    { ref: 'OB-24-102', user: 'Admin.Approver', date: 'Oct 23, 2024', status: 'Approved' },
                ].map((item, idx) => (
                    <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <CheckCircle2 size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900">{item.ref}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{item.user}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-900 uppercase">{item.status}</p>
                            <p className="text-[9px] font-bold text-slate-400">{item.date}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Audit Activity</h4>
                <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest">View Trail</button>
            </div>
            <div className="p-8 space-y-6">
                {[
                    { action: 'Imported MOOE Budget', module: 'IMPORT', time: '12m ago' },
                    { action: 'Modified Role: Encoder', module: 'SECURITY', time: '45m ago' },
                    { action: 'Archived FY 2023 Registry', module: 'SYSTEM', time: '2h ago' },
                ].map((log, idx) => (
                    <div key={idx} className="flex gap-4">
                        <div className="w-px bg-slate-100 relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500"></div>
                        </div>
                        <div className="flex-1 pb-6">
                            <div className="flex justify-between items-start">
                                <p className="text-xs font-black text-slate-900">{log.action}</p>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{log.time}</span>
                            </div>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">{log.module}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

const FiscalYearManagement = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { year: '2024', status: 'Active', budget: 154000000, obligated: 124500000, color: 'emerald' },
          { year: '2025', status: 'Planned', budget: 180000000, obligated: 0, color: 'blue' },
          { year: '2023', status: 'Archived', budget: 142000000, obligated: 142000000, color: 'slate' },
        ].map((fy) => (
          <div key={fy.year} className={`p-8 rounded-[40px] border border-slate-100 bg-white shadow-sm relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${fy.color}-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform`}></div>
            <div className="flex justify-between items-start mb-10">
                <div className="space-y-1">
                    <h3 className="text-3xl font-black text-slate-900 italic">FY {fy.year}</h3>
                    <span className={`px-2 py-0.5 bg-${fy.color}-50 text-${fy.color}-600 rounded-full text-[9px] font-black uppercase tracking-widest`}>
                        {fy.status}
                    </span>
                </div>
                <Calendar className={`text-${fy.color}-500`} size={24} />
            </div>

            <div className="space-y-4 mb-8">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Budget Allocation</p>
                    <p className="text-lg font-black text-slate-900 font-mono">₱{fy.budget.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Obligated</p>
                    <p className="text-lg font-black text-emerald-600 font-mono">₱{fy.obligated.toLocaleString()}</p>
                </div>
            </div>

            <div className="flex gap-2">
                <button className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">
                    Manage
                </button>
                <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-rose-600 transition-all">
                    <Shield size={18} />
                </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[40px] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Initialize New Fiscal Cycle</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Prepare the system for the upcoming fiscal year. This will create a fresh registry structure based on the new GFWP guidelines.
            </p>
        </div>
        <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/40 transition-all">
            Open FY 2026
        </button>
      </div>
    </div>
  );
};

const SystemSettings = () => {
  return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-12 animate-in fade-in duration-700">
      <div className="max-w-3xl space-y-12">
        <section className="space-y-6">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4">Agency Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organization Name</label>
                    <input type="text" defaultValue="National Nutrition Council" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agency Code</label>
                    <input type="text" defaultValue="NNC-2024" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10" />
                </div>
            </div>
        </section>

        <section className="space-y-6">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4">Budget Health Thresholds</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Warning Threshold (%)</label>
                    <input type="number" defaultValue="70" className="w-full px-6 py-4 bg-amber-50/30 border border-amber-100 rounded-2xl text-xs font-bold text-amber-700 focus:outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Critical Threshold (%)</label>
                    <input type="number" defaultValue="85" className="w-full px-6 py-4 bg-rose-50/30 border border-rose-100 rounded-2xl text-xs font-bold text-rose-700 focus:outline-none" />
                </div>
            </div>
        </section>

        <div className="pt-6">
            <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all">
                Save System Settings
            </button>
        </div>
      </div>
    </div>
  );
};

const AdminCenter = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
    { id: 'fiscal', label: 'Fiscal Year', icon: Calendar },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard />;
      case 'users': return <UserList />;
      case 'roles': return <RoleManagement />;
      case 'fiscal': return <FiscalYearManagement />;
      case 'audit': return <AuditTrail />;
      case 'settings': return <SystemSettings />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="w-full py-8 px-6 animate-in fade-in duration-700 pb-20">
      <PageHeader
        title="Administration Control"
        subtitle="Central governance for system security, fiscal cycles, and data integrity."
        showFiscalBadge={false}
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-10 p-1.5 bg-slate-100/50 rounded-[24px] w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[600px]">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminCenter;
