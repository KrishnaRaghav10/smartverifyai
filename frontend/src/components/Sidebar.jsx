import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, FileText, CheckCircle2, History, BookOpen, ShieldAlert } from 'lucide-react';

export const Sidebar = () => {
  const { currentView, navigateTo, t } = useApp();

  const navItems = [
    { id: 'dashboard', label: t.nav_dashboard, icon: LayoutDashboard },
    { id: 'applications', label: t.nav_applications, icon: FileText },
    { id: 'audit', label: t.nav_audit, icon: History },
    { id: 'rules', label: t.nav_rules, icon: BookOpen },
    { id: 'safeguards', label: t.nav_safeguards, icon: ShieldAlert },
  ];

  return (
    <aside className="w-56 bg-[#F6F8FB] border-r border-slate-200 shrink-0 min-h-[calc(100vh-4.25rem)] py-4 flex flex-col justify-between">
      <div>
        <div className="px-4 mb-3">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Navigation / मेनू
          </span>
        </div>
        <nav className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (item.id === 'applications' && currentView === 'application_detail');
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-medium text-left transition-colors ${
                  isActive
                    ? 'bg-[#1B3A6B] text-white'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#E8890C]' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Advisory Tag at bottom of sidebar */}
      <div className="px-3 pt-4 border-t border-slate-200 text-[11px] text-slate-500 leading-tight">
        <div className="bg-white p-2.5 rounded border border-slate-200">
          <p className="font-semibold text-slate-800 mb-1">Human-in-the-Loop</p>
          <p className="text-[10px] text-slate-500">
            AI provides pre-scrutiny assistance. Scrutiny officers take all regulatory calls.
          </p>
        </div>
      </div>
    </aside>
  );
};
