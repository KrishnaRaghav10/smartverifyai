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
import { EVC } from '../../types';
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Send,
  UserCheck
} from 'lucide-react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';

export const EvcScheduler: React.FC = () => {
  const { evcs, simDate, scheduleEvcInspection, escalateEvcDelay, openAuditDrawer, addToast } = useAegisStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeSegment, setActiveSegment] = useState<'queue' | 'calendar' | 'panels' | 'gantt'>('queue');

  // Scheduling Dialog State
  const [schedulingEvc, setSchedulingEvc] = useState<EVC | null>(null);
  const [inspectionDate, setInspectionDate] = useState('');
  const [selectedExperts, setSelectedExperts] = useState<string[]>([
    'Prof. K. Mehta (IIT Bombay)',
    'Dr. S. Kulkarni (COEP)'
  ]);

  // Conflict state simulation
  const [hasConflict, setHasConflict] = useState(false);

  // Escalate Dialog State
  const [escalateModalEvc, setEscalateModalEvc] = useState<EVC | null>(null);
  const [escalateReason, setEscalateReason] = useState('');

  const queuedEvcs = evcs.filter((e) => e.status === 'QUEUED' || e.status === 'DELAYED');
  const scheduledEvcs = evcs.filter((e) => e.status === 'SCHEDULED');
  const delayedEvcs = evcs.filter((e) => e.status === 'DELAYED');

  // Available Expert Pool with Conflict Flags
  const expertPool = [
    { name: 'Prof. K. Mehta', org: 'IIT Bombay', visitsDone: 8, available: true, conflict: false },
    { name: 'Dr. S. Kulkarni', org: 'COEP Pune', visitsDone: 12, available: true, conflict: false },
    { name: 'Prof. R. Bannerjee', org: 'NIT Rourkela', visitsDone: 5, available: true, conflict: false },
    { name: 'Dr. V. Rao', org: 'Anna University', visitsDone: 9, available: false, conflict: true, conflictReason: 'Alumnus of Sponsoring Trust' },
    { name: 'Dr. Sunita Deshmukh', org: 'VJTI Mumbai', visitsDone: 4, available: true, conflict: false }
  ];

  const handleConfirmSchedule = () => {
    if (!schedulingEvc) return;
    const targetDate = inspectionDate || format(addDays(simDate, 5), 'yyyy-MM-dd');
    scheduleEvcInspection(schedulingEvc.id, targetDate, selectedExperts);
    setSchedulingEvc(null);
  };

  const handleConfirmEscalation = () => {
    if (!escalateModalEvc) return;
    escalateEvcDelay(
      escalateModalEvc.id,
      escalateReason || 'Expert committee unconstituted past statutory target deadline.'
    );
    setEscalateModalEvc(null);
    setEscalateReason('');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col font-sans selection:bg-[#E6ECFF] selection:text-[#6D4AFF]">
      {/* Header */}
      <Header
        onOpenNotifications={() => setIsNotifOpen(true)}
        accentColor="#6D4AFF"
        portalTitle="EVC Scheduler & Panel Workspace"
      />

      {/* Delay Alert Banner Strip for Overdue Scheduling */}
      {delayedEvcs.length > 0 && (
        <div className="bg-rose-50 border-b border-rose-200 py-2 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-rose-950">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D92D20] shrink-0 animate-bounce" />
              <span>
                <strong>Statutory Delay Alert:</strong> {delayedEvcs.length} institution EVC visit(s) past statutory scheduling target!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-rose-900">{delayedEvcs[0].institutionName}</span>
              <button
                onClick={() => setEscalateModalEvc(delayedEvcs[0])}
                className="px-3 py-1 bg-[#D92D20] hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] shadow-xs"
              >
                Escalate to Designated Authority
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Subheader with Top Segmented Control */}
      <div className="bg-white border-b border-[#E1E6F0] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-[#0F1B3D] tracking-tight">
              EVC Queue & Calendar Workspace
            </h1>
            <p className="text-xs text-[#5B6785]">
              National EVC Coordination Cell · Inspection Scheduling & Expert Panel Allocation
            </p>
          </div>

          {/* Segmented Control */}
          <div className="flex items-center gap-1 bg-[#EEF1F8] p-1 rounded-xl text-xs font-semibold text-[#5B6785] self-start sm:self-auto">
            {[
              { id: 'queue', label: 'Queue & Calendar' },
              { id: 'panels', label: 'Expert Pool & Conflict Guard' },
              { id: 'gantt', label: 'Inspection Timeline (Gantt)' }
            ].map((seg) => (
              <button
                key={seg.id}
                onClick={() => setActiveSegment(seg.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeSegment === seg.id
                    ? 'bg-[#6D4AFF] text-white shadow-xs font-bold'
                    : 'hover:text-[#0F1B3D]'
                }`}
              >
                {seg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* SEGMENT 1: QUEUE & CALENDAR */}
        {activeSegment === 'queue' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Queue Lane (Left Column) */}
            <div className="aegis-card p-5 bg-white space-y-4 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-2">
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#0F1B3D]">
                    EVC Scheduling Queue
                  </h3>
                  <span className="text-[10px] text-[#5B6785]">Auto-placed upon scrutiny clearance</span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-[#6D4AFF]">
                  {queuedEvcs.length} In Queue
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {queuedEvcs.map((item) => {
                  const targetDate = parseISO(item.scheduleTargetBy);
                  const daysLeft = differenceInDays(targetDate, simDate);
                  const isPast = daysLeft < 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isPast
                          ? 'border-rose-300 bg-rose-50/30'
                          : item.isNewInstitution
                          ? 'border-purple-300 bg-purple-50/20'
                          : 'border-[#E1E6F0] bg-[#F7F8FC]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono-num font-bold text-xs text-[#0F1B3D]">
                          {item.id}
                        </span>
                        {item.isNewInstitution && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 animate-pulse">
                            New Institution (Priority)
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-[#0F1B3D]">
                        {item.institutionName}
                      </h4>
                      <span className="text-[11px] text-[#5B6785] block mt-0.5">
                        Region: {item.region} · Queued {format(parseISO(item.queuedAt), 'dd MMM')}
                      </span>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span
                          className={`font-semibold ${
                            isPast ? 'text-[#D92D20]' : 'text-[#F28C28]'
                          }`}
                        >
                          {isPast
                            ? `${Math.abs(daysLeft)}d Past Target`
                            : `Target: ${daysLeft}d left`}
                        </span>

                        <div className="flex gap-1.5">
                          {isPast && (
                            <button
                              onClick={() => setEscalateModalEvc(item)}
                              className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[10px] font-bold"
                            >
                              Escalate
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSchedulingEvc(item);
                              setInspectionDate(format(addDays(simDate, 5), 'yyyy-MM-dd'));
                            }}
                            className="px-3 py-1 bg-[#6D4AFF] hover:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-xs"
                          >
                            Schedule
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calendar View (Center & Right) */}
            <div className="lg:col-span-2 aegis-card p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[#6D4AFF]" />
                  <h3 className="font-bold text-sm text-[#0F1B3D]">
                    Inspection Calendar ({format(simDate, 'MMMM yyyy')})
                  </h3>
                </div>
                <span className="text-xs text-[#5B6785]">
                  Click or drag cases onto calendar dates to schedule
                </span>
              </div>

              {/* Calendar Grid Simulation */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="font-bold text-[#5B6785] py-1 bg-slate-50 rounded-lg">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 28 }).map((_, i) => {
                  const dayNum = i + 1;
                  const hasVisit = dayNum === 6 || dayNum === 14 || dayNum === 21;
                  return (
                    <div
                      key={i}
                      className={`min-h-[70px] p-1.5 rounded-xl border flex flex-col justify-between text-left transition-colors ${
                        hasVisit
                          ? 'bg-purple-50/60 border-purple-300'
                          : 'bg-white border-[#E1E6F0] hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-mono-num font-bold text-[11px] text-[#0F1B3D]">
                        {dayNum}
                      </span>
                      {hasVisit && (
                        <div className="text-[10px] font-bold p-1 bg-[#6D4AFF] text-white rounded-md truncate">
                          EVC: Aarohan Tech
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SEGMENT 2: EXPERT POOL & CONFLICT GUARD */}
        {activeSegment === 'panels' && (
          <div className="aegis-card p-6 bg-white space-y-6">
            <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#0F1B3D]">
                  Statutory Expert Pool & Conflict-of-Interest Guard
                </h3>
                <p className="text-xs text-[#5B6785]">
                  AICTE panel constitution checks for expert double-booking, same-district clash, and trust affiliations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expertPool.map((exp, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex flex-col justify-between ${
                    exp.conflict ? 'bg-rose-50/50 border-rose-300' : 'bg-white border-[#E1E6F0]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-[#0F1B3D]">{exp.name}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          exp.available ? 'bg-[#138808]' : 'bg-[#D92D20]'
                        }`}
                        title={exp.available ? 'Available' : 'Unavailable'}
                      />
                    </div>
                    <span className="text-xs text-[#5B6785] block">{exp.org}</span>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Visits Conducted: {exp.visitsDone}
                    </span>

                    {exp.conflict && (
                      <div className="mt-3 p-2 bg-rose-100 rounded-xl text-[10px] text-rose-900 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                        <span>Conflict Flag: {exp.conflictReason}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E1E6F0] flex items-center justify-between">
                    <span className="text-[10px] text-[#5B6785]">
                      {exp.conflict ? 'Excluded from panel' : 'Eligible for inspection'}
                    </span>
                    <button
                      disabled={exp.conflict}
                      className="px-3 py-1 bg-slate-100 hover:bg-[#6D4AFF] hover:text-white rounded-lg text-xs font-bold disabled:opacity-30 transition-colors"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEGMENT 3: GANTT INSPECTION TIMELINE */}
        {activeSegment === 'gantt' && (
          <div className="aegis-card p-6 bg-white space-y-6">
            <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#0F1B3D]">
                  Inspection Pipeline Timeline (Gantt View)
                </h3>
                <p className="text-xs text-[#5B6785]">
                  Visualise workflow transition times: Queued &rarr; Scheduled &rarr; Visit &rarr; Report Due. Delay segments highlighted in red.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {evcs.slice(0, 5).map((e) => (
                <div key={e.id} className="p-4 bg-[#F7F8FC] rounded-2xl border border-[#E1E6F0] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono-num font-bold text-[#0F1B3D]">{e.id}</span>
                      <span className="font-bold text-[#0F1B3D] ml-2">{e.institutionName}</span>
                    </div>
                    <StatusChip status={e.status} size="sm" />
                  </div>

                  {/* Gantt Bar Segments */}
                  <div className="h-6 w-full bg-slate-200 rounded-xl overflow-hidden flex items-center text-[10px] font-mono text-white">
                    <div className="h-full bg-purple-600 flex items-center justify-center px-2" style={{ width: '30%' }}>
                      Queued (4d)
                    </div>
                    <div className="h-full bg-blue-600 flex items-center justify-center px-2" style={{ width: '35%' }}>
                      Scheduled (6d)
                    </div>
                    {e.status === 'DELAYED' ? (
                      <div className="h-full bg-rose-600 flex items-center justify-center px-2 animate-pulse" style={{ width: '35%' }}>
                        Delay (+3d)
                      </div>
                    ) : (
                      <div className="h-full bg-emerald-600 flex items-center justify-center px-2" style={{ width: '35%' }}>
                        Visit On-Track
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* SCHEDULING DIALOG MODAL */}
      {schedulingEvc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-[#E1E6F0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
              <h3 className="font-bold text-sm text-[#0F1B3D]">
                Schedule EVC Inspection
              </h3>
              <button onClick={() => setSchedulingEvc(null)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <p className="text-xs text-[#5B6785]">
              Institution: <strong>{schedulingEvc.institutionName}</strong> ({schedulingEvc.region} Region)
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0F1B3D]">Inspection Date:</label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E1E6F0] bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F1B3D]">Nominated Panel Experts:</label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                {selectedExperts.map((exp, i) => (
                  <div key={i} className="flex items-center gap-2 text-[#0F1B3D]">
                    <UserCheck className="w-4 h-4 text-[#138808]" />
                    <span>{exp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSchedulingEvc(null)} className="px-4 py-2 text-xs font-semibold text-[#5B6785]">
                Cancel
              </button>
              <button
                onClick={handleConfirmSchedule}
                className="px-5 py-2 bg-[#6D4AFF] hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Confirm Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESCALATION CONFIRM MODAL */}
      {escalateModalEvc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-2 text-[#D92D20]">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm">Escalate EVC Delay to Designated Authority</h3>
            </div>
            <p className="text-xs text-[#5B6785]">
              Transmits a statutory delay alert for <strong>{escalateModalEvc.institutionName}</strong> directly to the Regional Officer and Senior Authority.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0F1B3D]">Escalation Reason:</label>
              <textarea
                rows={2}
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                placeholder="e.g. Expert panel unavailable within statutory 7-day target..."
                className="w-full text-xs p-2 border border-[#E1E6F0] rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEscalateModalEvc(null)} className="px-4 py-2 text-xs font-semibold text-[#5B6785]">
                Cancel
              </button>
              <button
                onClick={handleConfirmEscalation}
                className="px-5 py-2 bg-[#D92D20] hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Confirm Escalation
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
