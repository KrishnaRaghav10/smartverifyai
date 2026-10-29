import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, PlusCircle, AlertTriangle, MessageSquare,
  ListOrdered, Layers, Bell, CheckSquare,
  LayoutDashboard, UserCheck, Scale, Users, BookOpen, BarChart3,
  History, Eye, ShieldCheck, DownloadCloud
} from 'lucide-react';

export const Sidebar = () => {
  const { currentUser, currentPath, navigateTo } = useApp();

  if (!currentUser) return null;

  const role = currentUser.role;

  // Role-Specific Navigation Menus
  const getNavItems = () => {
    switch (role) {
      case 'Institution':
        return [
          { path: '/institution/home', label: 'My Applications', icon: FileText },
          { path: '/institution/new', label: 'New Application', icon: PlusCircle },
          { path: '/institution/deficiencies', label: 'Deficiencies', icon: AlertTriangle },
          { path: '/institution/messages', label: 'Messages', icon: MessageSquare }
        ];

      case 'Scrutiny Officer':
        return [
          { path: '/scrutiny/queue', label: 'My Queue', icon: ListOrdered },
          { path: '/scrutiny/all', label: 'All Applications', icon: Layers },
          { path: '/scrutiny/alerts', label: 'Alerts', icon: Bell },
          { path: '/scrutiny/activity', label: 'My Activity', icon: CheckSquare }
        ];

      case 'Senior Officer':
        return [
          { path: '/senior/overview', label: 'Overview', icon: LayoutDashboard },
          { path: '/senior/escalated', label: 'Escalated Cases', icon: UserCheck },
          { path: '/senior/decisions', label: 'Decisions', icon: Scale },
          { path: '/senior/assign', label: 'Assign', icon: Users },
          { path: '/senior/rules', label: 'Rules', icon: BookOpen },
          { path: '/senior/reports', label: 'Reports', icon: BarChart3 }
        ];

      case 'Auditor':
        return [
          { path: '/audit/logs', label: 'Audit Log', icon: History },
          { path: '/audit/applications', label: 'Applications (view)', icon: Eye },
          { path: '/audit/rules', label: 'Rule History', icon: BookOpen },
          { path: '/audit/export', label: 'Export', icon: DownloadCloud }
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-60 bg-[#F8FAFC] border-r border-slate-200 shrink-0 min-h-[calc(100vh-4.25rem)] py-4 flex flex-col justify-between">
      <div>
        <div className="px-4 mb-3 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {role} Portal
          </span>
          <span className="text-[9px] font-semibold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
            Role v2.0
          </span>
        </div>
        
        <nav className="space-y-1 px-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => navigateTo(item.path)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-md text-xs font-semibold text-left transition-all ${
                  isActive
                    ? 'bg-[#1B3A6B] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#E8890C]' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Authority Advisory Notice at Bottom of Sidebar */}
      <div className="px-3 pt-4 border-t border-slate-200 text-xs">
        <div className="bg-white p-3 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-slate-900 font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1B3A6B]" />
            <span className="text-[11px]">Role Scope</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            {role === 'Institution' && "Submit applications, replace expired documents, and reply to clarification requests."}
            {role === 'Scrutiny Officer' && "Pre-scrutiny verification of documents & flags. Recommend cases to Senior Officer."}
            {role === 'Senior Officer' && "Final statutory authority for approvals, returns, handbook rules, and officer assignment."}
            {role === 'Auditor' && "Independent read-only surveillance of immutable system logs and regulatory actions."}
          </p>
        </div>
      </div>
    </aside>
  );
};
