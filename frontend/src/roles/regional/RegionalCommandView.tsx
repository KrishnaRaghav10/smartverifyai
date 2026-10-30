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
  MapPin,
  Users,
  AlertTriangle,
  TrendingDown,
  FileText
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const RegionalCommandView: React.FC = () => {
  const {
    currentUser,
    applications,
    evcs,
    undertakings,
    documents,
    reassignApp,
    addToast
  } = useAegisStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region>('Western');
  const [activeTab, setActiveTab] = useState<'overview' | 'workload' | 'applications' | 'bottlenecks'>('overview');
  const [reassignModalApp, setReassignModalApp] = useState<any>(null);
  const [reassignTargetUser, setReassignTargetUser] = useState('Er. Vikram Deshmukh');
  const [reassignReason, setReassignReason] = useState('');

  // Regional filtering
  const regApps = applications.filter((a) => a.region === selectedRegion);
  const regEvcs = evcs.filter((e) => e.region === selectedRegion);
  const regUndertakings = undertakings.filter((u) => u.region === selectedRegion);
  const regDocs = documents.filter((d) => d.region === selectedRegion);

  // Regional KPIs
  const dueSoonApps = regApps.filter((a) => a.status === 'DUE_SOON').length;
  const overdueApps = regApps.filter((a) => a.status === 'OVERDUE' || a.status === 'ESCALATED').length;
  const delayedEvcs = regEvcs.filter((e) => e.status === 'DELAYED').length;
  const overdueUndertakings = regUndertakings.filter((u) => u.status === 'OVERDUE' || u.status === 'ESCALATED').length;
  const expiringDocs = regDocs.filter((d) => d.status === 'EXPIRING' || d.status === 'EXPIRED').length;

  // Officers swimlanes for Western/selected region
  const officersList = [
    { name: 'Er. Vikram Deshmukh', designation: 'Senior Scrutiny Officer', id: 'USR-SCRUT-01' },
    { name: 'Shri A. K. Patwardhan', designation: 'Assistant Director (Scrutiny)', id: 'USR-SCRUT-02' },
    { name: 'Dr. Neha Kulkarni', designation: 'Scrutiny Officer (Tech)', id: 'USR-SCRUT-03' }
  ];

  const handleReassignSubmit = () => {
    if (!reassignModalApp) return;
    reassignApp(
      reassignModalApp.id,
      reassignTargetUser,
      reassignReason || 'Workload balancing across regional officers'
    );
    setReassignModalApp(null);
    setReassignReason('');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col font-sans selection:bg-[#E6ECFF] selection:text-[#F28C28]">
      {/* Header */}
      <Header
        onOpenNotifications={() => setIsNotifOpen(true)}
        accentColor="#F28C28"
        portalTitle="Regional Command View"
      />

      <div className="flex-1 flex overflow-hidden max-w-[1600px] w-full mx-auto">
        {/* Left Collapsible Sidebar with Region Switcher */}
        <aside className="w-64 bg-white border-r border-[#E1E6F0] p-4 flex flex-col justify-between shrink-0 select-none hidden md:flex">
          <div className="space-y-4">
            {/* Region Selector */}
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6785] block mb-1">
                Regional Jurisdiction:
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as Region)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-[#E1E6F0] bg-[#F7F8FC] text-[#0F1B3D]"
              >
                <option value="Western">Western Regional Office (WRO)</option>
                <option value="Southern">Southern Regional Office (SRO)</option>
                <option value="Northern">Northern Regional Office (NRO)</option>
                <option value="Central">Central Regional Office (CRO)</option>
                <option value="Eastern">Eastern Regional Office (ERO)</option>
              </select>
            </div>

            <div className="h-px bg-[#E1E6F0]" />

            {/* Nav Tabs */}
            <nav className="space-y-1">
              {[
                { id: 'overview', label: 'Region Overview (Map)', icon: MapPin },
                { id: 'workload', label: 'Workload Board', icon: Users },
                { id: 'applications', label: 'Regional Applications', icon: FileText },
                { id: 'bottlenecks', label: 'Bottleneck Radar', icon: TrendingDown }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                      isActive
                        ? 'bg-[#F28C28]/10 text-[#F28C28] font-bold'
                        : 'text-[#5B6785] hover:bg-slate-50 hover:text-[#0F1B3D]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#F28C28]' : 'text-[#5B6785]'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 leading-tight">
            <strong>Regional Officer:</strong> {currentUser.name}
            <span className="block text-[10px] text-amber-700 mt-0.5">
              Authorised to reassign cases and escalate EVC bottlenecks.
            </span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="aegis-card p-3.5 bg-white border border-[#E1E6F0]">
              <span className="text-[11px] text-[#5B6785] block">Total Applications</span>
              <span className="font-mono-num font-extrabold text-xl text-[#0F1B3D]">
                {regApps.length}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">In {selectedRegion}</span>
            </div>
            <div className="aegis-card p-3.5 bg-white border border-[#E1E6F0]">
              <span className="text-[11px] text-[#5B6785] block">Due Soon (&le;2d)</span>
              <span className="font-mono-num font-extrabold text-xl text-[#F28C28]">
                {dueSoonApps}
              </span>
              <span className="text-[10px] text-amber-700 block mt-0.5">Approaching SLA</span>
            </div>
            <div className="aegis-card p-3.5 bg-white border border-[#E1E6F0]">
              <span className="text-[11px] text-[#5B6785] block">Overdue / Escalated</span>
              <span className="font-mono-num font-extrabold text-xl text-[#D92D20]">
                {overdueApps}
              </span>
              <span className="text-[10px] text-rose-700 block mt-0.5">SLA Exceeded</span>
            </div>
            <div className="aegis-card p-3.5 bg-white border border-[#E1E6F0]">
              <span className="text-[11px] text-[#5B6785] block">EVCs Past Target</span>
              <span className="font-mono-num font-extrabold text-xl text-[#6D4AFF]">
                {delayedEvcs}
              </span>
              <span className="text-[10px] text-purple-700 block mt-0.5">Delayed visits</span>
            </div>
            <div className="aegis-card p-3.5 bg-white border border-[#E1E6F0]">
              <span className="text-[11px] text-[#5B6785] block">Overdue Undertakings</span>
              <span className="font-mono-num font-extrabold text-xl text-amber-700">
                {overdueUndertakings}
              </span>
              <span className="text-[10px] text-amber-800 block mt-0.5">Evidence pending</span>
            </div>
            <div className="aegis-card p-3.5 bg-white border border-[#E1E6F0]">
              <span className="text-[11px] text-[#5B6785] block">Expiring Leases</span>
              <span className="font-mono-num font-extrabold text-xl text-[#D92D20]">
                {expiringDocs}
              </span>
              <span className="text-[10px] text-rose-600 block mt-0.5">&le; 30 days validity</span>
            </div>
          </div>

          {/* TAB 1: OVERVIEW & MAP */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* India Map Heat-Shading + Regional Dwell Time Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SVG Map of India with Region Heat Shading */}
                <div className="lg:col-span-2 aegis-card p-6 bg-white flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-extrabold text-sm text-[#0F1B3D] tracking-tight flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#F28C28]" />
                        <span>National Regional Heat Map</span>
                      </h3>
                      <p className="text-xs text-[#5B6785]">
                        Click any region to inspect pendency metrics and switch officer command.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-[#E6ECFF] text-[#1F3A8A] px-2.5 py-1 rounded-full">
                      5 AICTE Zones
                    </span>
                  </div>

                  {/* Stylized SVG Map of India */}
                  <div className="h-72 w-full flex items-center justify-center bg-[#F7F8FC] rounded-2xl p-4 relative overflow-hidden border border-[#E1E6F0]">
                    <svg viewBox="0 0 400 420" className="w-full h-full max-h-64">
                      {/* Northern Region Polygon */}
                      <path
                        d="M 170 30 L 250 40 L 260 110 L 210 140 L 160 120 L 140 70 Z"
                        fill={selectedRegion === 'Northern' ? '#F28C28' : '#FDE68A'}
                        stroke="#B45309"
                        strokeWidth="1.5"
                        className="cursor-pointer transition-colors hover:opacity-80"
                        onClick={() => setSelectedRegion('Northern')}
                      />
                      <text x="180" y="85" fontSize="11" fontWeight="bold" fill="#78350F">NORTH (NRO)</text>

                      {/* Western Region Polygon */}
                      <path
                        d="M 90 150 L 170 140 L 190 230 L 130 250 L 90 210 Z"
                        fill={selectedRegion === 'Western' ? '#F28C28' : '#FDE68A'}
                        stroke="#B45309"
                        strokeWidth="1.5"
                        className="cursor-pointer transition-colors hover:opacity-80"
                        onClick={() => setSelectedRegion('Western')}
                      />
                      <text x="110" y="195" fontSize="11" fontWeight="bold" fill="#78350F">WEST (WRO)</text>

                      {/* Central Region Polygon */}
                      <path
                        d="M 180 140 L 240 140 L 240 220 L 180 230 Z"
                        fill={selectedRegion === 'Central' ? '#F28C28' : '#FDE68A'}
                        stroke="#B45309"
                        strokeWidth="1.5"
                        className="cursor-pointer transition-colors hover:opacity-80"
                        onClick={() => setSelectedRegion('Central')}
                      />
                      <text x="190" y="185" fontSize="11" fontWeight="bold" fill="#78350F">CENTRAL (CRO)</text>

                      {/* Eastern Region Polygon */}
                      <path
                        d="M 250 140 L 360 130 L 370 190 L 280 220 L 240 180 Z"
                        fill={selectedRegion === 'Eastern' ? '#F28C28' : '#FDE68A'}
                        stroke="#B45309"
                        strokeWidth="1.5"
                        className="cursor-pointer transition-colors hover:opacity-80"
                        onClick={() => setSelectedRegion('Eastern')}
                      />
                      <text x="280" y="175" fontSize="11" fontWeight="bold" fill="#78350F">EAST (ERO)</text>

                      {/* Southern Region Polygon */}
                      <path
                        d="M 130 250 L 230 230 L 210 370 L 160 380 Z"
                        fill={selectedRegion === 'Southern' ? '#F28C28' : '#FDE68A'}
                        stroke="#B45309"
                        strokeWidth="1.5"
                        className="cursor-pointer transition-colors hover:opacity-80"
                        onClick={() => setSelectedRegion('Southern')}
                      />
                      <text x="155" y="300" fontSize="11" fontWeight="bold" fill="#78350F">SOUTH (SRO)</text>
                    </svg>

                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-[#E1E6F0] text-[10px] text-[#5B6785] shadow-xs">
                      Active: <strong className="text-[#0F1B3D]">{selectedRegion} Region</strong> ({regApps.length} cases)
                    </div>
                  </div>
                </div>

                {/* Animated Stage Funnel */}
                <div className="aegis-card p-6 bg-white space-y-4">
                  <h3 className="font-extrabold text-sm text-[#0F1B3D] tracking-tight">
                    Stage-Wise Regional Funnel
                  </h3>
                  <div className="space-y-3">
                    {[
                      { stage: 'Scrutiny', count: regApps.filter((a) => a.currentStage === 'SCRUTINY').length, avgDays: '3.4d' },
                      { stage: 'Re-Scrutiny', count: regApps.filter((a) => a.currentStage === 'RE_SCRUTINY').length, avgDays: '4.8d' },
                      { stage: 'EVC Queue & Visit', count: regApps.filter((a) => a.currentStage.includes('EVC')).length, avgDays: '8.1d' },
                      { stage: 'SAC / SHC Review', count: regApps.filter((a) => a.currentStage === 'SAC_SHC').length, avgDays: '5.2d' },
                      { stage: 'Sanction / Closed', count: regApps.filter((a) => a.currentStage === 'DECISION' || a.currentStage === 'CLOSED').length, avgDays: '2.1d' }
                    ].map((step, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#0F1B3D]">{step.stage}</span>
                          <span className="font-mono-num font-bold text-[#F28C28]">
                            {step.count} cases ({step.avgDays} avg)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-[#EEF1F8] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#F28C28] rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(15, (step.count / regApps.length) * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORKLOAD BOARD (DRAG-AND-DROP / REASSIGNMENT) */}
          {activeTab === 'workload' && (
            <div className="aegis-card p-6 bg-white space-y-6">
              <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F1B3D] tracking-tight">
                    Officer Workload Distribution & Swimlanes
                  </h3>
                  <p className="text-xs text-[#5B6785]">
                    Rebalance active applications across regional officers to eliminate pendency bottlenecks.
                  </p>
                </div>
                <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold">
                  {selectedRegion} Regional Officers
                </span>
              </div>

              <div className="space-y-4">
                {officersList.map((officer) => {
                  const assignedCases = regApps.filter(
                    (a) => a.assignedTo === officer.id || a.assignedTo === officer.name
                  );
                  return (
                    <div key={officer.id} className="p-4 bg-[#F7F8FC] rounded-2xl border border-[#E1E6F0] space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#F28C28] text-white flex items-center justify-center font-bold text-xs">
                            {officer.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-[#0F1B3D]">{officer.name}</h4>
                            <span className="text-[10px] text-[#5B6785]">{officer.designation}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white border border-[#E1E6F0]">
                            {assignedCases.length} Active Cases
                          </span>
                        </div>
                      </div>

                      {/* Cases list under officer */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {assignedCases.slice(0, 3).map((c) => (
                          <div
                            key={c.id}
                            className="p-2.5 bg-white rounded-xl border border-[#E1E6F0] flex items-center justify-between shadow-2xs text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-mono-num font-bold text-[#0F1B3D] block">{c.id}</span>
                              <span className="text-[10px] text-[#5B6785] truncate block">{c.institutionName}</span>
                            </div>
                            <button
                              onClick={() => {
                                setReassignModalApp(c);
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-[#F28C28] hover:text-white text-[#F28C28] rounded-lg text-[10px] font-bold transition-colors shrink-0"
                            >
                              Reassign
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: REGIONAL APPLICATIONS TABLE WITH BULK ACTIONS */}
          {activeTab === 'applications' && (
            <div className="aegis-card p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#0F1B3D]">
                    All {selectedRegion} Region Applications
                  </h3>
                  <p className="text-xs text-[#5B6785]">Filter, remind, and review status across stages.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EEF1F8] text-[#5B6785] font-semibold">
                    <tr>
                      <th className="p-3 rounded-l-xl">Application ID</th>
                      <th className="p-3">Institution</th>
                      <th className="p-3">Stage</th>
                      <th className="p-3">SLA Due Date</th>
                      <th className="p-3">Assigned Officer</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 rounded-r-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E6F0]">
                    {regApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono-num font-bold text-[#0F1B3D]">{app.id}</td>
                        <td className="p-3 font-semibold text-[#0F1B3D]">{app.institutionName}</td>
                        <td className="p-3">{app.currentStage}</td>
                        <td className="p-3 font-mono-num text-[#5B6785]">
                          {format(parseISO(app.slaDueAt), 'dd MMM yyyy')}
                        </td>
                        <td className="p-3 text-[#5B6785]">{app.assignedTo}</td>
                        <td className="p-3"><StatusChip status={app.status} size="sm" /></td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setReassignModalApp(app)}
                            className="px-2.5 py-1 text-xs font-bold text-[#F28C28] hover:bg-amber-50 rounded-lg"
                          >
                            Reassign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: BOTTLENECK RADAR */}
          {activeTab === 'bottlenecks' && (
            <div className="aegis-card p-6 bg-white space-y-4">
              <h3 className="font-bold text-sm text-[#0F1B3D] uppercase tracking-wide">
                Bottleneck Radar: Longest-Pending Institutional Cases
              </h3>
              <div className="divide-y divide-[#E1E6F0]">
                {regApps
                  .filter((a) => a.status === 'OVERDUE' || a.status === 'ESCALATED')
                  .slice(0, 5)
                  .map((app) => (
                    <div key={app.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono-num font-bold text-[#0F1B3D]">{app.id}</span>
                        <h5 className="font-bold text-[#0F1B3D]">{app.institutionName}</h5>
                        <span className="text-[11px] text-rose-600 font-medium">
                          Stuck in {app.currentStage} · Statutory deadline passed
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          addToast({
                            type: 'warn',
                            title: 'Reminder Issued',
                            message: `Notice transmitted to nodal officer for ${app.institutionName}.`
                          });
                        }}
                        className="px-3 py-1.5 bg-[#F28C28] text-white rounded-xl font-bold text-xs"
                      >
                        Issue Priority Remind
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* REASSIGN WORKLOAD MODAL */}
      {reassignModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-[#E1E6F0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
              <h3 className="font-bold text-sm text-[#0F1B3D]">
                Reassign Application Workload
              </h3>
              <button onClick={() => setReassignModalApp(null)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <p className="text-xs text-[#5B6785]">
              Reassigning case <strong>{reassignModalApp.id}</strong> ({reassignModalApp.institutionName}).
            </p>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0F1B3D]">Assign To Officer:</label>
              <select
                value={reassignTargetUser}
                onChange={(e) => setReassignTargetUser(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E1E6F0] bg-white"
              >
                {officersList.map((o) => (
                  <option key={o.id} value={o.name}>{o.name} ({o.designation})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0F1B3D]">Official Reason:</label>
              <textarea
                rows={2}
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="e.g. Workload balancing to prevent SLA breach..."
                className="w-full text-xs p-2 border border-[#E1E6F0] rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setReassignModalApp(null)} className="px-4 py-2 text-xs font-semibold text-[#5B6785]">
                Cancel
              </button>
              <button
                onClick={handleReassignSubmit}
                className="px-4 py-2 bg-[#F28C28] hover:bg-[#d97718] text-white rounded-xl text-xs font-bold"
              >
                Confirm Reassignment
              </button>
            </div>
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
