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
import { Application } from '../../types';
import {
  Crown,
  AlertTriangle,
  ArrowUpCircle,
  FileCheck2,
  FileText,
  Printer,
  Scale,
  TrendingUp,
  CheckCircle,
  Clock,
  Send,
  Eye,
  X
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const ExecutiveOverview: React.FC = () => {
  const {
    applications,
    notifications,
    currentUser,
    simDate,
    decideApplication,
    openAuditDrawer,
    addToast
  } = useAegisStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [dockTab, setDockTab] = useState<'briefing' | 'escalations' | 'decisions' | 'league' | 'report'>('briefing');

  // Competent Authority Decision Modal State
  const [decidingApp, setDecidingApp] = useState<Application | null>(null);
  const [decisionOutcome, setDecisionOutcome] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [decisionReason, setDecisionReason] = useState(
    'Sanctioned approval under Section 10(k) AICTE Act 1987 following satisfactory scrutiny and EVC verification.'
  );

  // Top KPIs
  const totalInProcess = applications.filter((a) => a.currentStage !== 'CLOSED').length;
  const totalOverdue = applications.filter((a) => a.status === 'OVERDUE' || a.status === 'ESCALATED').length;
  const escalatedToAuthority = notifications.filter((n) => n.toRole === 'SENIOR_AUTHORITY').length;
  const complianceRate = Math.round(
    ((applications.length - totalOverdue) / (applications.length || 1)) * 100
  );

  // Decisions Awaiting Competent Authority
  const decisionsAwaiting = applications.filter(
    (a) => a.currentStage === 'DECISION' || a.currentStage === 'SAC_SHC' || a.status === 'ON_TRACK'
  ).slice(0, 4);

  // Top of Escalation Ladder Items
  const topEscalations = notifications.filter((n) => n.kind === 'ESCALATION').slice(0, 4);

  // Region League Table
  const regionLeague = [
    { name: 'Western Region (WRO)', rate: 92, trend: '+3%', status: 'Leading' },
    { name: 'Southern Region (SRO)', rate: 88, trend: '+1%', status: 'Compliant' },
    { name: 'Central Region (CRO)', rate: 84, trend: '-2%', status: 'Attention' },
    { name: 'Northern Region (NRO)', rate: 81, trend: '+0%', status: 'Attention' },
    { name: 'Eastern Region (ERO)', rate: 76, trend: '-4%', status: 'Lagging' }
  ];

  const handleDecisionSubmit = () => {
    if (!decidingApp) return;
    const res = decideApplication(decidingApp.id, decisionOutcome, decisionReason);
    if (res.success) {
      setDecidingApp(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col font-sans selection:bg-[#E6ECFF] selection:text-[#1F3A8A]">
      {/* Top Header */}
      <Header
        onOpenNotifications={() => setIsNotifOpen(true)}
        accentColor="#1F3A8A"
        portalTitle="Senior Authority Executive Overview"
      />

      {/* Presentation Full-Bleed Briefing Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-28">
        {/* TAB 1: BRIEFING OVERVIEW */}
        {dockTab === 'briefing' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Executive Greeting Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E1E6F0] pb-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C9A227]">
                  Council Chamber · Executive Briefing
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1B3D] tracking-tight mt-1">
                  Today's National Approval Briefing
                </h1>
                <p className="text-xs text-[#5B6785]">
                  AICTE Chairman & Member Secretary Sovereign Oversight · Simulated Date:{' '}
                  {format(simDate, 'EEEE, dd MMMM yyyy')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="p-2.5 rounded-2xl bg-gradient-to-r from-[#1F3A8A] to-[#0A5CD6] text-[#C9A227] shadow-lg">
                  <Crown className="w-6 h-6" />
                </span>
              </div>
            </div>

            {/* 4 Big KPIs Strip (Animated Presentation Counters) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="aegis-card p-6 bg-white border-t-4 border-t-[#1F3A8A]">
                <span className="text-xs font-bold text-[#5B6785] block">Applications In Pipeline</span>
                <span className="font-mono-num font-extrabold text-3xl text-[#0F1B3D] block mt-1">
                  {totalInProcess}
                </span>
                <span className="text-[11px] text-[#138808] font-semibold mt-1 block">
                  Active statutory cycles
                </span>
              </div>

              <div className="aegis-card p-6 bg-white border-t-4 border-t-[#F28C28]">
                <span className="text-xs font-bold text-[#5B6785] block">Past SLA Due Date</span>
                <span className="font-mono-num font-extrabold text-3xl text-[#F28C28] block mt-1">
                  {totalOverdue}
                </span>
                <span className="text-[11px] text-[#5B6785] font-semibold mt-1 block">
                  Requires regional follow-up
                </span>
              </div>

              <div className="aegis-card p-6 bg-white border-t-4 border-t-[#D92D20]">
                <span className="text-xs font-bold text-[#5B6785] block">Escalated to Authority</span>
                <span className="font-mono-num font-extrabold text-3xl text-[#D92D20] block mt-1">
                  {escalatedToAuthority}
                </span>
                <span className="text-[11px] text-rose-700 font-semibold mt-1 block">
                  Top-of-ladder escalations
                </span>
              </div>

              <div className="aegis-card p-6 bg-white border-t-4 border-t-[#138808]">
                <span className="text-xs font-bold text-[#5B6785] block">National Compliance Rate</span>
                <span className="font-mono-num font-extrabold text-3xl text-[#138808] block mt-1">
                  {complianceRate}%
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                  Target: &ge;85% SLA benchmark
                </span>
              </div>
            </div>

            {/* Decisions Awaiting Competent Authority Shelf (Human-Only Action!) */}
            <div className="aegis-card p-6 bg-white space-y-4 border border-[#C9A227]/30 shadow-md">
              <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#1F3A8A]" />
                  <h3 className="font-extrabold text-sm text-[#0F1B3D] uppercase tracking-wide">
                    Decisions Awaiting Competent Authority Action
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#E6ECFF] text-[#1F3A8A] px-2.5 py-1 rounded-full">
                  Statutory Sovereign Decision
                </span>
              </div>

              <div className="divide-y divide-[#E1E6F0]">
                {decisionsAwaiting.map((app) => (
                  <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num font-bold text-sm text-[#0F1B3D]">{app.id}</span>
                        <span className="text-xs font-bold text-[#1F3A8A]">{app.institutionName}</span>
                        <StatusChip status={app.status} size="sm" />
                      </div>
                      <p className="text-xs text-[#5B6785] mt-1">
                        Region: {app.region} · Programme: {app.programme} ({app.studentIntake} seats) · Pathway: {app.pathway}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openAuditDrawer('APPLICATION', app.id)}
                        className="px-3 py-1.5 border border-[#E1E6F0] hover:bg-slate-50 text-[#0F1B3D] rounded-xl text-xs font-semibold"
                      >
                        Examine Dossier
                      </button>
                      <button
                        onClick={() => {
                          setDecidingApp(app);
                          setDecisionOutcome('APPROVED');
                        }}
                        className="px-4 py-1.5 bg-[#1F3A8A] hover:bg-[#0F1B3D] text-[#C9A227] rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Decide (Sign)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Region League Table with Trend Arrows */}
            <div className="aegis-card p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
                <h3 className="font-extrabold text-sm text-[#0F1B3D] uppercase tracking-wide">
                  Regional Office Performance League Table
                </h3>
                <span className="text-xs text-[#5B6785]">Updated automatically per cycle</span>
              </div>

              <div className="space-y-3">
                {regionLeague.map((reg, idx) => (
                  <div key={idx} className="p-3 bg-[#F7F8FC] rounded-2xl border border-[#E1E6F0] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono-num font-extrabold text-sm text-[#5B6785] w-6">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-[#0F1B3D]">{reg.name}</span>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="font-mono-num font-bold text-sm text-[#0F1B3D]">{reg.rate}%</span>
                        <span className="text-[10px] text-[#138808] font-bold ml-2">{reg.trend}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          reg.status === 'Leading'
                            ? 'bg-emerald-100 text-emerald-900'
                            : reg.status === 'Attention'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {reg.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TOP OF LADDER ESCALATIONS */}
        {dockTab === 'escalations' && (
          <div className="aegis-card p-6 bg-white space-y-6">
            <h3 className="font-bold text-base text-[#0F1B3D]">
              Executive Escalation Desk (Crossed Top of Ladder)
            </h3>
            <div className="space-y-3">
              {topEscalations.map((esc) => (
                <div key={esc.id} className="p-4 bg-rose-50/50 rounded-2xl border border-rose-300 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-rose-900 text-[10px] px-2 py-0.5 bg-rose-200 rounded">
                      CRITICAL STATUTORY ESCALATION
                    </span>
                    <span className="text-[10px] text-[#5B6785] font-mono-num">
                      {format(parseISO(esc.createdAt), 'dd MMM yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="font-bold text-[#0F1B3D]">{esc.message}</p>
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() =>
                        addToast({
                          type: 'success',
                          title: 'Directive Transmitted',
                          message: 'Chairman directive issued to Regional Officer.'
                        })
                      }
                      className="px-3 py-1 bg-[#1F3A8A] text-white rounded-lg font-bold text-xs"
                    >
                      Issue Executive Directive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DECISIONS SHELF */}
        {dockTab === 'decisions' && (
          <div className="aegis-card p-6 bg-white space-y-4">
            <h3 className="font-bold text-base text-[#0F1B3D]">
              Sovereign Decisions Awaiting Statutory Sanction
            </h3>
            <p className="text-xs text-[#5B6785]">
              By law, final approval or rejection of an institution must be executed by an authorised human official with a mandatory signed reason.
            </p>
            <div className="space-y-2">
              {decisionsAwaiting.map((app) => (
                <div key={app.id} className="p-4 bg-[#F7F8FC] rounded-2xl border border-[#E1E6F0] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono-num font-bold text-[#0F1B3D]">{app.id}</span>
                    <h4 className="font-bold text-[#0F1B3D]">{app.institutionName}</h4>
                    <span className="text-[11px] text-[#5B6785]">{app.programme}</span>
                  </div>
                  <button
                    onClick={() => {
                      setDecidingApp(app);
                      setDecisionOutcome('APPROVED');
                    }}
                    className="px-4 py-2 bg-[#1F3A8A] text-[#C9A227] rounded-xl text-xs font-bold"
                  >
                    Take Decision
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BRIEFING NOTE EXPORT */}
        {dockTab === 'report' && (
          <div className="aegis-card p-6 bg-white space-y-4 max-w-2xl">
            <h3 className="font-bold text-base text-[#0F1B3D]">
              Council Executive Briefing Note (Draft Export)
            </h3>
            <pre className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono whitespace-pre-wrap text-[#0F1B3D]">
{`AICTE EXECUTIVE BRIEFING NOTE
Date: ${format(simDate, 'dd MMMM yyyy')}
Authority: Prof. T. G. Sitharam, Chairman AICTE

1. PIPELINE OVERVIEW:
Total Applications: ${applications.length}
SLA Compliance: ${complianceRate}%
Escalations Pending: ${escalatedToAuthority}

2. STATUTORY GUARANTEE:
Automated alerts operate purely in support of scrutiny officers. Final authority decisions remain strictly non-automated in full adherence to the AICTE Act.`}
            </pre>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#1F3A8A] text-white rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print Briefing Note
            </button>
          </div>
        )}
      </main>

      {/* Presentation-Style Bottom Dock Navigation */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-[#E1E6F0] shadow-2xl flex items-center gap-2 select-none no-print">
        {[
          { id: 'briefing', label: 'Briefing' },
          { id: 'escalations', label: 'Escalations' },
          { id: 'decisions', label: 'Decisions' },
          { id: 'report', label: 'Briefing Note' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setDockTab(item.id as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              dockTab === item.id
                ? 'bg-[#1F3A8A] text-white shadow-sm'
                : 'text-[#5B6785] hover:text-[#0F1B3D]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* SOVEREIGN DECISION MODAL (HUMAN-ONLY, MANDATORY REASON) */}
      {decidingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-[#C9A227]/40 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#C9A227]" />
                <h3 className="font-bold text-sm text-[#0F1B3D]">
                  Statutory Decision: {decidingApp.id}
                </h3>
              </div>
              <button onClick={() => setDecidingApp(null)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <p className="text-xs text-[#5B6785]">
              Institution: <strong>{decidingApp.institutionName}</strong> ({decidingApp.programme})
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0F1B3D]">Decision Outcome:</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDecisionOutcome('APPROVED')}
                  className={`py-2 rounded-xl border text-center transition-all ${
                    decisionOutcome === 'APPROVED'
                      ? 'bg-[#138808] text-white border-[#138808]'
                      : 'bg-white text-slate-700'
                  }`}
                >
                  Approve / Grant Approval
                </button>
                <button
                  type="button"
                  onClick={() => setDecisionOutcome('REJECTED')}
                  className={`py-2 rounded-xl border text-center transition-all ${
                    decisionOutcome === 'REJECTED'
                      ? 'bg-[#D92D20] text-white border-[#D92D20]'
                      : 'bg-white text-slate-700'
                  }`}
                >
                  Reject Approval
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0F1B3D]">
                Mandatory Statutory Signed Reason (Min 10 characters):
              </label>
              <textarea
                rows={3}
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E1E6F0] bg-slate-50 font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDecidingApp(null)} className="px-4 py-2 text-xs font-semibold text-[#5B6785]">
                Cancel
              </button>
              <button
                onClick={handleDecisionSubmit}
                className="px-5 py-2 bg-[#1F3A8A] hover:bg-[#0F1B3D] text-[#C9A227] rounded-xl text-xs font-bold shadow-md"
              >
                Sign & Execute Sovereign Decision
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
