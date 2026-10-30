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
import rulesConfig from '../../config/rules.json';
import {
  GitFork,
  Clock,
  ArrowUpCircle,
  Mail,
  Users,
  Database,
  Play,
  Save,
  Info
} from 'lucide-react';

export const ConfigurationStudio: React.FC = () => {
  const { addToast } = useAegisStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<'workflow' | 'sla' | 'ladders' | 'templates' | 'permissions' | 'integrations'>('workflow');

  // Workflow visual dummy test state
  const [dummyStageIdx, setDummyStageIdx] = useState(0);
  const [isTestingWorkflow, setIsTestingWorkflow] = useState(false);

  // SLA form state
  const [slaDays, setSlaDays] = useState({
    SCRUTINY: 7,
    RE_SCRUTINY: 5,
    EVC_QUEUE: 10,
    EVC_SCHEDULED: 14,
    SAC_SHC: 7,
    DECISION: 7
  });

  const dummyStages = ['SUBMITTED', 'SCRUTINY', 'EVC_QUEUE', 'EVC_SCHEDULED', 'DECISION', 'CLOSED'];

  const runDummyWorkflowTest = () => {
    setIsTestingWorkflow(true);
    setDummyStageIdx(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < dummyStages.length) {
        setDummyStageIdx(step);
      } else {
        clearInterval(interval);
        setIsTestingWorkflow(false);
        addToast({
          type: 'success',
          title: 'Workflow Simulation Cleared',
          message: 'Sample application completed pathway routing smoothly with SLA clock resets.'
        });
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col font-sans selection:bg-[#E6ECFF] selection:text-[#06B6D4]">
      {/* Header */}
      <Header
        onOpenNotifications={() => setIsNotifOpen(true)}
        accentColor="#475569"
        portalTitle="Rules & Configuration Studio"
      />

      <div className="flex-1 flex overflow-hidden max-w-[1700px] w-full mx-auto">
        {/* Left Settings Tree Sidebar */}
        <aside className="w-64 bg-white border-r border-[#E1E6F0] p-4 flex flex-col justify-between shrink-0 select-none hidden md:flex">
          <div className="space-y-4">
            <div className="pb-3 border-b border-[#E1E6F0]">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#0F1B3D]">
                Studio Settings Tree
              </h3>
              <span className="text-[10px] text-[#5B6785]">Policy Architecture v2.4</span>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'workflow', label: 'Workflow Designer', icon: GitFork },
                { id: 'sla', label: 'SLA & Timeline Rules', icon: Clock },
                { id: 'ladders', label: 'Escalation Ladders', icon: ArrowUpCircle },
                { id: 'templates', label: 'Notification Templates', icon: Mail },
                { id: 'permissions', label: 'Users & Permissions Matrix', icon: Users },
                { id: 'integrations', label: 'Legacy AICTE Integrations', icon: Database }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id as any)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                      isActive
                        ? 'bg-slate-100 text-[#0F1B3D] border-l-4 border-l-[#06B6D4]'
                        : 'text-[#5B6785] hover:bg-slate-50 hover:text-[#0F1B3D]'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#5B6785]" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-3 bg-cyan-50 rounded-2xl border border-cyan-200 text-[10px] text-cyan-950 leading-tight">
            <strong>Config Versioning:</strong> Commit sha <code>v2.4-published</code>.<br />
            Published rule changes append tamper-evident audit hashes.
          </div>
        </aside>

        {/* Central Split View: Config Form Left + Live Preview Right */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* TAB 1: VISUAL WORKFLOW DESIGNER NODE GRAPH */}
          {activeNav === 'workflow' && (
            <div className="aegis-card p-6 bg-white space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1E6F0] pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-[#0F1B3D]">
                    Visual Node Pathway Designer
                  </h2>
                  <p className="text-xs text-[#5B6785]">
                    Configure statutory routing pathways (Only Scrutiny, Scrutiny + EVC, EVC + SAC/SHC).
                  </p>
                </div>
                <button
                  onClick={runDummyWorkflowTest}
                  disabled={isTestingWorkflow}
                  className="px-4 py-2 bg-[#06B6D4] hover:bg-cyan-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isTestingWorkflow ? 'Running Trace...' : 'Test With Sample App'}</span>
                </button>
              </div>

              {/* Interactive Node Graph Visual */}
              <div className="p-8 bg-[#F7F8FC] rounded-2xl border border-[#E1E6F0] overflow-x-auto">
                <div className="flex items-center justify-between min-w-[700px] relative">
                  {dummyStages.map((stg, i) => {
                    const isPassed = i <= dummyStageIdx;
                    const isCurrent = i === dummyStageIdx && isTestingWorkflow;
                    return (
                      <React.Fragment key={stg}>
                        <div className="flex flex-col items-center relative z-10">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xs shadow-md transition-all ${
                              isCurrent
                                ? 'bg-[#06B6D4] text-white ring-4 ring-[#06B6D4]/30 scale-110'
                                : isPassed
                                ? 'bg-[#1F3A8A] text-white'
                                : 'bg-white text-[#5B6785] border border-[#E1E6F0]'
                            }`}
                          >
                            {stg.slice(0, 3)}
                          </div>
                          <span className="text-[11px] font-bold text-[#0F1B3D] mt-2">
                            {stg}
                          </span>
                        </div>
                        {i < dummyStages.length - 1 && (
                          <div className="flex-1 h-1 bg-[#E1E6F0] mx-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                i < dummyStageIdx ? 'bg-[#06B6D4] w-full' : 'w-0'
                              }`}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SLA & TIMELINE RULES */}
          {activeNav === 'sla' && (
            <div className="aegis-card p-6 bg-white space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1E6F0] pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-[#0F1B3D]">
                    Stage-Wise SLA & Due-Soon Threshold Parameters
                  </h2>
                  <p className="text-xs text-[#5B6785]">
                    Configure default SLA days per stage and thresholds for automated alert triggers.
                  </p>
                </div>
                {/* Mandatory APH notice badge */}
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Align with applicable APH before use</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(slaDays).map(([stage, days]) => (
                  <div key={stage} className="p-4 bg-[#F7F8FC] rounded-2xl border border-[#E1E6F0] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0F1B3D]">{stage}</span>
                      <span className="font-mono-num font-bold text-[#06B6D4]">{days} Days SLA</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="30"
                      value={days}
                      onChange={(e) =>
                        setSlaDays((prev) => ({ ...prev, [stage]: parseInt(e.target.value) }))
                      }
                      className="w-full accent-[#06B6D4]"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() =>
                  addToast({
                    type: 'success',
                    title: 'SLA Parameters Updated',
                    message: 'New timeline configuration saved and logged in audit chain.'
                  })
                }
                className="px-5 py-2.5 bg-[#475569] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save SLA Rules
              </button>
            </div>
          )}

          {/* TAB 3: ESCALATION LADDERS BUILDER */}
          {activeNav === 'ladders' && (
            <div className="aegis-card p-6 bg-white space-y-4">
              <h2 className="text-base font-extrabold text-[#0F1B3D]">
                Drag-and-Drop Escalation Ladder Builder
              </h2>
              <div className="space-y-3">
                {rulesConfig.escalationLadders.application.map((step) => (
                  <div key={step.level} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-[#06B6D4]">LEVEL {step.level}</span>
                      <h4 className="font-bold text-[#0F1B3D]">Target: {step.targetRole}</h4>
                      <p className="text-[11px] text-[#5B6785] mt-0.5">Wait Threshold: {step.waitDays} days past SLA</p>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-1 bg-white rounded border">
                      {step.channel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATION TEMPLATES */}
          {activeNav === 'templates' && (
            <div className="aegis-card p-6 bg-white space-y-4 max-w-2xl">
              <h2 className="text-base font-extrabold text-[#0F1B3D]">
                Notification Templates & Placeholders
              </h2>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono">
                {`[Level {level} Escalation] Application {id} for {institution} exceeded stage SLA by {days} days. Escalated to {targetRole}.`}
              </div>
            </div>
          )}

          {/* TAB 5: USERS & PERMISSIONS MATRIX */}
          {activeNav === 'permissions' && (
            <div className="aegis-card p-6 bg-white space-y-4">
              <h2 className="text-base font-extrabold text-[#0F1B3D]">
                Users & Statutory Permissions Matrix
              </h2>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#EEF1F8] font-bold text-[#5B6785]">
                    <tr>
                      <th className="p-3">Role</th>
                      <th className="p-3">Scrutiny Return</th>
                      <th className="p-3">EVC Schedule</th>
                      <th className="p-3">Verify Undertaking</th>
                      <th className="p-3">Final Sanction Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E6F0]">
                    <tr>
                      <td className="p-3 font-bold">Institution</td>
                      <td className="p-3">✕</td>
                      <td className="p-3">✕</td>
                      <td className="p-3">✕</td>
                      <td className="p-3">✕</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">Scrutiny Officer</td>
                      <td className="p-3 text-emerald-600 font-bold">✓</td>
                      <td className="p-3">✕</td>
                      <td className="p-3">✕</td>
                      <td className="p-3">✕</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">Senior Authority</td>
                      <td className="p-3">✕</td>
                      <td className="p-3">✕</td>
                      <td className="p-3">✕</td>
                      <td className="p-3 text-emerald-600 font-bold">✓ (Human Only)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: INTEGRATIONS MOCK CARDS */}
          {activeNav === 'integrations' && (
            <div className="aegis-card p-6 bg-white space-y-4">
              <h2 className="text-base font-extrabold text-[#0F1B3D]">
                Existing AICTE Legacy Systems (Mock Integrations)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs">
                  <div className="flex items-center justify-between font-bold text-emerald-950 mb-1">
                    <span>AICTE Web Portal Integration</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200">Connected (Simulated)</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">Syncs PID records, approved intake databases, and affiliating university gazettes.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

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
