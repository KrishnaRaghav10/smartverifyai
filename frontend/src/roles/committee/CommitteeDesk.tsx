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
import { StageStepper } from '../../shared/StageStepper';
import {
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Clock,
  BookOpen,
  FileText,
  Scale,
  Send,
  Plus,
  ShieldCheck,
  X
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';

export const CommitteeDesk: React.FC = () => {
  const { applications, currentUser, simDate, openAuditDrawer, addToast } = useAegisStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string>('APP-C-001');

  // Observation Form State
  const [recommendation, setRecommendation] = useState<'RECOMMEND' | 'CONDITIONS' | 'REJECT'>('CONDITIONS');
  const [deliberationNotes, setDeliberationNotes] = useState(
    'Standing Appellate Committee examined institutional justification regarding cadre shortfall in Associate Professor grade. Found reasonable progress with active advertisements.'
  );

  // Time-Bound Undertakings Conditions Builder
  const [conditions, setConditions] = useState<{ text: string; days: number }[]>([
    { text: 'Appoint 2 Ph.D. qualified Professors in Marketing & Business Analytics per cadre ratio', days: 30 }
  ]);
  const [newConditionText, setNewConditionText] = useState('');
  const [newConditionDays, setNewConditionDays] = useState(30);

  // Committee Agenda Apps (Hero 4: Kaveri School of Management APP-C-001)
  const committeeApps = applications.filter(
    (a) => a.currentStage === 'SAC_SHC' || a.id === 'APP-C-001' || a.pathway.includes('SAC')
  );

  const selectedApp =
    applications.find((a) => a.id === selectedAppId) || committeeApps[0] || applications[0];

  const handleSubmitObservation = () => {
    addToast({
      type: 'success',
      title: 'Advisory Recommendation Lodged',
      message: `Committee observation recorded for ${selectedApp.id}. Proposed ${conditions.length} time-bound undertakings.`
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col font-sans selection:bg-[#E6ECFF] selection:text-[#8E3B8E]">
      {/* Header */}
      <Header
        onOpenNotifications={() => setIsNotifOpen(true)}
        accentColor="#8E3B8E"
        portalTitle="Committee Desk (SAC / SHC)"
      />

      {/* Persistent Advisory Safeguard Banner */}
      <div className="bg-[#8E3B8E]/10 border-b border-[#8E3B8E]/20 py-2.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-[#8E3B8E] font-medium">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#8E3B8E] shrink-0" />
            <span>
              <strong>Statutory Committee Notice:</strong> Your recommendation is advisory; the final approval decision rests with the competent authority.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold">
            SAC Session 2026-IV
          </span>
        </div>
      </div>

      {/* Main 3-Column Document-Centric Layout */}
      <div className="flex-1 flex overflow-hidden max-w-[1700px] w-full mx-auto">
        {/* Left Column: Agenda List (Narrow) */}
        <aside className="w-72 bg-white border-r border-[#E1E6F0] p-4 flex flex-col shrink-0 select-none hidden md:flex">
          <div className="pb-3 border-b border-[#E1E6F0] mb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F1B3D]">
              Meeting Agenda Dossiers
            </h3>
            <span className="text-[10px] text-[#5B6785]">Standing Appellate Committee</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {committeeApps.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedAppId(item.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  item.id === selectedAppId
                    ? 'bg-purple-50/70 border-[#8E3B8E]'
                    : 'bg-white border-[#E1E6F0] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono-num font-bold text-xs text-[#0F1B3D]">
                    {item.id}
                  </span>
                  <StatusChip status={item.status} size="sm" />
                </div>
                <h4 className="text-xs font-semibold text-[#0F1B3D] truncate">
                  {item.institutionName}
                </h4>
                <span className="text-[10px] text-[#5B6785] block mt-0.5">
                  {item.programme} ({item.studentIntake} seats)
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Column: Wide Dossier Reading Pane */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6 bg-white">
          <div className="border-b border-[#E1E6F0] pb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-num font-extrabold text-lg text-[#0F1B3D]">
                  {selectedApp.id}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E6ECFF] text-[#1F3A8A]">
                  {selectedApp.type} Approval
                </span>
                <StatusChip status={selectedApp.status} />
              </div>
              <h2 className="text-xl font-bold text-[#0F1B3D] mt-1">
                {selectedApp.institutionName}
              </h2>
              <p className="text-xs text-[#5B6785]">
                {selectedApp.region} Region · Stage: {selectedApp.currentStage} · Pathway: {selectedApp.pathway}
              </p>
            </div>

            <button
              onClick={() => openAuditDrawer('APPLICATION', selectedApp.id)}
              className="px-3 py-1.5 border border-[#E1E6F0] rounded-xl text-xs font-semibold text-[#0F1B3D] hover:bg-slate-50"
            >
              Examine Audit Ledger
            </button>
          </div>

          {/* Pathway Stepper */}
          <StageStepper pathway={selectedApp.pathway} currentStage={selectedApp.currentStage} status={selectedApp.status} />

          {/* Dossier Reading Sections */}
          <div className="space-y-4">
            <div className="p-4 bg-[#F7F8FC] rounded-2xl border border-[#E1E6F0] space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F1B3D]">
                1. Scrutiny Findings & Preliminary Verification
              </h4>
              <p className="text-xs text-[#5B6785] leading-relaxed">
                First Scrutiny Committee cleared institutional land records, building blueprints, and financial endowment requirements. Identified a minor deficiency regarding cadre distribution in postgraduate disciplines.
              </p>
            </div>

            <div className="p-4 bg-[#F7F8FC] rounded-2xl border border-[#E1E6F0] space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F1B3D]">
                2. Expert Visiting Committee (EVC) Physical Report
              </h4>
              <p className="text-xs text-[#5B6785] leading-relaxed">
                EVC visited on-site campus facilities on 24 Oct 2026. Laboratories, digital library terminals, and firewall bandwidth confirmed compliant. Recommended approval subject to time-bound fulfillment of senior faculty appointments.
              </p>
            </div>
          </div>
        </main>

        {/* Right Column: Observation Editor & Conditions Builder (Plum Accent) */}
        <aside className="w-96 bg-[#F7F8FC] border-l border-[#E1E6F0] p-5 flex flex-col justify-between shrink-0 select-none hidden lg:flex">
          <div className="space-y-4">
            <div className="pb-3 border-b border-[#E1E6F0]">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#0F1B3D]">
                Advisory Committee Observations
              </h3>
              <span className="text-[10px] text-[#5B6785]">Recorded by {currentUser.name}</span>
            </div>

            {/* Recommendation Choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F1B3D]">Advisory Recommendation:</label>
              <div className="grid grid-cols-3 gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setRecommendation('RECOMMEND')}
                  className={`py-2 rounded-xl border text-center transition-all ${
                    recommendation === 'RECOMMEND'
                      ? 'bg-[#138808] text-white border-[#138808]'
                      : 'bg-white text-slate-700 border-[#E1E6F0]'
                  }`}
                >
                  Recommend
                </button>
                <button
                  onClick={() => setRecommendation('CONDITIONS')}
                  className={`py-2 rounded-xl border text-center transition-all ${
                    recommendation === 'CONDITIONS'
                      ? 'bg-[#8E3B8E] text-white border-[#8E3B8E]'
                      : 'bg-white text-slate-700 border-[#E1E6F0]'
                  }`}
                >
                  With Conditions
                </button>
                <button
                  onClick={() => setRecommendation('REJECT')}
                  className={`py-2 rounded-xl border text-center transition-all ${
                    recommendation === 'REJECT'
                      ? 'bg-[#D92D20] text-white border-[#D92D20]'
                      : 'bg-white text-slate-700 border-[#E1E6F0]'
                  }`}
                >
                  Reject
                </button>
              </div>
            </div>

            {/* Structured Deliberation Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0F1B3D]">Deliberation Notes & Rationale:</label>
              <textarea
                rows={3}
                value={deliberationNotes}
                onChange={(e) => setDeliberationNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E1E6F0] bg-white font-sans"
              />
            </div>

            {/* Conditions Builder (If "With Conditions") */}
            {recommendation === 'CONDITIONS' && (
              <div className="space-y-2 pt-2 border-t border-[#E1E6F0]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0F1B3D]">Proposed Time-Bound Undertakings:</label>
                  <span className="text-[10px] text-[#5B6785]">Flows into Compliance Module</span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {conditions.map((c, i) => (
                    <div key={i} className="p-2 bg-purple-50/60 rounded-xl border border-purple-200 text-xs text-purple-950 flex items-center justify-between">
                      <span className="text-[11px] leading-tight pr-1">
                        {i + 1}. {c.text} ({c.days}d)
                      </span>
                      <button
                        onClick={() => setConditions((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-purple-700 font-bold"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newConditionText}
                    onChange={(e) => setNewConditionText(e.target.value)}
                    placeholder="Enter condition..."
                    className="flex-1 text-xs p-2 rounded-xl border border-[#E1E6F0] bg-white"
                  />
                  <button
                    onClick={() => {
                      if (newConditionText.trim()) {
                        setConditions((prev) => [...prev, { text: newConditionText.trim(), days: newConditionDays }]);
                        setNewConditionText('');
                      }
                    }}
                    className="px-3 py-1.5 bg-[#8E3B8E] text-white rounded-xl text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmitObservation}
            className="w-full py-3 bg-[#8E3B8E] hover:bg-purple-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Advisory Opinion</span>
          </button>
        </aside>
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
