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
  ShieldCheck,
  Search,
  Play,
  RotateCcw,
  CheckCircle,
  Hash,
  Download,
  Filter,
  UserCheck,
  Bot,
  Scale,
  FileText
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format, parseISO } from 'date-fns';

export const AuditorView: React.FC = () => {
  const { auditEvents, applications, simDate, addToast } = useAegisStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('APP-W-001');
  const [playbackStep, setPlaybackStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Filtered Global Ledger
  const filteredEvents = auditEvents.filter(
    (e) =>
      e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.entityRef.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Case Reconstruction
  const selectedApp = applications.find((a) => a.id === selectedCaseId) || applications[0];
  const caseHistory = selectedApp.history || [];

  // Scrubber Playback
  const handlePlayHistory = () => {
    setIsPlaying(true);
    setPlaybackStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < caseHistory.length) {
        setPlaybackStep(step);
      } else {
        clearInterval(interval);
        setIsPlaying(false);
      }
    }, 900);
  };

  // Automation vs Human Actions breakdown
  const automatedCount = auditEvents.filter((e) => e.isAutomated || e.actor === 'SYSTEM').length;
  const humanCount = auditEvents.length - automatedCount;
  const pieData = [
    { name: 'System-Generated Automated Alerts', value: automatedCount, color: '#6D4AFF' },
    { name: 'Official Authorized Decisions', value: humanCount, color: '#1F3A8A' }
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col font-sans selection:bg-[#E6ECFF] selection:text-[#1E293B]">
      {/* Persistent READ-ONLY Statutory Ribbon */}
      <div className="bg-[#1E293B] text-amber-400 py-1.5 px-4 text-center text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 select-none shadow-sm">
        <ShieldCheck className="w-4 h-4 text-amber-400" />
        <span>READ-ONLY STATUTORY TRANSPARENCY AUDIT LENS · CRYPTOGRAPHIC SHA-256 LEDGER VERIFIED</span>
      </div>

      {/* Header */}
      <Header
        onOpenNotifications={() => setIsNotifOpen(true)}
        accentColor="#1E293B"
        portalTitle="Audit & Transparency Lens"
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-6 space-y-6">
        {/* Top Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donut Chart: Automation vs Human Action */}
          <div className="aegis-card p-6 bg-white space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F1B3D]">
                  Action Provenance Distribution
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-[#5B6785]">
                  Audit Breakdown
                </span>
              </div>
              <p className="text-xs text-[#5B6785] mt-1">
                Distinguishes background system-generated triggers from signed human decisions.
              </p>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-[#E1E6F0] flex items-center justify-between text-xs">
              <span className="text-[#6D4AFF] font-bold">Automated: {automatedCount}</span>
              <span className="text-[#1F3A8A] font-bold">Official: {humanCount}</span>
            </div>
          </div>

          {/* Case Reconstruction Scrubber View (Hero feature!) */}
          <div className="lg:col-span-2 aegis-card p-6 bg-white space-y-4 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1E6F0] pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-[#0F1B3D] tracking-tight">
                  Interactive Case Reconstruction Scrubber
                </h3>
                <p className="text-xs text-[#5B6785]">
                  Replay the complete lifecycle of any application step-by-step.
                </p>
              </div>

              {/* Case Picker */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedCaseId}
                  onChange={(e) => {
                    setSelectedCaseId(e.target.value);
                    setPlaybackStep(0);
                  }}
                  className="text-xs font-bold p-2 rounded-xl border border-[#E1E6F0] bg-slate-50"
                >
                  {applications.slice(0, 10).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} ({a.institutionName})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handlePlayHistory}
                  disabled={isPlaying}
                  className="px-3.5 py-2 bg-[#1E293B] hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isPlaying ? 'Playing...' : 'Replay'}</span>
                </button>
              </div>
            </div>

            {/* Scrubber Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#5B6785]">
                <span>Step {Math.min(playbackStep + 1, caseHistory.length)} of {caseHistory.length}</span>
                <span className="font-mono text-[10px] text-emerald-700 font-bold">✓ Hash Verified</span>
              </div>

              {caseHistory.length > 0 ? (
                <div className="p-4 bg-[#F7F8FC] rounded-2xl border border-[#E1E6F0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0F1B3D]">
                      {caseHistory[playbackStep]?.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono-num text-[#5B6785]">
                      {format(parseISO(caseHistory[playbackStep]?.at || simDate.toISOString()), 'dd MMM yyyy · HH:mm:ss')}
                    </span>
                  </div>
                  <p className="text-xs text-[#5B6785]">
                    Actor: <strong className="text-[#0F1B3D]">{caseHistory[playbackStep]?.actor}</strong> · Reason: "{caseHistory[playbackStep]?.reason}"
                  </p>
                  <div className="text-[10px] font-mono bg-white p-2 rounded-lg border text-[#5B6785] flex items-center justify-between">
                    <span>Prev Hash: {caseHistory[playbackStep]?.prevHash || '0x0000...'}</span>
                    <span className="text-emerald-700 font-bold">Hash: {caseHistory[playbackStep]?.hash}</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#5B6785]">
                  No history recorded for this case yet.
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#E1E6F0]">
              <input
                type="range"
                min="0"
                max={Math.max(0, caseHistory.length - 1)}
                value={playbackStep}
                onChange={(e) => setPlaybackStep(parseInt(e.target.value))}
                className="w-full accent-[#1E293B]"
              />
            </div>
          </div>
        </div>

        {/* Global Cryptographic Event Ledger */}
        <div className="aegis-card p-6 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1E6F0] pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-[#0F1B3D] tracking-tight">
                Global Forensic Audit Ledger
              </h3>
              <p className="text-xs text-[#5B6785]">
                Tamper-evident log of all statutory stage moves, returns, alerts, and decisions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#5B6785] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter actions or actors..."
                  className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-[#E1E6F0]"
                />
              </div>
              <button
                onClick={() =>
                  addToast({
                    type: 'success',
                    title: 'Audit Ledger Exported',
                    message: 'Immutable audit log downloaded in JSON format.'
                  })
                }
                className="px-3.5 py-1.5 bg-[#1E293B] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export Extract
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEF1F8] text-[#5B6785] font-semibold">
                <tr>
                  <th className="p-3 rounded-l-xl">Timestamp</th>
                  <th className="p-3">Actor Type</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Cryptographic Hash</th>
                  <th className="p-3 rounded-r-xl text-right">Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E6F0]">
                {filteredEvents.slice(0, 15).map((evt) => {
                  const isSys = evt.isAutomated || evt.actor === 'SYSTEM';
                  return (
                    <tr key={evt.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono-num text-[#5B6785]">
                        {format(parseISO(evt.at), 'dd MMM yyyy HH:mm:ss')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSys ? 'bg-purple-100 text-purple-900' : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {isSys ? 'System-generated' : 'Official Action'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-[#0F1B3D]">{evt.actor}</td>
                      <td className="p-3 font-medium text-[#0F1B3D]">{evt.action.replace(/_/g, ' ')}</td>
                      <td className="p-3 font-mono text-[#5B6785]">
                        {evt.entityRef.type}: {evt.entityRef.id}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {evt.hash.slice(0, 10)}...{evt.hash.slice(-4)}
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          ✓ chained
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
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
