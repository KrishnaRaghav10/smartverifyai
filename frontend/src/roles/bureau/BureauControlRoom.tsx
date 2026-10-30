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
import { StatusChip } from '../../shared/StatusChip';
import { Region } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  Activity,
  Layers,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
  Download,
  CheckCircle2,
  Filter,
  X
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const BureauControlRoom: React.FC = () => {
  const { applications, notifications, undertakings, documents, openAuditDrawer, addToast } = useAegisStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pulse' | 'compare' | 'escalations' | 'reports'>('pulse');
  const [drilldownCategory, setDrilldownCategory] = useState<string | null>(null);

  // Region comparison data
  const regions: Region[] = ['Northern', 'Southern', 'Eastern', 'Western', 'Central'];
  const regionComparisonData = regions.map((r) => {
    const apps = applications.filter((a) => a.region === r);
    const overdue = apps.filter((a) => a.status === 'OVERDUE' || a.status === 'ESCALATED').length;
    const onTrack = apps.filter((a) => a.status === 'ON_TRACK').length;
    return {
      region: r,
      total: apps.length,
      onTrack,
      overdue
    };
  });

  // Ageing Buckets
  const ageingData = [
    { name: '0–7 Days', value: applications.filter((a) => a.status === 'ON_TRACK').length, color: '#138808' },
    { name: '8–15 Days', value: applications.filter((a) => a.status === 'DUE_SOON').length, color: '#F28C28' },
    { name: '16–30 Days', value: applications.filter((a) => a.status === 'OVERDUE').length, color: '#D92D20' },
    { name: '30+ Days', value: applications.filter((a) => a.status === 'ESCALATED').length, color: '#7F1D1D' }
  ];

  // Live Alerts Rail items
  const recentAlerts = notifications.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col font-sans selection:bg-[#E6ECFF] selection:text-[#4F46E5]">
      {/* Header */}
      <Header
        onOpenNotifications={() => setIsNotifOpen(true)}
        accentColor="#4F46E5"
        portalTitle="Bureau Control Room"
      />

      {/* Main Layout with Persistent Right-Side Alerts Rail */}
      <div className="flex-1 flex overflow-hidden max-w-[1700px] w-full mx-auto">
        {/* Central Dashboard Workspace */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Top Tabs Bar */}
          <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
            <div>
              <h1 className="text-xl font-extrabold text-[#0F1B3D] tracking-tight">
                National Pulse & Cross-Regional Control
              </h1>
              <p className="text-xs text-[#5B6785]">
                Bureau-level overview of processing scorecards, SLA ageing, and multi-region bottlenecks.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-[#E1E6F0] p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('pulse')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'pulse' ? 'bg-[#4F46E5] text-white' : 'text-[#5B6785] hover:text-[#0F1B3D]'
                }`}
              >
                National Pulse
              </button>
              <button
                onClick={() => setActiveTab('compare')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'compare' ? 'bg-[#4F46E5] text-white' : 'text-[#5B6785] hover:text-[#0F1B3D]'
                }`}
              >
                Compare Regions
              </button>
              <button
                onClick={() => setActiveTab('escalations')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'escalations' ? 'bg-[#4F46E5] text-white' : 'text-[#5B6785] hover:text-[#0F1B3D]'
                }`}
              >
                Escalations Received
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'reports' ? 'bg-[#4F46E5] text-white' : 'text-[#5B6785] hover:text-[#0F1B3D]'
                }`}
              >
                Reports Builder
              </button>
            </div>
          </div>

          {/* TAB 1: NATIONAL PULSE MULTI-WIDGET DASHBOARD */}
          {activeTab === 'pulse' && (
            <div className="space-y-6">
              {/* Row 1: Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Widget 1: Regional Comparison Bar Race */}
                <div
                  onClick={() => setDrilldownCategory('Regional Comparison')}
                  className="aegis-card p-5 bg-white space-y-3 cursor-pointer hover:border-[#4F46E5] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F1B3D]">
                      Regional Applications: On-Track vs Overdue
                    </h3>
                    <span className="text-[10px] font-mono text-[#5B6785]">Click to Drilldown</span>
                  </div>

                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={regionComparisonData}>
                        <XAxis dataKey="region" stroke="#5B6785" fontSize={11} />
                        <YAxis stroke="#5B6785" fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="onTrack" fill="#138808" name="On Track" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="overdue" fill="#D92D20" name="Overdue" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Widget 2: National Ageing Buckets Donut */}
                <div
                  onClick={() => setDrilldownCategory('Ageing Buckets')}
                  className="aegis-card p-5 bg-white space-y-3 cursor-pointer hover:border-[#4F46E5] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F1B3D]">
                      National Stage Ageing Buckets
                    </h3>
                    <span className="text-[10px] font-mono text-[#5B6785]">SLA Distribution</span>
                  </div>

                  <div className="h-60 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ageingData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={4}
                        >
                          {ageingData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 2: Top Overdue Institutions Table */}
              <div className="aegis-card p-5 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F1B3D]">
                    Top Overdue & Escalated Cases Across All Regions
                  </h3>
                  <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                    Requires Bureau Review
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[#5B6785] bg-[#EEF1F8] font-semibold">
                      <tr>
                        <th className="p-2.5 rounded-l-lg">ID</th>
                        <th className="p-2.5">Institution</th>
                        <th className="p-2.5">Region</th>
                        <th className="p-2.5">Stage</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 rounded-r-lg text-right">Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E1E6F0]">
                      {applications
                        .filter((a) => a.status === 'OVERDUE' || a.status === 'ESCALATED')
                        .slice(0, 6)
                        .map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-mono-num font-bold text-[#0F1B3D]">{app.id}</td>
                            <td className="p-2.5 font-semibold text-[#0F1B3D]">{app.institutionName}</td>
                            <td className="p-2.5">{app.region}</td>
                            <td className="p-2.5">{app.currentStage}</td>
                            <td className="p-2.5"><StatusChip status={app.status} size="sm" /></td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => openAuditDrawer('APPLICATION', app.id)}
                                className="text-xs font-bold text-[#4F46E5] hover:underline"
                              >
                                View Trail
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPARE REGIONS */}
          {activeTab === 'compare' && (
            <div className="aegis-card p-6 bg-white space-y-4">
              <h3 className="font-bold text-sm text-[#0F1B3D]">
                Side-by-Side Regional Sparklines & Scorecards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {regions.map((reg) => {
                  const apps = applications.filter((a) => a.region === reg);
                  const complianceRate = Math.round(
                    (apps.filter((a) => a.status === 'ON_TRACK').length / (apps.length || 1)) * 100
                  );
                  return (
                    <div key={reg} className="p-4 bg-[#F7F8FC] rounded-2xl border border-[#E1E6F0] space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-[#0F1B3D]">{reg} Region</h4>
                        <span className="text-xs font-mono font-bold text-[#4F46E5]">{apps.length} Apps</span>
                      </div>
                      <div className="text-2xl font-mono-num font-extrabold text-[#0F1B3D]">
                        {complianceRate}%
                      </div>
                      <span className="text-[10px] text-[#5B6785] block">SLA Compliance Rate</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ESCALATIONS RECEIVED */}
          {activeTab === 'escalations' && (
            <div className="aegis-card p-6 bg-white space-y-4">
              <h3 className="font-bold text-sm text-[#0F1B3D]">
                Bureau-Level Statutory Escalation Queue
              </h3>
              <div className="space-y-3">
                {notifications
                  .filter((n) => n.kind === 'ESCALATION')
                  .map((notif) => (
                    <div key={notif.id} className="p-4 bg-rose-50/40 rounded-2xl border border-rose-200 flex items-start justify-between gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                            ESCALATION LEVEL 2
                          </span>
                          <span className="text-[10px] text-[#5B6785]">
                            {format(parseISO(notif.createdAt), 'dd MMM yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="font-bold text-[#0F1B3D]">{notif.message}</p>
                      </div>
                      <button
                        onClick={() => openAuditDrawer('APPLICATION', notif.entityRef.id)}
                        className="px-3 py-1 bg-[#1F3A8A] text-white rounded-lg text-xs font-bold shrink-0"
                      >
                        Inspect Dossier
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 4: REPORTS BUILDER */}
          {activeTab === 'reports' && (
            <div className="aegis-card p-6 bg-white space-y-4">
              <h3 className="font-bold text-sm text-[#0F1B3D]">
                Executive Report Builder & Metric Extraction
              </h3>
              <p className="text-xs text-[#5B6785]">
                Generate simulated statistical extracts for statutory councils and parliamentary committees.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    addToast({
                      type: 'success',
                      title: 'CSV Export Generated',
                      message: 'Bureau_National_Compliance_Extract.csv compiled successfully.'
                    })
                  }
                  className="px-4 py-2 bg-[#1F3A8A] text-white rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export CSV Data
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Persistent Right-Side Alerts Rail (Live Feed) */}
        <aside className="w-80 bg-white border-l border-[#E1E6F0] p-4 flex flex-col shrink-0 select-none hidden xl:flex">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1E6F0] mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#4F46E5] animate-pulse" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F1B3D]">
                Live Alerts Rail
              </h3>
            </div>
            <span className="text-[10px] font-mono bg-[#E6ECFF] text-[#4F46E5] px-2 py-0.5 rounded-full font-bold">
              Real-time
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5">
            {recentAlerts.map((alt) => (
              <div key={alt.id} className="p-3 bg-[#F7F8FC] rounded-xl border border-[#E1E6F0] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-[#5B6785]">
                    {alt.entityRef.type}: {alt.entityRef.id}
                  </span>
                  <StatusChip status={alt.kind} size="sm" />
                </div>
                <p className="text-[11px] text-[#0F1B3D] leading-tight font-medium">
                  {alt.message}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E1E6F0] text-[10px] text-[#5B6785] text-center">
            Synchronised with Simulated Clock Engine
          </div>
        </aside>
      </div>

      {/* Drill-down Drawer */}
      {drilldownCategory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3 mb-4">
                <h3 className="font-bold text-sm text-[#0F1B3D]">
                  Drilldown: {drilldownCategory}
                </h3>
                <button onClick={() => setDrilldownCategory(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#5B6785] mb-4">
                Filtered underlying applications corresponding to selected chart metrics.
              </p>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {applications.slice(0, 10).map((a) => (
                  <div key={a.id} className="p-3 bg-[#F7F8FC] rounded-xl border border-[#E1E6F0] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono-num font-bold text-[#0F1B3D]">{a.id}</span>
                      <span className="text-[11px] text-[#5B6785] block">{a.institutionName}</span>
                    </div>
                    <StatusChip status={a.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setDrilldownCategory(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0F1B3D] rounded-xl text-xs font-bold"
            >
              Close Drilldown
            </button>
          </div>
        </div>
      )}

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
