import React, { useState } from 'react';
import { useAegisStore } from '../../store';
import { InstitutionShell } from './InstitutionShell';
import { ComplianceGauge } from '../../shared/ComplianceGauge';
import { StageStepper } from '../../shared/StageStepper';
import { StatusChip } from '../../shared/StatusChip';
import {
  Clock,
  ArrowRight,
  UploadCloud,
  Calendar,
  CheckCircle2,
  AlertCircle,
  History,
  Send
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

export const InstitutionView: React.FC = () => {
  const {
    currentUser,
    institutions,
    applications,
    undertakings,
    documents,
    evcs,
    notifications,
    simDate,
    respondToDeficiencies,
    uploadUndertakingEvidence,
    uploadDocumentRenewal,
    openAuditDrawer,
    addToast
  } = useAegisStore();

  const currentInst = institutions.find((i) => i.id === currentUser.institutionId) || institutions[0];
  const myApps = applications.filter((a) => a.institutionId === currentInst.id);
  const myUndertakings = undertakings.filter((u) => u.institutionId === currentInst.id);
  const myDocs = documents.filter((d) => d.institutionId === currentInst.id);
  const myEvc = evcs.find((e) => e.institutionId === currentInst.id);

  // Deficiency Wizard State
  const [activeDeficiencyApp, setActiveDeficiencyApp] = useState<any>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardRemarks, setWizardRemarks] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Evidence Uploader Modal for Undertakings
  const [selectedUndertaking, setSelectedUndertaking] = useState<any>(null);
  const [undertakingFileName, setUndertakingFileName] = useState('');

  // Renewal Uploader Modal for Documents
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [renewalFileName, setRenewalFileName] = useState('');

  // Handle Deficiency Wizard Submit
  const handleDeficiencySubmit = () => {
    if (!activeDeficiencyApp) return;
    respondToDeficiencies(
      activeDeficiencyApp.id,
      wizardRemarks || 'Deficiencies rectified with updated certificates',
      uploadedFiles.map((f, i) => ({
        id: `EVD-${Date.now()}-${i}`,
        name: f.name,
        url: '/sample_data/proof.pdf',
        uploadedAt: new Date().toISOString(),
        size: f.size,
        fileType: 'application/pdf',
        status: 'PENDING'
      }))
    );
    setActiveDeficiencyApp(null);
    setWizardStep(1);
    setUploadedFiles([]);
    setWizardRemarks('');
  };

  // Urgent attention items (Hero 1: Lease expires in 21 days; Undertaking due in 5 days)
  const attentionItems = [
    ...myDocs
      .filter((d) => d.status === 'EXPIRING' || d.status === 'EXPIRED')
      .map((d) => {
        const days = differenceInDays(parseISO(d.validTo), simDate);
        return {
          id: `ATTN-DOC-${d.id}`,
          title: `Document Expiry: ${d.title}`,
          subtitle: days > 0 ? `Expires in ${days} statutory days` : `Expired ${Math.abs(days)} days ago!`,
          urgency: days <= 7 ? 'CRITICAL' : 'HIGH',
          days,
          actionLabel: 'Upload Renewal',
          onAction: () => setSelectedDoc(d),
          type: 'DOCUMENT'
        };
      }),
    ...myUndertakings
      .filter((u) => u.status === 'OPEN' || u.status === 'OVERDUE' || u.status === 'REJECTED_RESUBMIT')
      .map((u) => {
        const days = differenceInDays(parseISO(u.dueDate), simDate);
        return {
          id: `ATTN-UND-${u.id}`,
          title: `Compliance Undertaking: ${u.condition.slice(0, 50)}...`,
          subtitle: days > 0 ? `Target due date in ${days} days` : `Overdue by ${Math.abs(days)} days!`,
          urgency: days <= 3 ? 'CRITICAL' : 'HIGH',
          days,
          actionLabel: 'Submit Evidence',
          onAction: () => setSelectedUndertaking(u),
          type: 'UNDERTAKING'
        };
      }),
    ...myApps
      .filter((a) => a.status === 'RETURNED')
      .map((a) => ({
        id: `ATTN-APP-${a.id}`,
        title: `Application ${a.id} Returned for Deficiencies`,
        subtitle: `${a.deficiencies?.length || 1} observation(s) need rectification`,
        urgency: 'CRITICAL',
        days: 7,
        actionLabel: 'Respond to Deficiencies',
        onAction: () => {
          setActiveDeficiencyApp(a);
          setWizardStep(1);
        },
        type: 'APPLICATION'
      }))
  ];

  return (
    <InstitutionShell>
      {(activeTab, setActiveTab) => (
        <div className="space-y-8 font-sans">
          {/* TAB 1: ACTION CENTRE (DASHBOARD) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Top Row: Health Gauge & Institution Status Banner */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Health Radial Gauge Card */}
                <div className="aegis-card p-6 flex flex-col items-center justify-between text-center bg-white relative overflow-hidden">
                  <div className="w-full flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B6785]">
                      Standing & Health
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E6ECFF] text-[#0A5CD6] font-bold">
                      AY 2026-27
                    </span>
                  </div>

                  <ComplianceGauge score={currentInst.complianceScore} size={140} />

                  <p className="text-xs text-[#5B6785] mt-3">
                    Calculated from institutional lease tenure, undertakings fulfillment, and zero statutory show-cause notices.
                  </p>
                </div>

                {/* Priority Overview & Quick Stats */}
                <div className="lg:col-span-2 aegis-card p-6 flex flex-col justify-between bg-gradient-to-br from-white to-[#F0F4FF] border-[#0A5CD6]/20">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0A5CD6]">
                        Executive Compliance Summary
                      </span>
                      <button
                        onClick={() => openAuditDrawer('INSTITUTION', currentInst.id)}
                        className="text-xs text-[#1F3A8A] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <History className="w-3.5 h-3.5" /> Complete Audit History
                      </button>
                    </div>

                    <h2 className="text-xl font-extrabold text-[#0F1B3D] mt-2">
                      Approval & Scrutiny Standings for Current Cycle
                    </h2>
                    <p className="text-xs text-[#5B6785] mt-1 leading-relaxed">
                      AICTE Approvals Bureau monitors continuous compliance under Chapter II & III of the Approval Process Handbook.
                    </p>

                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="p-3 bg-white rounded-2xl border border-[#E1E6F0] shadow-xs">
                        <span className="text-[11px] text-[#5B6785] block">Applications</span>
                        <span className="text-2xl font-mono-num font-extrabold text-[#0F1B3D]">
                          {myApps.length}
                        </span>
                        <span className="text-[10px] text-emerald-700 block font-medium mt-0.5">
                          Active in pipeline
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-2xl border border-[#E1E6F0] shadow-xs">
                        <span className="text-[11px] text-[#5B6785] block">Time-bound Undertakings</span>
                        <span className="text-2xl font-mono-num font-extrabold text-[#F28C28]">
                          {myUndertakings.filter((u) => u.status === 'OPEN').length}
                        </span>
                        <span className="text-[10px] text-[#5B6785] block font-medium mt-0.5">
                          Awaiting compliance evidence
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-2xl border border-[#E1E6F0] shadow-xs">
                        <span className="text-[11px] text-[#5B6785] block">Expiring Documents</span>
                        <span className="text-2xl font-mono-num font-extrabold text-[#D92D20]">
                          {myDocs.filter((d) => d.status === 'EXPIRING' || d.status === 'EXPIRED').length}
                        </span>
                        <span className="text-[10px] text-rose-600 block font-medium mt-0.5">
                          Requires statutory renewal
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E1E6F0] flex items-center justify-between text-xs text-[#5B6785]">
                    <span>Regional Jurisdiction: {currentInst.region} Regional Office (WRO)</span>
                    <span className="font-semibold text-[#0F1B3D]">AICTE Nodal Officer: Er. Vikram Deshmukh</span>
                  </div>
                </div>
              </div>

              {/* "What Needs Your Attention" Carousel of Urgent Action Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F28C28] animate-pulse" />
                    <h3 className="text-sm font-extrabold text-[#0F1B3D] tracking-tight uppercase">
                      What Needs Your Immediate Attention
                    </h3>
                  </div>
                  <span className="text-xs text-[#5B6785]">
                    {attentionItems.length} action{attentionItems.length === 1 ? '' : 's'} required
                  </span>
                </div>

                {attentionItems.length === 0 ? (
                  <div className="aegis-card p-6 text-center text-xs text-[#5B6785]">
                    <CheckCircle2 className="w-8 h-8 text-[#138808] mx-auto mb-2" />
                    All statutory requirements, undertakings, and documents are currently up-to-date!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attentionItems.map((item) => (
                      <div
                        key={item.id}
                        className={`aegis-card p-4 flex flex-col justify-between border-l-4 ${
                          item.urgency === 'CRITICAL'
                            ? 'border-l-[#D92D20] bg-rose-50/20'
                            : 'border-l-[#F28C28] bg-amber-50/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono uppercase font-bold text-[#5B6785]">
                              {item.type}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.days <= 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-900 animate-pulse'
                              }`}
                            >
                              {item.subtitle}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-[#0F1B3D] leading-snug">
                            {item.title}
                          </h4>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#E1E6F0] flex items-center justify-between">
                          <span className="text-[10px] text-[#5B6785] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#F28C28]" /> Mandatory deadline
                          </span>
                          <button
                            onClick={item.onAction}
                            className="px-3 py-1.5 rounded-xl bg-[#0A5CD6] hover:bg-[#0747a6] text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <span>{item.actionLabel}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* My Applications (Horizontal Stage Stepper per Application) */}
              <div className="aegis-card p-6 bg-white space-y-6">
                <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#0F1B3D] uppercase tracking-wide">
                      My Applications Pipeline
                    </h3>
                    <p className="text-xs text-[#5B6785]">
                      Track real-time progress across Scrutiny, EVC inspections, and Competent Authority sanctions.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('applications')}
                    className="text-xs font-bold text-[#0A5CD6] hover:underline"
                  >
                    View Detailed Dossiers &rarr;
                  </button>
                </div>

                <div className="space-y-6 divide-y divide-[#E1E6F0]">
                  {myApps.map((app) => (
                    <div key={app.id} className="pt-4 first:pt-0 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono-num font-bold text-sm text-[#0F1B3D]">
                              {app.id}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E6ECFF] text-[#1F3A8A]">
                              {app.type} Approval
                            </span>
                            <span className="text-xs text-[#5B6785]">
                              · {app.programme} ({app.studentIntake} seats)
                            </span>
                          </div>
                          <span className="text-[11px] text-[#5B6785] mt-0.5 block">
                            Pathway: {app.pathway.replace(/_/g, ' ')} · Entered stage on{' '}
                            {format(parseISO(app.stageEnteredAt), 'dd MMM yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusChip status={app.status} />
                          <button
                            onClick={() => openAuditDrawer('APPLICATION', app.id)}
                            title="Audit history"
                            className="p-1.5 hover:bg-[#EEF1F8] rounded-lg text-[#5B6785]"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Pathway-Aware Stepper */}
                      <StageStepper
                        pathway={app.pathway}
                        currentStage={app.currentStage}
                        status={app.status}
                      />

                      {/* Returned / Deficiency Warning Banner if applicable */}
                      {app.status === 'RETURNED' && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 text-amber-900">
                            <AlertCircle className="w-4 h-4 text-[#F28C28] shrink-0" />
                            <span>
                              <strong>Action Required:</strong> Application returned with{' '}
                              {app.deficiencies?.length || 1} deficiency observation(s).
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setActiveDeficiencyApp(app);
                              setWizardStep(1);
                            }}
                            className="px-3 py-1 bg-[#F28C28] hover:bg-[#d97718] text-white rounded-lg font-bold text-xs shrink-0"
                          >
                            Respond Now
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar Strip of Upcoming Deadlines & EVC Scheduled Visit */}
              <div className="aegis-card p-6 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#0F1B3D] uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0A5CD6]" />
                    <span>Statutory Calendar & Inspection Dates</span>
                  </h3>
                  <span className="text-xs text-[#5B6785]">Synchronised with Simulated Clock</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {myEvc?.scheduledFor ? (
                    <div className="p-4 rounded-2xl bg-[#E6ECFF] border border-[#0A5CD6]/30 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0A5CD6] text-white flex flex-col items-center justify-center shrink-0 font-bold leading-none">
                        <span className="text-[10px] font-normal uppercase">
                          {format(parseISO(myEvc.scheduledFor), 'MMM')}
                        </span>
                        <span className="text-base font-mono-num">
                          {format(parseISO(myEvc.scheduledFor), 'dd')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A5CD6] block">
                          EVC On-Site Inspection
                        </span>
                        <h5 className="text-xs font-bold text-[#0F1B3D]">
                          Expert Visiting Committee
                        </h5>
                        <p className="text-[11px] text-[#5B6785] mt-0.5">
                          Panel: {myEvc.panel?.join(', ') || 'AICTE Nominated Experts'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-[#5B6785]">
                      <Calendar className="w-6 h-6 text-slate-400" />
                      <span>No EVC inspection scheduled this week.</span>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-white border border-[#E1E6F0] flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF1F8] text-[#0F1B3D] flex flex-col items-center justify-center shrink-0 font-bold leading-none">
                      <span className="text-[10px] text-[#5B6785]">NOV</span>
                      <span className="text-base font-mono-num">20</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#F28C28] block">
                        Lease Milestone
                      </span>
                      <h5 className="text-xs font-bold text-[#0F1B3D]">
                        Campus Lease Validity
                      </h5>
                      <p className="text-[11px] text-[#5B6785] mt-0.5">
                        Mandatory 30-year renewal deadline
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#E1E6F0] flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF1F8] text-[#0F1B3D] flex flex-col items-center justify-center shrink-0 font-bold leading-none">
                      <span className="text-[10px] text-[#5B6785]">NOV</span>
                      <span className="text-base font-mono-num">04</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#138808] block">
                        Undertaking Target
                      </span>
                      <h5 className="text-xs font-bold text-[#0F1B3D]">
                        AI Lab Internet Bandwidth
                      </h5>
                      <p className="text-[11px] text-[#5B6785] mt-0.5">
                        Upload speed test certificate
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY APPLICATIONS LIST & DETAIL */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#0F1B3D]">
                    Institutional Applications Dossier
                  </h2>
                  <p className="text-xs text-[#5B6785]">
                    Comprehensive history of scrutiny observations, checklists, and statutory transitions.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {myApps.map((app) => (
                  <div key={app.id} className="aegis-card p-6 bg-white space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E1E6F0] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-num font-bold text-base text-[#0F1B3D]">
                            {app.id}
                          </span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E6ECFF] text-[#1F3A8A]">
                            {app.type}
                          </span>
                          <StatusChip status={app.status} />
                        </div>
                        <span className="text-xs text-[#5B6785] mt-0.5 block">
                          Stage: {app.currentStage} · SLA Due Date:{' '}
                          {format(parseISO(app.slaDueAt), 'dd MMM yyyy')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {app.status === 'RETURNED' && (
                          <button
                            onClick={() => {
                              setActiveDeficiencyApp(app);
                              setWizardStep(1);
                            }}
                            className="px-3 py-1.5 bg-[#F28C28] hover:bg-[#d97718] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Respond to Deficiencies</span>
                          </button>
                        )}
                        <button
                          onClick={() => openAuditDrawer('APPLICATION', app.id)}
                          className="px-3 py-1.5 border border-[#E1E6F0] hover:bg-[#F7F8FC] rounded-xl text-xs font-medium text-[#0F1B3D] flex items-center gap-1.5"
                        >
                          <History className="w-3.5 h-3.5 text-[#5B6785]" />
                          <span>Audit Trail</span>
                        </button>
                      </div>
                    </div>

                    {/* Stepper */}
                    <StageStepper pathway={app.pathway} currentStage={app.currentStage} status={app.status} />

                    {/* Checklists or Observations */}
                    {app.scrutinyChecklist && (
                      <div className="mt-4 pt-3 border-t border-[#E1E6F0]">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6785] mb-2">
                          Statutory Scrutiny Parameters & Observations
                        </h4>
                        <div className="divide-y divide-[#E1E6F0] border border-[#E1E6F0] rounded-xl overflow-hidden bg-[#F7F8FC]">
                          {app.scrutinyChecklist.map((item) => (
                            <div key={item.paramId} className="p-3 flex items-start justify-between gap-4 text-xs">
                              <div>
                                <span className="font-bold text-[#0F1B3D]">{item.title}</span>
                                <span className="text-[11px] text-[#5B6785] block mt-0.5">
                                  Category: {item.category} · Remarks: {item.remarks}
                                </span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                                  item.status === 'PASS'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: UNDERTAKINGS */}
          {activeTab === 'undertakings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#0F1B3D]">
                    Time-Bound Institutional Undertakings
                  </h2>
                  <p className="text-xs text-[#5B6785]">
                    Conditions mandated by Committees or Authorities requiring verifiable evidence by statutory deadline.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myUndertakings.map((u) => {
                  const daysLeft = differenceInDays(parseISO(u.dueDate), simDate);
                  return (
                    <div key={u.id} className="aegis-card p-5 bg-white flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                            {u.id} · {u.category}
                          </span>
                          <StatusChip status={u.status} />
                        </div>

                        <h4 className="text-xs font-bold text-[#0F1B3D] leading-snug">
                          {u.condition}
                        </h4>

                        <div className="mt-3 flex items-center justify-between text-xs text-[#5B6785]">
                          <span>Due Date: {format(parseISO(u.dueDate), 'dd MMM yyyy')}</span>
                          <span className="font-semibold text-[#0F1B3D]">
                            {daysLeft > 0 ? `${daysLeft} days remaining` : `${Math.abs(daysLeft)} days overdue`}
                          </span>
                        </div>

                        {u.evidence?.length > 0 && (
                          <div className="mt-3 p-2 bg-[#F7F8FC] rounded-xl border border-[#E1E6F0] text-xs">
                            <span className="text-[10px] font-semibold text-[#5B6785] block">
                              Uploaded Evidence:
                            </span>
                            {u.evidence.map((ev) => (
                              <div key={ev.id} className="flex items-center justify-between mt-1 text-[#0F1B3D]">
                                <span className="truncate max-w-[200px] text-xs">
                                  📄 {ev.name} ({ev.size})
                                </span>
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                  {ev.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#E1E6F0] flex items-center justify-between">
                        <button
                          onClick={() => openAuditDrawer('UNDERTAKING', u.id)}
                          className="text-xs text-[#5B6785] hover:text-[#0F1B3D] flex items-center gap-1"
                        >
                          <History className="w-3.5 h-3.5" /> History
                        </button>

                        {u.status !== 'VERIFIED' && u.status !== 'CLOSED' && (
                          <button
                            onClick={() => setSelectedUndertaking(u)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#0A5CD6] hover:bg-[#0747a6] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Submit Evidence</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: DOCUMENTS & LEASE VAULT */}
          {activeTab === 'vault' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#0F1B3D]">
                    Prescribed Documents & Lease Vault
                  </h2>
                  <p className="text-xs text-[#5B6785]">
                    Validity radar for registered land lease deeds, municipal fire safety NOCs, and university affiliations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myDocs.map((doc) => {
                  const daysToExpiry = differenceInDays(parseISO(doc.validTo), simDate);
                  const isExpiring = doc.status === 'EXPIRING' || (daysToExpiry > 0 && daysToExpiry <= 30);
                  const isExpired = doc.status === 'EXPIRED' || daysToExpiry <= 0;

                  return (
                    <div key={doc.id} className="aegis-card p-5 bg-white flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EEF1F8] text-[#0F1B3D] font-bold">
                            {doc.type}
                          </span>
                          <StatusChip status={doc.status} />
                        </div>

                        <h4 className="text-xs font-bold text-[#0F1B3D] leading-snug">
                          {doc.title}
                        </h4>

                        <div className="mt-4 space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-[#5B6785]">
                            <span>Validity Window:</span>
                            <span className="font-mono-num font-semibold text-[#0F1B3D]">
                              {format(parseISO(doc.validFrom), 'dd/MM/yy')} &rarr;{' '}
                              {format(parseISO(doc.validTo), 'dd/MM/yy')}
                            </span>
                          </div>

                          {/* Validity Bar (Green -> Amber -> Red) */}
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isExpired
                                  ? 'bg-[#D92D20] w-full'
                                  : isExpiring
                                  ? 'bg-[#F28C28] w-4/5 animate-pulse'
                                  : 'bg-[#138808] w-1/3'
                              }`}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#5B6785]">Status Countdown:</span>
                            <span
                              className={`font-bold ${
                                isExpired
                                  ? 'text-[#D92D20]'
                                  : isExpiring
                                  ? 'text-[#F28C28]'
                                  : 'text-[#138808]'
                              }`}
                            >
                              {daysToExpiry > 0 ? `${daysToExpiry} days left` : `Expired ${Math.abs(daysToExpiry)} days ago`}
                            </span>
                          </div>
                        </div>

                        {doc.renewalEvidence && (
                          <div className="mt-3 p-2 bg-sky-50 rounded-lg border border-sky-200 text-[11px] text-sky-900">
                            <strong>Renewal Submitted:</strong> {doc.renewalEvidence.name} (Under AICTE Review)
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#E1E6F0] flex items-center justify-between">
                        <span className="text-[11px] text-[#5B6785] truncate max-w-[140px]">
                          📎 {doc.fileRef}
                        </span>
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="px-3 py-1 rounded-xl bg-[#0A5CD6] hover:bg-[#0747a6] text-white text-xs font-bold transition-colors"
                        >
                          Upload Renewal
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: EVC VISIT & PANEL */}
          {activeTab === 'evc' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#0F1B3D]">
                    Expert Visiting Committee (EVC) Schedule & Panel
                  </h2>
                  <p className="text-xs text-[#5B6785]">
                    Inspection schedule, panel expert credentials, and institutional readiness checklist.
                  </p>
                </div>
              </div>

              {myEvc ? (
                <div className="aegis-card p-6 bg-white space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1E6F0] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-[#0F1B3D]">
                          Inspection Case: {myEvc.id}
                        </span>
                        <StatusChip status={myEvc.status} />
                      </div>
                      <span className="text-xs text-[#5B6785] mt-0.5 block">
                        Target Schedule Deadline:{' '}
                        {format(parseISO(myEvc.scheduleTargetBy), 'dd MMM yyyy')}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        addToast({
                          type: 'success',
                          title: 'Availability Confirmed',
                          message: 'Institution availability confirmed to EVC Coordination Cell.'
                        })
                      }
                      className="px-4 py-2 bg-[#138808] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                    >
                      Confirm Institutional Availability
                    </button>
                  </div>

                  {/* Panel Details */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6785] mb-2">
                      AICTE Nominated Panel Experts
                    </h4>
                    {myEvc.panel?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {myEvc.panel.map((exp, idx) => (
                          <div key={idx} className="p-3 bg-[#F7F8FC] rounded-xl border border-[#E1E6F0] flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1F3A8A] text-white flex items-center justify-center font-bold text-xs">
                              E{idx + 1}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-[#0F1B3D]">{exp}</div>
                              <span className="text-[10px] text-[#5B6785]">Statutory Technical Expert</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#5B6785] italic">
                        Panel constitution underway by the National EVC Coordination Cell.
                      </p>
                    )}
                  </div>

                  {/* Readiness Checklist */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6785] mb-2">
                      Mandatory Physical & Digital Readiness Checklist
                    </h4>
                    <div className="space-y-2 text-xs text-[#0F1B3D]">
                      {[
                        'Original registered sale deed / 30-year lease agreement verified with land records',
                        'Approved building blueprints signed by municipal architect',
                        'Live demonstration capability of AI Lab high-speed broadband network',
                        'Original faculty service books, Form 16, and biometric attendance records',
                        'Fire safety and barrier-free ramp accessibility readiness'
                      ].map((chk, i) => (
                        <div key={i} className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-[#138808] shrink-0" />
                          <span>{chk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aegis-card p-8 text-center text-xs text-[#5B6785]">
                  No EVC inspection scheduled for your institution at this stage.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: OFFICIAL NOTICES */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#0F1B3D]">
                  Official Notices & System Alerts
                </h2>
                <p className="text-xs text-[#5B6785]">
                  Automated deadline warnings and communications from AICTE Regional Officers.
                </p>
              </div>

              <div className="space-y-3">
                {notifications
                  .filter((n) => n.toRole === 'INSTITUTION' || n.toUser === currentInst.id)
                  .map((notif) => (
                    <div key={notif.id} className="aegis-card p-4 bg-white flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
                            System-generated
                          </span>
                          <span className="text-[10px] font-mono-num text-[#5B6785]">
                            {format(parseISO(notif.createdAt), 'dd MMM yyyy · HH:mm')}
                          </span>
                        </div>
                        <p className="text-xs text-[#0F1B3D] font-medium leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                      <StatusChip status={notif.kind} size="sm" />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* RESPOND TO DEFICIENCY: 3-STEP GUIDED WIZARD MODAL */}
          {activeDeficiencyApp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl border border-[#E1E6F0] overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 bg-[#1F3A8A] text-white flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm">
                      Respond to Deficiency: {activeDeficiencyApp.id}
                    </h3>
                    <p className="text-xs text-white/80">
                      Step {wizardStep} of 3 · Rectification Submission Flow
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveDeficiencyApp(null)}
                    className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white"
                  >
                    &times;
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                  {/* Step 1: Read Observations */}
                  {wizardStep === 1 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6785]">
                        Step 1: Scrutiny Officer Deficiencies
                      </h4>
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                        {activeDeficiencyApp.deficiencies?.map((def: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-rose-950 font-medium">
                            <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span>{def}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-[#5B6785]">
                        Please prepare updated certificates or explanations addressing each listed observation before proceeding.
                      </p>
                    </div>
                  )}

                  {/* Step 2: Upload Rectification Documents */}
                  {wizardStep === 2 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6785]">
                        Step 2: Upload Rectification Evidence
                      </h4>
                      <div className="border-2 border-dashed border-[#0A5CD6]/40 rounded-2xl p-6 text-center hover:bg-blue-50/30 transition-colors">
                        <UploadCloud className="w-8 h-8 text-[#0A5CD6] mx-auto mb-2" />
                        <p className="text-xs font-bold text-[#0F1B3D]">
                          Drag & drop PDF certificates or click to browse
                        </p>
                        <p className="text-[11px] text-[#5B6785] mt-1">
                          Accepts signed PDFs up to 10 MB per document
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsScanning(true);
                            setTimeout(() => {
                              setIsScanning(false);
                              setUploadedFiles((prev) => [
                                ...prev,
                                {
                                  name: `Rectified_Compliance_Cert_${prev.length + 1}.pdf`,
                                  size: '3.4 MB'
                                }
                              ]);
                            }, 600);
                          }}
                          className="mt-3 px-4 py-2 bg-[#0A5CD6] hover:bg-[#0747a6] text-white rounded-xl text-xs font-bold shadow-xs"
                        >
                          {isScanning ? 'Simulating Antivirus Scan...' : 'Add Sample Rectification PDF'}
                        </button>
                      </div>

                      {uploadedFiles.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-[#5B6785]">Uploaded Package:</span>
                          {uploadedFiles.map((f, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                              <span className="font-medium text-[#0F1B3D]">📄 {f.name} ({f.size})</span>
                              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                                ✓ Virus Free
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Review & Submit */}
                  {wizardStep === 3 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6785]">
                        Step 3: Review & Final Submission Statement
                      </h4>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                        <div className="font-bold text-[#0F1B3D]">
                          Enclosed Evidence Files: {uploadedFiles.length} Document(s)
                        </div>
                        <label className="block text-[11px] font-bold text-[#5B6785] pt-2">
                          Institutional Remarks / Clarifications:
                        </label>
                        <textarea
                          rows={3}
                          value={wizardRemarks}
                          onChange={(e) => setWizardRemarks(e.target.value)}
                          placeholder="Provide details on how deficiencies were resolved..."
                          className="w-full text-xs p-2.5 border border-[#E1E6F0] rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#0A5CD6]"
                        />
                      </div>
                      <p className="text-[11px] text-[#5B6785] italic">
                        By submitting, you certify that all uploaded documents are authentic and verified by the head of the institution.
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-[#F7F8FC] border-t border-[#E1E6F0] flex items-center justify-between">
                  <button
                    onClick={() => setWizardStep((s) => Math.max(1, s - 1))}
                    disabled={wizardStep === 1}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#5B6785] hover:bg-slate-200 disabled:opacity-40"
                  >
                    Back
                  </button>

                  {wizardStep < 3 ? (
                    <button
                      onClick={() => setWizardStep((s) => s + 1)}
                      className="px-5 py-2 rounded-xl bg-[#0A5CD6] hover:bg-[#0747a6] text-white text-xs font-bold"
                    >
                      Continue &rarr;
                    </button>
                  ) : (
                    <button
                      onClick={handleDeficiencySubmit}
                      className="px-5 py-2 rounded-xl bg-[#138808] hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit for Re-Scrutiny</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Undertaking Evidence Upload Modal */}
          {selectedUndertaking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-[#E1E6F0] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
                  <h3 className="font-bold text-sm text-[#0F1B3D]">
                    Upload Undertaking Evidence
                  </h3>
                  <button onClick={() => setSelectedUndertaking(null)} className="text-slate-400 hover:text-slate-600">
                    &times;
                  </button>
                </div>
                <p className="text-xs text-[#5B6785]">
                  Condition: {selectedUndertaking.condition}
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#0F1B3D]">Select Document:</label>
                  <input
                    type="text"
                    placeholder="e.g. Bandwidth_SpeedTest_Verification.pdf"
                    value={undertakingFileName}
                    onChange={(e) => setUndertakingFileName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E1E6F0]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedUndertaking(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#5B6785]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      uploadUndertakingEvidence(selectedUndertaking.id, {
                        id: `EVD-${Date.now()}`,
                        name: undertakingFileName || 'Compliance_Certificate.pdf',
                        url: '/sample_data/proof.pdf',
                        uploadedAt: new Date().toISOString(),
                        size: '2.8 MB',
                        fileType: 'application/pdf',
                        status: 'PENDING'
                      });
                      setSelectedUndertaking(null);
                      setUndertakingFileName('');
                    }}
                    className="px-4 py-2 bg-[#0A5CD6] hover:bg-[#0747a6] text-white rounded-xl text-xs font-bold"
                  >
                    Upload & Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Document Renewal Upload Modal */}
          {selectedDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-[#E1E6F0] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
                  <h3 className="font-bold text-sm text-[#0F1B3D]">
                    Upload Renewed Document
                  </h3>
                  <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600">
                    &times;
                  </button>
                </div>
                <p className="text-xs text-[#5B6785]">
                  Uploading renewal for: <strong>{selectedDoc.title}</strong>
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#0F1B3D]">Renewal Document Filename:</label>
                  <input
                    type="text"
                    placeholder="e.g. Registered_Lease_Agreement_2026_2056.pdf"
                    value={renewalFileName}
                    onChange={(e) => setRenewalFileName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E1E6F0]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#5B6785]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      uploadDocumentRenewal(selectedDoc.id, {
                        id: `REN-${Date.now()}`,
                        name: renewalFileName || `Renewed_${selectedDoc.type}_Deed.pdf`,
                        url: '/sample_data/renewal.pdf',
                        uploadedAt: new Date().toISOString(),
                        size: '4.2 MB',
                        fileType: 'application/pdf',
                        status: 'PENDING'
                      });
                      setSelectedDoc(null);
                      setRenewalFileName('');
                    }}
                    className="px-4 py-2 bg-[#0A5CD6] hover:bg-[#0747a6] text-white rounded-xl text-xs font-bold"
                  >
                    Submit Renewal Document
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </InstitutionShell>
  );
};
