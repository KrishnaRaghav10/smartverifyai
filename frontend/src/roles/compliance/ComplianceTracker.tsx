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
import { Undertaking, PrescribedDocument } from '../../types';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  UploadCloud,
  FileText,
  FileCheck2,
  Calendar,
  Send,
  Sparkles,
  ShieldAlert,
  X,
  ExternalLink,
  Radar
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

export const ComplianceTracker: React.FC = () => {
  const {
    undertakings,
    documents,
    simDate,
    verifyUndertakingCompliance,
    verifyDocumentRenewal,
    openAuditDrawer,
    addToast
  } = useAegisStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'kanban' | 'radar' | 'reminders'>('kanban');

  // Verification Drawer State
  const [verifyingUndertaking, setVerifyingUndertaking] = useState<Undertaking | null>(null);
  const [verifyingRemarks, setVerifyingRemarks] = useState('Evidence verified against University gazette notification and cadre norms.');

  // Document Verification Drawer State
  const [verifyingDoc, setVerifyingDoc] = useState<PrescribedDocument | null>(null);
  const [docRemarks, setDocRemarks] = useState('Registered lease deed valid for 30 years verified with Sub-Registrar seal.');

  // Bulk Reminders State
  const [isBulkReminderSent, setIsBulkReminderSent] = useState(false);

  // Kanban Columns
  const kanbanColumns = [
    { id: 'OPEN', label: 'Open', color: 'border-slate-300' },
    { id: 'DUE_SOON', label: 'Due Soon (≤7d)', color: 'border-amber-400' },
    { id: 'SUBMITTED', label: 'Submitted (Verify)', color: 'border-blue-400' },
    { id: 'VERIFIED', label: 'Verified & Compliant', color: 'border-emerald-500' },
    { id: 'OVERDUE', label: 'Overdue', color: 'border-rose-400' },
    { id: 'ESCALATED', label: 'Escalated (Ladders)', color: 'border-rose-600' }
  ];

  // Helper to map undertaking to Kanban column
  const getUndertakingColumn = (u: Undertaking) => {
    if (u.status === 'VERIFIED') return 'VERIFIED';
    if (u.status === 'SUBMITTED') return 'SUBMITTED';
    if (u.status === 'ESCALATED') return 'ESCALATED';
    if (u.status === 'OVERDUE') return 'OVERDUE';
    const daysLeft = differenceInDays(parseISO(u.dueDate), simDate);
    if (daysLeft <= 7) return 'DUE_SOON';
    return 'OPEN';
  };

  const handleVerify = (outcome: 'VERIFIED' | 'REJECTED_RESUBMIT') => {
    if (!verifyingUndertaking) return;
    verifyUndertakingCompliance(verifyingUndertaking.id, outcome, verifyingRemarks);

    if (outcome === 'VERIFIED') {
      // Confetti-lite celebration
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#0F9D58', '#138808', '#F28C28']
      });
    }

    setVerifyingUndertaking(null);
  };

  // Document Radar Buckets
  const docBuckets = {
    critical: documents.filter((d) => differenceInDays(parseISO(d.validTo), simDate) <= 30),
    warning: documents.filter((d) => {
      const days = differenceInDays(parseISO(d.validTo), simDate);
      return days > 30 && days <= 60;
    }),
    moderate: documents.filter((d) => {
      const days = differenceInDays(parseISO(d.validTo), simDate);
      return days > 60 && days <= 90;
    }),
    safe: documents.filter((d) => differenceInDays(parseISO(d.validTo), simDate) > 90)
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col font-sans selection:bg-[#E6ECFF] selection:text-[#0F9D58]">
      {/* Header */}
      <Header
        onOpenNotifications={() => setIsNotifOpen(true)}
        accentColor="#0F9D58"
        portalTitle="Compliance Tracker"
      />

      {/* Subheader with Tabs */}
      <div className="bg-white border-b border-[#E1E6F0] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-[#0F1B3D] tracking-tight">
              Institutional Compliance & Follow-Up Tracker
            </h1>
            <p className="text-xs text-[#5B6785]">
              Verify time-bound undertakings, monitor document expiration radars, and issue automated reminders.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#EEF1F8] p-1 rounded-xl text-xs font-semibold text-[#5B6785]">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'kanban' ? 'bg-[#0F9D58] text-white font-bold shadow-xs' : 'hover:text-[#0F1B3D]'
              }`}
            >
              Undertakings Kanban
            </button>
            <button
              onClick={() => setActiveTab('radar')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'radar' ? 'bg-[#0F9D58] text-white font-bold shadow-xs' : 'hover:text-[#0F1B3D]'
              }`}
            >
              Lease & Document Radar
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'reminders' ? 'bg-[#0F9D58] text-white font-bold shadow-xs' : 'hover:text-[#0F1B3D]'
              }`}
            >
              Bulk Reminder Engine
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-6 overflow-x-auto">
        {/* TAB 1: KANBAN BOARD */}
        {activeTab === 'kanban' && (
          <div className="flex gap-4 min-w-[1200px] pb-4">
            {kanbanColumns.map((col) => {
              const colItems = undertakings.filter((u) => getUndertakingColumn(u) === col.id);
              return (
                <div key={col.id} className="flex-1 flex flex-col bg-[#EEF1F8]/60 rounded-2xl p-3 border border-[#E1E6F0] min-w-[220px]">
                  <div className={`flex items-center justify-between pb-2 mb-3 border-b-2 ${col.color}`}>
                    <h3 className="font-extrabold text-xs text-[#0F1B3D] tracking-tight">
                      {col.label}
                    </h3>
                    <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-[#E1E6F0] text-[#5B6785]">
                      {colItems.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[72vh]">
                    {colItems.map((item) => {
                      const daysLeft = differenceInDays(parseISO(item.dueDate), simDate);
                      return (
                        <div
                          key={item.id}
                          onClick={() => setVerifyingUndertaking(item)}
                          className="aegis-card p-3.5 bg-white cursor-pointer hover:border-[#0F9D58] transition-all space-y-2 shadow-xs group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono-num font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-[#0F1B3D]">
                              {item.id}
                            </span>
                            <span className="text-[10px] text-[#5B6785] font-semibold">
                              {item.evidence?.length || 0} Evidence
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-[#0F1B3D] line-clamp-2 leading-snug">
                            {item.condition}
                          </h4>

                          <div className="text-[11px] text-[#5B6785] truncate font-medium">
                            {item.institutionName}
                          </div>

                          <div className="pt-2 border-t border-[#E1E6F0] flex items-center justify-between text-[10px]">
                            <span className="text-[#5B6785] font-mono-num">
                              {daysLeft > 0 ? `${daysLeft}d left` : `${Math.abs(daysLeft)}d overdue`}
                            </span>
                            <span className="text-[#0F9D58] font-bold group-hover:underline">
                              Inspect &rarr;
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: LEASE & DOCUMENT RADAR */}
        {activeTab === 'radar' && (
          <div className="space-y-6">
            <div className="aegis-card p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
                <div className="flex items-center gap-2">
                  <Radar className="w-5 h-5 text-[#0F9D58]" />
                  <h3 className="font-bold text-sm text-[#0F1B3D]">
                    Concentric Expiry Radar: Prescribed Institutional Documents
                  </h3>
                </div>
                <span className="text-xs text-[#5B6785]">
                  Statutory Advance Alert Offsets: 90 / 60 / 30 / 7 Days
                </span>
              </div>

              {/* Radar Buckets */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900">0–30 Days (Critical)</span>
                    <span className="font-mono-num font-bold text-sm text-rose-950">
                      {docBuckets.critical.length}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {docBuckets.critical.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setVerifyingDoc(d)}
                        className="p-2 bg-white rounded-xl border border-rose-200 text-xs cursor-pointer hover:border-rose-400"
                      >
                        <div className="font-bold text-[#0F1B3D] truncate">{d.title}</div>
                        <span className="text-[10px] text-rose-600 block">{d.institutionName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">31–60 Days (Warning)</span>
                    <span className="font-mono-num font-bold text-sm text-amber-950">
                      {docBuckets.warning.length}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {docBuckets.warning.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setVerifyingDoc(d)}
                        className="p-2 bg-white rounded-xl border border-amber-200 text-xs cursor-pointer hover:border-amber-400"
                      >
                        <div className="font-bold text-[#0F1B3D] truncate">{d.title}</div>
                        <span className="text-[10px] text-amber-700 block">{d.institutionName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">61–90 Days (Moderate)</span>
                    <span className="font-mono-num font-bold text-sm text-blue-950">
                      {docBuckets.moderate.length}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {docBuckets.moderate.map((d) => (
                      <div key={d.id} className="p-2 bg-white rounded-xl border border-blue-200 text-xs">
                        <div className="font-bold text-[#0F1B3D] truncate">{d.title}</div>
                        <span className="text-[10px] text-blue-700 block">{d.institutionName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">90+ Days (Safe Standing)</span>
                    <span className="font-mono-num font-bold text-sm text-emerald-950">
                      {docBuckets.safe.length}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {docBuckets.safe.slice(0, 6).map((d) => (
                      <div key={d.id} className="p-2 bg-white rounded-xl border border-emerald-200 text-xs">
                        <div className="font-bold text-[#0F1B3D] truncate">{d.title}</div>
                        <span className="text-[10px] text-emerald-700 block">{d.institutionName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BULK REMINDER SENDER */}
        {activeTab === 'reminders' && (
          <div className="aegis-card p-6 bg-white space-y-4 max-w-2xl">
            <h3 className="font-bold text-sm text-[#0F1B3D]">
              Automated Bulk Reminder Dispatcher
            </h3>
            <p className="text-xs text-[#5B6785]">
              Transmit official system-generated compliance notifications across all institutions with due-soon or expired requirements.
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 font-mono">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6785]">
                System-Generated Notice Template Preview:
              </span>
              <p className="text-[#0F1B3D] italic">
                "URGENT: Statutory Notice under Approval Process Handbook 2026. Your institution has pending compliance conditions due within statutory timelines. Failure to lodge evidence will trigger automatic escalation to the Regional Command."
              </p>
            </div>

            <button
              onClick={() => {
                setIsBulkReminderSent(true);
                addToast({
                  type: 'success',
                  title: 'Bulk Reminders Transmitted',
                  message: `Dispatched system-generated reminders to 14 institutions.`
                });
              }}
              className="px-5 py-2.5 bg-[#0F9D58] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Dispatch Automated Reminders</span>
            </button>
          </div>
        )}
      </main>

      {/* EVIDENCE VERIFICATION DRAWER */}
      {verifyingUndertaking && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto font-sans">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#5B6785]">
                    VERIFICATION DESK · {verifyingUndertaking.id}
                  </span>
                  <h3 className="font-bold text-sm text-[#0F1B3D]">
                    {verifyingUndertaking.institutionName}
                  </h3>
                </div>
                <button onClick={() => setVerifyingUndertaking(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-[#0F1B3D] block mb-1">
                  Mandated Condition:
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-[#0F1B3D]">
                  {verifyingUndertaking.condition}
                </div>
              </div>

              {/* Evidence Preview */}
              <div>
                <label className="text-xs font-bold text-[#0F1B3D] block mb-1">
                  Submitted Evidence Dossier:
                </label>
                {verifyingUndertaking.evidence?.length > 0 ? (
                  <div className="space-y-2">
                    {verifyingUndertaking.evidence.map((ev) => (
                      <div key={ev.id} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-[#0F1B3D] flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#0F9D58]" />
                            <span>{ev.name}</span>
                          </div>
                          <span className="text-[10px] text-[#5B6785]">Size: {ev.size} · Uploaded: {format(parseISO(ev.uploadedAt), 'dd MMM yyyy')}</span>
                        </div>
                        <button
                          onClick={() => addToast({ type: 'info', title: 'Evidence Inspected', message: `Displaying ${ev.name}` })}
                          className="px-2.5 py-1 bg-white border border-[#E1E6F0] hover:bg-slate-100 rounded-lg text-[11px] font-bold"
                        >
                          View PDF
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-xs text-[#5B6785] text-center italic">
                    No evidence submitted by the institution yet.
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-[#0F1B3D] block mb-1">
                  Official Verification Remarks (Mandatory):
                </label>
                <textarea
                  rows={3}
                  value={verifyingRemarks}
                  onChange={(e) => setVerifyingRemarks(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E1E6F0] bg-white font-sans"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E1E6F0] flex gap-2">
              <button
                onClick={() => handleVerify('REJECTED_RESUBMIT')}
                className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-[#D92D20] rounded-xl text-xs font-bold transition-colors"
              >
                Reject & Resubmit
              </button>
              <button
                onClick={() => handleVerify('VERIFIED')}
                className="flex-1 py-2.5 bg-[#0F9D58] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
              >
                Verify & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT VERIFICATION DRAWER */}
      {verifyingDoc && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
                <h3 className="font-bold text-sm text-[#0F1B3D]">
                  Verify Document Renewal: {verifyingDoc.title}
                </h3>
                <button onClick={() => setVerifyingDoc(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#5B6785]">
                Institution: <strong>{verifyingDoc.institutionName}</strong>
              </p>
              <div>
                <label className="text-xs font-bold text-[#0F1B3D] block mb-1">
                  Compliance Officer Verification Remarks:
                </label>
                <textarea
                  rows={3}
                  value={docRemarks}
                  onChange={(e) => setDocRemarks(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E1E6F0]"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  verifyDocumentRenewal(verifyingDoc.id, 'REJECTED', docRemarks);
                  setVerifyingDoc(null);
                }}
                className="flex-1 py-2.5 bg-rose-50 text-[#D92D20] rounded-xl text-xs font-bold"
              >
                Reject Renewal
              </button>
              <button
                onClick={() => {
                  verifyDocumentRenewal(verifyingDoc.id, 'RENEWAL_VERIFIED', docRemarks);
                  setVerifyingDoc(null);
                }}
                className="flex-1 py-2.5 bg-[#0F9D58] text-white rounded-xl text-xs font-bold"
              >
                Verify Renewal
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
