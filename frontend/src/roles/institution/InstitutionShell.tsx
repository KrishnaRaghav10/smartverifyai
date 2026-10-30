import React, { useState } from 'react';
import { useAegisStore } from '../../store';
import { Header } from '../../shared/Header';
import { SafeguardFooter } from '../../shared/SafeguardFooter';
import { TimeMachine } from '../../shared/TimeMachine';
import { NotificationDrawer } from '../../shared/NotificationDrawer';
import { AuditDrawer } from '../../shared/AuditDrawer';
import { CommandPalette } from '../../shared/CommandPalette';
import { ToastContainer } from '../../shared/ToastContainer';
import { DevScenarioPanel } from '../../shared/DevScenarioPanel';
import {
  LayoutDashboard,
  FileText,
  FileCheck,
  FolderLock,
  CalendarCheck2,
  BellRing
} from 'lucide-react';

interface InstitutionShellProps {
  children: (activeTab: string, setActiveTab: (tab: string) => void) => React.ReactNode;
}

export const InstitutionShell: React.FC<InstitutionShellProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'undertakings' | 'vault' | 'evc' | 'messages'>('dashboard');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { currentUser, institutions, undertakings, documents } = useAegisStore();

  const currentInst = institutions.find((i) => i.id === currentUser.institutionId) || institutions[0];

  // Badges
  const openUndertakingsCount = undertakings.filter(
    (u) => u.institutionId === currentInst.id && (u.status === 'OPEN' || u.status === 'OVERDUE')
  ).length;

  const expiringDocsCount = documents.filter(
    (d) => d.institutionId === currentInst.id && (d.status === 'EXPIRING' || d.status === 'EXPIRED')
  ).length;

  const tabs = [
    { id: 'dashboard', label: 'Action Centre', icon: LayoutDashboard },
    { id: 'applications', label: 'My Applications', icon: FileText },
    {
      id: 'undertakings',
      label: 'Undertakings',
      icon: FileCheck,
      badge: openUndertakingsCount > 0 ? openUndertakingsCount : undefined
    },
    {
      id: 'vault',
      label: 'Documents & Lease Vault',
      icon: FolderLock,
      badge: expiringDocsCount > 0 ? expiringDocsCount : undefined,
      badgeColor: 'bg-amber-500'
    },
    { id: 'evc', label: 'EVC Visit & Panel', icon: CalendarCheck2 },
    { id: 'messages', label: 'Official Notices', icon: BellRing }
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col font-sans selection:bg-[#E6ECFF] selection:text-[#0A5CD6]">
      {/* Shared Header with Chakra Blue accent */}
      <Header
        onOpenNotifications={() => setIsNotifOpen(true)}
        accentColor="#0A5CD6"
        portalTitle="Institution Console"
      />

      {/* Institution Banner strip */}
      <div className="bg-white border-b border-[#E1E6F0] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-[#E6ECFF] text-[#0A5CD6] px-2.5 py-0.5 rounded-full">
                AICTE PID: {currentInst.aicteId}
              </span>
              <span className="text-xs text-[#5B6785]">· {currentInst.region} Regional Office</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F1B3D] tracking-tight mt-1">
              {currentInst.name}
            </h1>
            <p className="text-xs text-[#5B6785]">
              {currentInst.address} · Estd. {currentInst.establishedYear}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-medium text-[#5B6785]">Logged in:</span>
            <span className="text-xs font-bold text-[#0F1B3D] bg-[#EEF1F8] px-3 py-1 rounded-xl border border-[#E1E6F0]">
              {currentUser.name} ({currentUser.designation})
            </span>
          </div>
        </div>

        {/* Top-Tab Navigation (Distinct Institution Shell Style) */}
        <div className="max-w-6xl mx-auto mt-4 flex items-center gap-2 border-b border-[#E1E6F0] overflow-x-auto text-xs font-medium text-[#5B6785]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap font-medium ${
                  isActive
                    ? 'border-[#0A5CD6] text-[#0A5CD6] font-bold bg-blue-50/50 rounded-t-xl'
                    : 'border-transparent hover:text-[#0F1B3D] hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0A5CD6]' : 'text-[#5B6785]'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-white text-[10px] font-bold ${
                      tab.badgeColor || 'bg-[#D92D20]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Centered Content Column */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children(activeTab, setActiveTab)}
      </main>

      {/* Global Utilities */}
      <SafeguardFooter />
      <TimeMachine />
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <AuditDrawer />
      <CommandPalette />
      <ToastContainer />
      <DevScenarioPanel />
    </div>
  );
};
