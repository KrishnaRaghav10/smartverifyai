import React, { useState, useEffect } from 'react';
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
import { Application, Stage } from '../../types';
import {
  Inbox,
  CheckCircle,
  CornerUpLeft,
  FileText,
  Search,
  Filter,
  ShieldAlert,
  History,
  Eye,
  Check,
  AlertTriangle,
  FileCheck2,
  Printer,
  Sparkles,
  Layers,
  ChevronRight,
  Send,
  Lock
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

export const ScrutinyWorkbench: React.FC = () => {
  const {
    applications,
    currentUser,
    simDate,
    advanceApp,
    returnApp,
    openAuditDrawer,
    addToast
  } = useAegisStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string>('APP-W-001');
  const [searchFilter, setSearchFilter] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [caseTab, setCaseTab] = useState<'summary' | 'checklist' | 'documents' | 'history'>('checklist');

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReasonCode, setReturnReasonCode] = useState('DEFICIENCY_DOCS_INCOMPLETE');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [deficienciesList, setDeficienciesList] = useState<string[]>([
    'Registered Lease deed expires within statutory 30-day scrutiny window',
    'Faculty recruitment cadre ratio deficient in Associate Professor tier'
  ]);
  const [newDeficiencyText, setNewDeficiencyText] = useState('');

  // Electronic Case Summary State
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');

  // Checklist live editing
  const [checklistState, setChecklistState] = useState<Record<string, 'PASS' | 'DEFICIENT' | 'NA'>>({
    'CHK-1': 'PASS',
    'CHK-2': 'PASS',
    'CHK-3': 'PASS',
    'CHK-4': 'PASS',
    'CHK-5': 'DEFICIENT'
  });

  const scrutinyQueue = applications.filter((a) => {
    // Show applications in Scrutiny or Re-Scrutiny or all active for the officer
    const matchesSearch =
      a.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.institutionName.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStage = stageFilter === 'ALL' || a.currentStage === stageFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStage && matchesStatus;
  });

  const selectedApp =
    applications.find((a) => a.id === selectedAppId) || scrutinyQueue[0] || applications[0];

  // Keyboard Shortcuts (J / K / C / R / /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) {
        return;
      }
      if (e.key.toLowerCase() === 'j') {
        e.preventDefault();
        const idx = scrutinyQueue.findIndex((a) => a.id === selectedAppId);
        if (idx < scrutinyQueue.length - 1) setSelectedAppId(scrutinyQueue[idx + 1].id);
      } else if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const idx = scrutinyQueue.findIndex((a) => a.id === selectedAppId);
        if (idx > 0) setSelectedAppId(scrutinyQueue[idx - 1].id);
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCompleteScrutiny();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setIsReturnModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAppId, scrutinyQueue]);

  // Complete Scrutiny Action -> Auto-advance
  const handleCompleteScrutiny = () => {
    if (!selectedApp) return;
    const res = advanceApp(
      selectedApp.id,
      `Scrutiny completed by ${currentUser.name} (${currentUser.designation}). Scrutiny checklist validated.`
    );
    if (res.success) {
      addToast({
        type: 'success',
        title: 'Scrutiny Completed',
        message: `${selectedApp.id} auto-advanced to ${selectedApp.pathway.includes('EVC') ? 'EVC Scheduling Queue' : 'Competent Authority Decision'}.`
      });
    }
  };

  // Submit Return Action
  const handleSubmitReturn = () => {
    if (!selectedApp) return;
    returnApp(
      selectedApp.id,
      returnReasonCode,
      returnRemarks || 'Statutory deficiencies noted during official scrutiny review.',
      deficienciesList
    );
    setIsReturnModalOpen(false);
  };

  // Generate Electronic Case Summary
  const handleGenerateSummary = () => {
    if (!selectedApp) return;
    const summary = `ELECTRONIC CASE SUMMARY (OFFICIAL DRAFT)
Date: ${format(simDate, 'dd MMMM yyyy')}
Application ID: ${selectedApp.id}
Institution: ${selectedApp.institutionName} (${selectedApp.region} Region)
Approval Pathway: ${selectedApp.pathway}
Scrutiny Officer: ${currentUser.name} (${currentUser.designation})

1. PARAMETERS EVALUATED:
- Land & Building Title: VERIFIED (Registered lease deed examined)
- Cadre Ratio & Faculty Compliance: SATISFACTORY (1:15 ratio approved)
- Barrier-Free Campus Access & Safety: COMPLIANT
- Corpus Fund & FDR Endorsement: SATISFACTORY

2. OFFICIAL RECOMMENDATION:
Application meets statutory criteria under Chapter II AICTE APH. Recommended for onward stage progression to ${selectedApp.pathway.includes('EVC') ? 'Expert Visiting Committee (EVC)' : 'Competent Authority'}.

[Note: Draft document. Final sanction requires human decision by the Competent Authority.]`;
    setSummaryDraft(summary);
    setIsSummaryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col font-sans selection:bg-[#E6ECFF] selection:text-[#0E8F8A]">
      {/* Top Header */}
      <Header
        onOpenNotifications={() => setIsNotifOpen(true)}
        accentColor="#0E8F8A"
        portalTitle="Scrutiny Workbench"
      />

      {/* Main Split-Pane Workspace (Left Rail + Queue Left + Detail Right) */}
      <div className="flex-1 flex overflow-hidden max-w-[1600px] w-full mx-auto">
        {/* Leftmost Mini Icon Rail */}
        <aside className="w-14 bg-white border-r border-[#E1E6F0] flex flex-col items-center py-4 gap-4 shrink-0 select-none hidden md:flex">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0E8F8A] flex items-center justify-center font-bold text-xs shadow-xs">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div className="h-px w-8 bg-[#E1E6F0]" />
          <button
            onClick={() => setStageFilter('ALL')}
            className={`p-2 rounded-xl text-slate-500 hover:bg-slate-100 ${stageFilter === 'ALL' ? 'text-[#0E8F8A] bg-teal-50' : ''}`}
            title="All Active Scrutiny"
          >
            <Inbox className="w-5 h-5" />
          </button>
          <button
            onClick={() => setStatusFilter('OVERDUE')}
            className={`p-2 rounded-xl text-slate-500 hover:bg-slate-100 ${statusFilter === 'OVERDUE' ? 'text-[#D92D20] bg-rose-50' : ''}`}
            title="Overdue Cases"
          >
            <AlertTriangle className="w-5 h-5" />
          </button>
          <button
            onClick={() => setStatusFilter('RETURNED')}
            className={`p-2 rounded-xl text-slate-500 hover:bg-slate-100 ${statusFilter === 'RETURNED' ? 'text-[#F28C28] bg-amber-50' : ''}`}
            title="Returned Cases"
          >
            <CornerUpLeft className="w-5 h-5" />
          </button>
        </aside>

        {/* Pane 1: Prioritised Queue Column */}
        <div className="w-full md:w-[380px] lg:w-[420px] bg-white border-r border-[#E1E6F0] flex flex-col shrink-0">
          {/* Queue Filter Bar */}
          <div className="p-3.5 border-b border-[#E1E6F0] space-y-2.5 bg-[#F7F8FC]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0E8F8A]" />
                <h2 className="font-extrabold text-sm text-[#0F1B3D] tracking-tight">
                  Scrutiny Queue
                </h2>
              </div>
              <span className="text-[10px] font-mono bg-white border border-[#E1E6F0] px-2 py-0.5 rounded-md text-[#5B6785]">
                {scrutinyQueue.length} Cases
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#5B6785] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search case ID or institution..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-[#E1E6F0] bg-white focus:outline-none focus:ring-1 focus:ring-[#0E8F8A]"
              />
            </div>

            {/* Keyboard Shortcuts Hint Bar */}
            <div className="flex items-center justify-between text-[10px] font-mono text-[#5B6785] pt-0.5">
              <span>Hotkeys: J/K (nav) · C (complete) · R (return)</span>
            </div>
          </div>

          {/* Queue List with Ageing Heat-Strips */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E1E6F0]">
            {scrutinyQueue.map((app) => {
              const isSelected = app.id === selectedAppId;
              const dueAt = parseISO(app.slaDueAt);
              const daysRemaining = differenceInDays(dueAt, simDate);
              const isOverdue = daysRemaining < 0;
              const isDueSoon = daysRemaining >= 0 && daysRemaining <= 2;

              // Heat-strip percentage (max 10 days)
              const heatPct = Math.min(100, Math.max(10, ((10 - Math.max(0, daysRemaining)) / 10) * 100));

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={`p-3.5 transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-teal-50/70 border-l-4 border-l-[#0E8F8A]'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono-num font-bold text-xs text-[#0F1B3D]">
                      {app.id}
                    </span>
                    <StatusChip status={app.status} size="sm" />
                  </div>

                  <h4 className="text-xs font-semibold text-[#0F1B3D] truncate">
                    {app.institutionName}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-[#5B6785] mt-1">
                    <span>{app.programme}</span>
                    <span className="font-mono-num font-medium">
                      {daysRemaining > 0 ? `${daysRemaining}d left` : `${Math.abs(daysRemaining)}d overdue`}
                    </span>
                  </div>

                  {/* Ageing Heat-Strip (Mini bar showing time used vs SLA) */}
                  <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isOverdue
                          ? 'bg-[#D92D20]'
                          : isDueSoon
                          ? 'bg-[#F28C28]'
                          : 'bg-[#0E8F8A]'
                      }`}
                      style={{ width: `${heatPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pane 2: Case Evaluation Workspace (Right Side) */}
        {selectedApp ? (
          <div className="flex-1 bg-[#F7F8FC] flex flex-col overflow-y-auto">
            {/* Case Header Toolbar */}
            <div className="bg-white border-b border-[#E1E6F0] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-20 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-num font-extrabold text-base text-[#0F1B3D]">
                    {selectedApp.id}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E6ECFF] text-[#1F3A8A]">
                    {selectedApp.type}
                  </span>
                  <StatusChip status={selectedApp.status} />
                  <span className="text-xs text-[#5B6785]">· {selectedApp.region} Region</span>
                </div>
                <h3 className="text-sm font-bold text-[#0F1B3D] mt-0.5">
                  {selectedApp.institutionName}
                </h3>
              </div>

              {/* Authorized Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReturnModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Return application to institution with deficiencies (Hotkey: R)"
                >
                  <CornerUpLeft className="w-3.5 h-3.5" />
                  <span>Return (R)</span>
                </button>

                <button
                  onClick={handleGenerateSummary}
                  className="px-3.5 py-1.5 rounded-xl border border-[#E1E6F0] hover:bg-slate-100 text-[#0F1B3D] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-[#0E8F8A]" />
                  <span>Case Summary</span>
                </button>

                <button
                  onClick={handleCompleteScrutiny}
                  className="px-4 py-1.5 rounded-xl bg-[#0E8F8A] hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                  title="Complete scrutiny and auto-advance (Hotkey: C)"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Complete Scrutiny (C)</span>
                </button>
              </div>
            </div>

            {/* Case Navigation Tabs */}
            <div className="bg-white border-b border-[#E1E6F0] px-6 flex items-center gap-4 text-xs font-medium text-[#5B6785]">
              {(['checklist', 'summary', 'documents', 'history'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCaseTab(tab)}
                  className={`py-3 border-b-2 transition-all capitalize font-medium ${
                    caseTab === tab
                      ? 'border-[#0E8F8A] text-[#0E8F8A] font-bold'
                      : 'border-transparent hover:text-[#0F1B3D]'
                  }`}
                >
                  {tab === 'checklist'
                    ? 'Scrutiny Checklist'
                    : tab === 'documents'
                    ? 'Document Proofs (Confidential)'
                    : tab === 'summary'
                    ? 'Application Profile'
                    : 'Audit Trail'}
                </button>
              ))}
            </div>

            {/* Case Tab Contents */}
            <div className="p-6 space-y-6">
              {/* Stepper on top */}
              <div className="aegis-card p-4 bg-white">
                <StageStepper
                  pathway={selectedApp.pathway}
                  currentStage={selectedApp.currentStage}
                  status={selectedApp.status}
                />
              </div>

              {/* TAB 1: CHECKLIST */}
              {caseTab === 'checklist' && (
                <div className="aegis-card p-6 bg-white space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-[#0F1B3D] uppercase tracking-wide">
                        Statutory Scrutiny Verification Matrix
                      </h4>
                      <p className="text-xs text-[#5B6785]">
                        Examine official parameters mandated by the Approval Process Handbook 2026.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full">
                      Authorized Scrutiny Checklist
                    </span>
                  </div>

                  <div className="divide-y divide-[#E1E6F0] border border-[#E1E6F0] rounded-2xl overflow-hidden bg-[#F7F8FC]">
                    {[
                      { id: 'CHK-1', title: 'Land Ownership & 30-Year Lease Registry', cat: 'Land/Building', default: 'PASS' },
                      { id: 'CHK-2', title: 'Barrier-Free Physical Ramps, Lifts & Disabled Access', cat: 'Accessibility', default: 'PASS' },
                      { id: 'CHK-3', title: 'Faculty Cadre Ratio (1:15 Cadre Compliance)', cat: 'Faculty', default: 'PASS' },
                      { id: 'CHK-4', title: 'Fire Safety NOC from Municipal Chief Fire Officer', cat: 'Safety NOC', default: 'PASS' },
                      { id: 'CHK-5', title: 'Affiliating University NOC & Board of Technical Education', cat: 'Affiliation', default: 'DEFICIENT' }
                    ].map((item) => {
                      const curVal = checklistState[item.id] || item.default;
                      return (
                        <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                          <div>
                            <span className="text-[10px] font-mono uppercase font-bold text-[#5B6785]">
                              {item.cat}
                            </span>
                            <h5 className="text-xs font-bold text-[#0F1B3D]">{item.title}</h5>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setChecklistState((prev) => ({ ...prev, [item.id]: 'PASS' }))}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                curVal === 'PASS'
                                  ? 'bg-[#138808] text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Pass
                            </button>
                            <button
                              onClick={() => setChecklistState((prev) => ({ ...prev, [item.id]: 'DEFICIENT' }))}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                curVal === 'DEFICIENT'
                                  ? 'bg-[#D92D20] text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Deficient
                            </button>
                            <button
                              onClick={() => setChecklistState((prev) => ({ ...prev, [item.id]: 'NA' }))}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                curVal === 'NA'
                                  ? 'bg-slate-700 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              N/A
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: DOCUMENTS PREVIEW WITH WATERMARK */}
              {caseTab === 'documents' && (
                <div className="aegis-card p-6 bg-white space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-[#0F1B3D] uppercase tracking-wide flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#D92D20]" />
                        <span>Confidential Statutory Document Vault</span>
                      </h4>
                      <p className="text-xs text-[#5B6785]">
                        Document viewer includes security watermark with Officer ID {currentUser.id}.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900">
                      Confidential
                    </span>
                  </div>

                  {/* Document Simulated Viewer with Watermark */}
                  <div className="relative border-2 border-[#E1E6F0] rounded-2xl p-8 bg-slate-50 min-h-[350px] flex flex-col items-center justify-center overflow-hidden select-none">
                    {/* Watermark Overlay containing User ID */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 transform -rotate-12">
                      <span className="text-5xl font-mono font-black text-slate-900 tracking-widest uppercase">
                        AICTE CONFIDENTIAL · {currentUser.id} · {format(simDate, 'yyyy-MM-dd')}
                      </span>
                    </div>

                    <FileText className="w-16 h-16 text-[#1F3A8A] mb-3" />
                    <h5 className="font-bold text-sm text-[#0F1B3D]">
                      Registered Land Deed & 30-Year Campus Lease Agreement.pdf
                    </h5>
                    <p className="text-xs text-[#5B6785] mt-1">
                      File Size: 4.8 MB · Uploaded by {selectedApp.institutionName} · Hash: 0x9f4a...21ec
                    </p>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() =>
                          addToast({
                            type: 'info',
                            title: 'Preview Opened',
                            message: 'Document rendered in encrypted viewing sandbox.'
                          })
                        }
                        className="px-4 py-2 bg-[#1F3A8A] hover:bg-[#0F1B3D] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> Full Sandbox Preview
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: APPLICATION PROFILE SUMMARY */}
              {caseTab === 'summary' && (
                <div className="aegis-card p-6 bg-white space-y-4">
                  <h4 className="text-sm font-bold text-[#0F1B3D] uppercase tracking-wide">
                    Institutional Profile & Intake Summary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-[#F7F8FC] rounded-xl border border-[#E1E6F0]">
                      <span className="text-[#5B6785] block">Intake Capacity</span>
                      <span className="font-mono-num font-extrabold text-base text-[#0F1B3D]">
                        {selectedApp.studentIntake} Seats
                      </span>
                    </div>
                    <div className="p-3 bg-[#F7F8FC] rounded-xl border border-[#E1E6F0]">
                      <span className="text-[#5B6785] block">Total Courses</span>
                      <span className="font-mono-num font-extrabold text-base text-[#0F1B3D]">
                        {selectedApp.courseCount} Programmes
                      </span>
                    </div>
                    <div className="p-3 bg-[#F7F8FC] rounded-xl border border-[#E1E6F0]">
                      <span className="text-[#5B6785] block">Stage Entered</span>
                      <span className="font-mono-num font-bold text-xs text-[#0F1B3D]">
                        {format(parseISO(selectedApp.stageEnteredAt), 'dd MMM yyyy')}
                      </span>
                    </div>
                    <div className="p-3 bg-[#F7F8FC] rounded-xl border border-[#E1E6F0]">
                      <span className="text-[#5B6785] block">SLA Due Target</span>
                      <span className="font-mono-num font-bold text-xs text-[#D92D20]">
                        {format(parseISO(selectedApp.slaDueAt), 'dd MMM yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT TRAIL */}
              {caseTab === 'history' && (
                <div className="aegis-card p-6 bg-white space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
                    <h4 className="text-sm font-bold text-[#0F1B3D] uppercase tracking-wide">
                      Application Audit Trail
                    </h4>
                    <button
                      onClick={() => openAuditDrawer('APPLICATION', selectedApp.id)}
                      className="text-xs text-[#0E8F8A] font-bold hover:underline"
                    >
                      Open Full Verifier Drawer &rarr;
                    </button>
                  </div>
                  <div className="space-y-3">
                    {selectedApp.history?.map((evt, idx) => (
                      <div key={idx} className="p-3 bg-[#F7F8FC] rounded-xl border border-[#E1E6F0] flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[#0F1B3D]">{evt.action.replace(/_/g, ' ')}</span>
                          <span className="text-[11px] text-[#5B6785] block">
                            By {evt.actor} · "{evt.reason}"
                          </span>
                        </div>
                        <span className="font-mono-num text-[10px] text-[#5B6785]">
                          {format(parseISO(evt.at), 'dd MMM HH:mm')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-xs text-[#5B6785]">
            Select an application from the queue to start scrutiny review.
          </div>
        )}
      </div>

      {/* RETURN MODAL WITH DEFICIENCY LIST BUILDER & NOTICE PREVIEW */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl border border-[#E1E6F0] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-[#D92D20] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Return Application for Deficiency</h3>
                <p className="text-xs text-white/80">Case: {selectedApp.id} · {selectedApp.institutionName}</p>
              </div>
              <button onClick={() => setIsReturnModalOpen(false)} className="text-white hover:text-white/80">
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="text-xs font-bold text-[#0F1B3D] block mb-1">
                  Reason Code:
                </label>
                <select
                  value={returnReasonCode}
                  onChange={(e) => setReturnReasonCode(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E1E6F0] bg-white font-medium"
                >
                  <option value="DEFICIENCY_DOCS_INCOMPLETE">DEFICIENCY_DOCS_INCOMPLETE (Missing Statutory Certificates)</option>
                  <option value="DEFICIENCY_LEASE_EXPIRED">DEFICIENCY_LEASE_EXPIRED (Land Lease Tenure Shortfall)</option>
                  <option value="DEFICIENCY_FACULTY_CADRE">DEFICIENCY_FACULTY_CADRE (Non-compliant Faculty Cadre Ratio)</option>
                  <option value="DEFICIENCY_FIRE_SAFETY">DEFICIENCY_FIRE_SAFETY (Lapsed Municipal Fire NOC)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#0F1B3D] block mb-1">
                  Deficiency List Builder:
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newDeficiencyText}
                    onChange={(e) => setNewDeficiencyText(e.target.value)}
                    placeholder="Enter observation to mandate rectification..."
                    className="flex-1 text-xs p-2.5 rounded-xl border border-[#E1E6F0]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newDeficiencyText.trim()) {
                        setDeficienciesList((prev) => [...prev, newDeficiencyText.trim()]);
                        setNewDeficiencyText('');
                      }
                    }}
                    className="px-4 py-2 bg-[#1F3A8A] text-white rounded-xl text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {deficienciesList.map((d, i) => (
                    <div key={i} className="p-2 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between text-xs text-rose-950">
                      <span>{i + 1}. {d}</span>
                      <button
                        onClick={() => setDeficienciesList((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-rose-600 hover:text-rose-900 font-bold ml-2"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#0F1B3D] block mb-1">
                  Standard Communication Preview (Editable Notice):
                </label>
                <textarea
                  rows={4}
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  placeholder={`Sir/Madam, upon scrutiny of application ${selectedApp.id}, the AICTE Scrutiny Committee has recorded deficiencies. You are mandated under Chapter II to submit rectification documents within 7 statutory days.`}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E1E6F0] bg-slate-50 font-sans"
                />
              </div>
            </div>

            <div className="p-4 bg-[#F7F8FC] border-t border-[#E1E6F0] flex items-center justify-between">
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5B6785]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReturn}
                className="px-5 py-2.5 rounded-xl bg-[#D92D20] hover:bg-rose-800 text-white text-xs font-bold shadow-md"
              >
                Issue Deficiency Notice & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ELECTRONIC CASE SUMMARY PREVIEW MODAL */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl border border-[#E1E6F0] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-[#1F3A8A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#F28C28]" />
                <h3 className="font-bold text-sm">Electronic Case Summary (Official Draft)</h3>
              </div>
              <button onClick={() => setIsSummaryModalOpen(false)} className="text-white hover:text-white/80">
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <pre className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono whitespace-pre-wrap text-[#0F1B3D] leading-relaxed">
                {summaryDraft}
              </pre>
            </div>

            <div className="p-4 bg-[#F7F8FC] border-t border-[#E1E6F0] flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-[#E1E6F0] hover:bg-slate-200 text-xs font-semibold text-[#0F1B3D] flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Summary
              </button>
              <button
                onClick={() => {
                  setIsSummaryModalOpen(false);
                  addToast({
                    type: 'success',
                    title: 'Summary Approved & Lodged',
                    message: 'Electronic case summary confirmed and appended to dossier.'
                  });
                }}
                className="px-5 py-2.5 rounded-xl bg-[#138808] hover:bg-emerald-800 text-white text-xs font-bold shadow-md"
              >
                Confirm & Lodge Summary
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
