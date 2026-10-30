import { create } from 'zustand';
import {
  Application,
  EVC,
  Undertaking,
  PrescribedDocument,
  Notification,
  AuditEvent,
  Institution,
  User,
  Role,
  Stage,
  Evidence
} from '../types';
import { generateSeedData, DEMO_USERS, SIMULATED_START_DATE } from '../mock/seed';
import { calculateApplicationSla, calculateUndertakingStatus, calculateDocumentStatus, calculateEvcStatus } from '../engine/sla';
import { advanceApplicationStage, returnApplicationDeficiency } from '../engine/workflow';
import { runNotificationEngine } from '../engine/notification';
import { runEscalationEngine } from '../engine/escalation';
import { createAuditEvent } from '../engine/audit';
import { addDays, formatISO, parseISO } from 'date-fns';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warn' | 'error';
  title: string;
  message: string;
  undoable?: boolean;
  onUndo?: () => void;
}

interface AegisState {
  // Clock
  simDate: Date;
  simDateIso: string;
  advanceDays: (days: number) => void;
  jumpToDate: (date: Date) => void;
  resetDemoData: () => void;

  // Active User & Language
  currentUser: User;
  switchRole: (role: Role) => void;
  language: 'EN' | 'HI';
  setLanguage: (lang: 'EN' | 'HI') => void;

  // Entities
  institutions: Institution[];
  applications: Application[];
  evcs: EVC[];
  undertakings: Undertaking[];
  documents: PrescribedDocument[];
  notifications: Notification[];
  auditEvents: AuditEvent[];

  // Engine tracking sets to prevent duplicate alerts
  notificationKeys: string[];
  escalationKeys: string[];

  // UI state
  toasts: ToastMessage[];
  addToast: (t: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  isAuditDrawerOpen: boolean;
  auditDrawerEntity: { type: string; id: string } | null;
  openAuditDrawer: (type: string, id: string) => void;
  closeAuditDrawer: () => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Domain Actions
  advanceApp: (appId: string, reason: string, nextStage?: Stage) => { success: boolean; message: string };
  returnApp: (appId: string, reasonCode: string, remarks: string, deficiencies: string[]) => { success: boolean; message: string };
  respondToDeficiencies: (appId: string, remarks: string, files: Evidence[]) => void;
  decideApplication: (appId: string, outcome: 'APPROVED' | 'REJECTED', mandatoryReason: string) => { success: boolean; message: string };
  reassignApp: (appId: string, targetUser: string, reason: string) => void;

  // EVC actions
  scheduleEvcInspection: (evcId: string, scheduledDate: string, panel: string[]) => void;
  escalateEvcDelay: (evcId: string, reason: string) => void;
  submitEvcReport: (evcId: string, observations: string) => void;

  // Undertakings actions
  uploadUndertakingEvidence: (undertakingId: string, evidence: Evidence) => void;
  verifyUndertakingCompliance: (undertakingId: string, outcome: 'VERIFIED' | 'REJECTED_RESUBMIT', remarks: string) => void;

  // Document actions
  uploadDocumentRenewal: (docId: string, evidence: Evidence) => void;
  verifyDocumentRenewal: (docId: string, outcome: 'RENEWAL_VERIFIED' | 'REJECTED', remarks: string) => void;

  // Notification actions
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const STORAGE_KEY = 'aegis_prototype_state_v1';

function initializeDefaultData() {
  const seed = generateSeedData();
  return {
    simDate: SIMULATED_START_DATE,
    simDateIso: formatISO(SIMULATED_START_DATE),
    currentUser: DEMO_USERS[0], // Dr. Ramesh Gupta (Institution)
    language: 'EN' as const,
    institutions: seed.institutions,
    applications: seed.applications,
    evcs: seed.evcs,
    undertakings: seed.undertakings,
    documents: seed.documents,
    notifications: [
      {
        id: 'NOTIF-INIT-1',
        toRole: 'INSTITUTION' as Role,
        toUser: 'INST-W-01',
        kind: 'UPCOMING' as const,
        entityRef: { type: 'DOCUMENT', id: 'DOC-W-001' },
        message: 'Lease for Aarohan Institute expires in 21 days. Renewal upload required.',
        createdAt: formatISO(SIMULATED_START_DATE),
        urgency: 'HIGH' as const
      },
      {
        id: 'NOTIF-INIT-2',
        toRole: 'EVC_COORDINATOR' as Role,
        kind: 'OVERDUE' as const,
        entityRef: { type: 'EVC', id: 'EVC-S-001' },
        message: 'EVC scheduling for Meridian College of Engineering is overdue by 2 days.',
        createdAt: formatISO(SIMULATED_START_DATE),
        urgency: 'CRITICAL' as const
      }
    ],
    auditEvents: seed.initialAudit,
    notificationKeys: ['NOTIF-INIT-1', 'NOTIF-INIT-2'],
    escalationKeys: []
  };
}

export const useAegisStore = create<AegisState>((set, get) => {
  const defaults = initializeDefaultData();

  return {
    ...defaults,
    toasts: [],
    isAuditDrawerOpen: false,
    auditDrawerEntity: null,
    isCommandPaletteOpen: false,

    addToast: (t) => {
      const id = `TOAST-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      set((state) => ({ toasts: [...state.toasts, { ...t, id }] }));
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
      }, 5000);
    },

    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

    openAuditDrawer: (type, id) => set({ isAuditDrawerOpen: true, auditDrawerEntity: { type, id } }),
    closeAuditDrawer: () => set({ isAuditDrawerOpen: false, auditDrawerEntity: null }),
    setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

    setLanguage: (lang) => set({ language: lang }),

    switchRole: (role) => {
      const user = DEMO_USERS.find((u) => u.role === role) || DEMO_USERS[0];
      const prevHash = get().auditEvents.length > 0 ? get().auditEvents[get().auditEvents.length - 1].hash : undefined;
      const audit = createAuditEvent(user.name, `ROLE_SWITCHED_TO_${role}`, { type: 'USER', id: user.id }, {
        reason: `Demo role switched to ${role} (${user.designation})`,
        prevHash,
        isAutomated: false
      });
      set((state) => ({
        currentUser: user,
        auditEvents: [...state.auditEvents, audit]
      }));
      get().addToast({
        type: 'info',
        title: 'Role Switcher Active',
        message: `Switched perspective to ${user.name} (${user.designation})`
      });
    },

    resetDemoData: () => {
      const clean = initializeDefaultData();
      set({
        ...clean,
        toasts: []
      });
      get().addToast({
        type: 'info',
        title: 'Demo Data Reset',
        message: 'Clock reset to 30 Oct 2026. All states restored to clean seed baseline.'
      });
    },

    jumpToDate: (targetDate) => {
      const { simDate } = get();
      const days = Math.round((targetDate.getTime() - simDate.getTime()) / (1000 * 60 * 60 * 24));
      get().advanceDays(days);
    },

    advanceDays: (days) => {
      const state = get();
      const newDate = addDays(state.simDate, days);
      const newIso = formatISO(newDate);

      // 1. Recalculate Application statuses
      const updatedApplications = state.applications.map((app) => {
        const { status } = calculateApplicationSla(app, newDate);
        return { ...app, status };
      });

      // 2. Recalculate EVC statuses
      const updatedEvcs = state.evcs.map((evc) => {
        const status = calculateEvcStatus(evc, newDate);
        return { ...evc, status };
      });

      // 3. Recalculate Undertaking statuses
      const updatedUndertakings = state.undertakings.map((u) => {
        const status = calculateUndertakingStatus(u, newDate);
        return { ...u, status };
      });

      // 4. Recalculate Document statuses
      const updatedDocuments = state.documents.map((doc) => {
        const status = calculateDocumentStatus(doc, newDate);
        return { ...doc, status };
      });

      // 5. Run Notification Engine
      const notifKeySet = new Set(state.notificationKeys);
      const { notifications: newNotifs, auditEvents: notifAudits } = runNotificationEngine(
        updatedApplications,
        updatedEvcs,
        updatedUndertakings,
        updatedDocuments,
        newDate,
        notifKeySet
      );

      // 6. Run Escalation Engine
      const escKeySet = new Set(state.escalationKeys);
      const {
        updatedApplications: postEscApps,
        escalationNotifications: newEscNotifs,
        auditEvents: escAudits
      } = runEscalationEngine(
        updatedApplications,
        updatedEvcs,
        updatedUndertakings,
        updatedDocuments,
        newDate,
        escKeySet
      );

      const allNewAudits = [...notifAudits, ...escAudits];
      const allNewNotifs = [...newNotifs, ...newEscNotifs];

      set({
        simDate: newDate,
        simDateIso: newIso,
        applications: postEscApps,
        evcs: updatedEvcs,
        undertakings: updatedUndertakings,
        documents: updatedDocuments,
        notifications: [...allNewNotifs, ...state.notifications],
        auditEvents: [...state.auditEvents, ...allNewAudits],
        notificationKeys: Array.from(notifKeySet),
        escalationKeys: Array.from(escKeySet)
      });

      // Show toast if alerts fired
      if (allNewNotifs.length > 0) {
        get().addToast({
          type: 'warn',
          title: `Clock Advanced +${days}d: ${allNewNotifs.length} Alerts Fired`,
          message: allNewNotifs[0].message
        });
      } else {
        get().addToast({
          type: 'info',
          title: `Time Machine: +${days} Day(s)`,
          message: `Simulated date is now ${newDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
        });
      }
    },

    advanceApp: (appId, reason, nextStage) => {
      const state = get();
      const app = state.applications.find((a) => a.id === appId);
      if (!app) return { success: false, message: 'Application not found' };

      const res = advanceApplicationStage(
        app,
        state.currentUser.name,
        state.currentUser.role,
        state.simDate,
        reason,
        nextStage
      );

      if (res.success && res.updatedApplication) {
        set((s) => ({
          applications: s.applications.map((a) => (a.id === appId ? res.updatedApplication! : a)),
          evcs: res.newEvc ? [res.newEvc, ...s.evcs] : s.evcs,
          auditEvents: [...s.auditEvents, ...res.updatedApplication!.history.slice(-1)]
        }));

        get().addToast({
          type: 'success',
          title: 'Stage Transition Complete',
          message: res.message
        });
      } else {
        get().addToast({
          type: 'error',
          title: 'Workflow Action Blocked',
          message: res.message
        });
      }
      return res;
    },

    returnApp: (appId, reasonCode, remarks, deficiencies) => {
      const state = get();
      const app = state.applications.find((a) => a.id === appId);
      if (!app) return { success: false, message: 'Application not found' };

      const res = returnApplicationDeficiency(
        app,
        state.currentUser.name,
        state.currentUser.role,
        state.simDate,
        reasonCode,
        remarks,
        deficiencies
      );

      if (res.success && res.updatedApplication) {
        // Notification to Institution
        const notif: Notification = {
          id: `NOTIF-${Date.now()}`,
          toRole: 'INSTITUTION',
          toUser: app.institutionId,
          kind: 'PENDING',
          entityRef: { type: 'APPLICATION', id: app.id },
          message: `Application ${app.id} returned for deficiencies: ${remarks}`,
          createdAt: state.simDateIso,
          urgency: 'HIGH'
        };

        set((s) => ({
          applications: s.applications.map((a) => (a.id === appId ? res.updatedApplication! : a)),
          notifications: [notif, ...s.notifications],
          auditEvents: [...s.auditEvents, ...res.updatedApplication!.history.slice(-1)]
        }));

        get().addToast({
          type: 'warn',
          title: 'Application Returned for Deficiencies',
          message: res.message
        });
      }
      return res;
    },

    respondToDeficiencies: (appId, remarks, files) => {
      const state = get();
      const app = state.applications.find((a) => a.id === appId);
      if (!app) return;

      const prevHash = app.history?.length > 0 ? app.history[app.history.length - 1].hash : undefined;
      const audit = createAuditEvent(state.currentUser.name, 'DEFICIENCY_RECTIFICATION_SUBMITTED', { type: 'APPLICATION', id: appId }, {
        reason: `Institution uploaded ${files.length} rectification documents: ${remarks}`,
        prevHash,
        isAutomated: false,
        at: state.simDateIso
      });

      const updated: Application = {
        ...app,
        status: 'ON_TRACK',
        currentStage: 'RE_SCRUTINY',
        history: [...(app.history || []), audit]
      };

      set((s) => ({
        applications: s.applications.map((a) => (a.id === appId ? updated : a)),
        auditEvents: [...s.auditEvents, audit]
      }));

      get().addToast({
        type: 'success',
        title: 'Deficiency Response Submitted',
        message: 'Your rectification package is submitted for Re-Scrutiny verification.'
      });
    },

    decideApplication: (appId, outcome, mandatoryReason) => {
      const state = get();
      // Regulatory check: Human action strictly required
      if (!mandatoryReason || mandatoryReason.trim().length < 10) {
        get().addToast({
          type: 'error',
          title: 'Mandatory Reason Required',
          message: 'Statutory decisions by the competent authority require an official signed reason (minimum 10 characters).'
        });
        return { success: false, message: 'Mandatory statutory reason required.' };
      }

      const app = state.applications.find((a) => a.id === appId);
      if (!app) return { success: false, message: 'Application not found' };

      const prevHash = app.history?.length > 0 ? app.history[app.history.length - 1].hash : undefined;
      const audit = createAuditEvent(
        state.currentUser.name,
        `COMPETENT_AUTHORITY_${outcome}`,
        { type: 'APPLICATION', id: appId },
        {
          before: { stage: app.currentStage, status: app.status },
          after: { stage: 'CLOSED', status: 'CLOSED', outcome },
          reason: mandatoryReason,
          prevHash,
          isAutomated: false,
          at: state.simDateIso
        }
      );

      const updated: Application = {
        ...app,
        currentStage: 'CLOSED',
        status: 'CLOSED',
        finalDecision: {
          outcome,
          decidedBy: state.currentUser.name,
          decidedAt: state.simDateIso,
          mandatoryReason
        },
        history: [...(app.history || []), audit]
      };

      set((s) => ({
        applications: s.applications.map((a) => (a.id === appId ? updated : a)),
        auditEvents: [...s.auditEvents, audit]
      }));

      get().addToast({
        type: 'success',
        title: `Decision Recorded: ${outcome}`,
        message: `Official decision by ${state.currentUser.name} recorded in tamper-proof audit trail.`
      });

      return { success: true, message: `Application ${outcome.toLowerCase()} successfully.` };
    },

    reassignApp: (appId, targetUser, reason) => {
      const state = get();
      const app = state.applications.find((a) => a.id === appId);
      if (!app) return;

      const prevHash = app.history?.length > 0 ? app.history[app.history.length - 1].hash : undefined;
      const audit = createAuditEvent(state.currentUser.name, 'APPLICATION_REASSIGNED', { type: 'APPLICATION', id: appId }, {
        before: { assignedTo: app.assignedTo },
        after: { assignedTo: targetUser },
        reason,
        prevHash,
        isAutomated: false,
        at: state.simDateIso
      });

      set((s) => ({
        applications: s.applications.map((a) => (a.id === appId ? { ...a, assignedTo: targetUser, history: [...a.history, audit] } : a)),
        auditEvents: [...s.auditEvents, audit]
      }));

      get().addToast({
        type: 'info',
        title: 'Workload Reassigned',
        message: `Case ${appId} reassigned to ${targetUser}.`
      });
    },

    scheduleEvcInspection: (evcId, scheduledDate, panel) => {
      const state = get();
      const evc = state.evcs.find((e) => e.id === evcId);
      if (!evc) return;

      const prevHash = state.auditEvents.length > 0 ? state.auditEvents[state.auditEvents.length - 1].hash : undefined;
      const audit = createAuditEvent(state.currentUser.name, 'EVC_INSPECTION_SCHEDULED', { type: 'EVC', id: evcId }, {
        before: { status: evc.status },
        after: { status: 'SCHEDULED', scheduledFor: scheduledDate, panel },
        reason: `EVC panel scheduled for ${scheduledDate} with ${panel.length} experts.`,
        prevHash,
        isAutomated: false,
        at: state.simDateIso
      });

      const updatedEvc: EVC = {
        ...evc,
        status: 'SCHEDULED',
        scheduledFor: scheduledDate,
        panel
      };

      set((s) => ({
        evcs: s.evcs.map((e) => (e.id === evcId ? updatedEvc : e)),
        auditEvents: [...s.auditEvents, audit]
      }));

      get().addToast({
        type: 'success',
        title: 'EVC Scheduled',
        message: `Inspection confirmed for ${evc.institutionName} on ${scheduledDate}.`
      });
    },

    escalateEvcDelay: (evcId, reason) => {
      const state = get();
      const evc = state.evcs.find((e) => e.id === evcId);
      if (!evc) return;

      const notif: Notification = {
        id: `NOTIF-${Date.now()}`,
        toRole: 'SENIOR_AUTHORITY',
        kind: 'ESCALATION',
        entityRef: { type: 'EVC', id: evcId },
        message: `EVC Coordinator escalated delay for ${evc.institutionName}: ${reason}`,
        createdAt: state.simDateIso,
        urgency: 'CRITICAL'
      };

      const audit = createAuditEvent(state.currentUser.name, 'MANUAL_EVC_DELAY_ESCALATED', { type: 'EVC', id: evcId }, {
        reason,
        at: state.simDateIso,
        isAutomated: false
      });

      set((s) => ({
        notifications: [notif, ...s.notifications],
        auditEvents: [...s.auditEvents, audit]
      }));

      get().addToast({
        type: 'warn',
        title: 'EVC Delay Escalated',
        message: 'Escalation transmitted directly to Senior Authority executive inbox.'
      });
    },

    submitEvcReport: (evcId, observations) => {
      const state = get();
      const evc = state.evcs.find((e) => e.id === evcId);
      if (!evc) return;

      const audit = createAuditEvent(state.currentUser.name, 'EVC_REPORT_SUBMITTED', { type: 'EVC', id: evcId }, {
        reason: observations,
        at: state.simDateIso,
        isAutomated: false
      });

      set((s) => ({
        evcs: s.evcs.map((e) => (e.id === evcId ? { ...e, status: 'COMPLETED', observations, reportSubmittedAt: state.simDateIso } : e)),
        auditEvents: [...s.auditEvents, audit]
      }));

      get().addToast({
        type: 'success',
        title: 'EVC Report Lodged',
        message: 'EVC inspection observations recorded. Application ready for SAC/SHC review.'
      });
    },

    uploadUndertakingEvidence: (undertakingId, evidence) => {
      const state = get();
      const u = state.undertakings.find((item) => item.id === undertakingId);
      if (!u) return;

      const audit = createAuditEvent(state.currentUser.name, 'UNDERTAKING_EVIDENCE_UPLOADED', { type: 'UNDERTAKING', id: undertakingId }, {
        reason: `Uploaded ${evidence.name} for condition: ${u.condition}`,
        at: state.simDateIso,
        isAutomated: false
      });

      const updated: Undertaking = {
        ...u,
        status: 'SUBMITTED',
        evidence: [...u.evidence, evidence]
      };

      set((s) => ({
        undertakings: s.undertakings.map((item) => (item.id === undertakingId ? updated : item)),
        auditEvents: [...s.auditEvents, audit]
      }));

      get().addToast({
        type: 'success',
        title: 'Evidence Uploaded',
        message: 'Compliance evidence submitted for official verification.'
      });
    },

    verifyUndertakingCompliance: (undertakingId, outcome, remarks) => {
      const state = get();
      const u = state.undertakings.find((item) => item.id === undertakingId);
      if (!u) return;

      const isVerified = outcome === 'VERIFIED';
      const audit = createAuditEvent(state.currentUser.name, `UNDERTAKING_${outcome}`, { type: 'UNDERTAKING', id: undertakingId }, {
        reason: remarks,
        at: state.simDateIso,
        isAutomated: false
      });

      const updated: Undertaking = {
        ...u,
        status: outcome,
        verifiedBy: isVerified ? state.currentUser.name : undefined,
        verifiedAt: isVerified ? state.simDateIso : undefined,
        remarks
      };

      set((s) => ({
        undertakings: s.undertakings.map((item) => (item.id === undertakingId ? updated : item)),
        auditEvents: [...s.auditEvents, audit]
      }));

      get().addToast({
        type: isVerified ? 'success' : 'warn',
        title: isVerified ? 'Undertaking Verified & Closed' : 'Resubmission Requested',
        message: remarks
      });
    },

    uploadDocumentRenewal: (docId, evidence) => {
      const state = get();
      const doc = state.documents.find((d) => d.id === docId);
      if (!doc) return;

      const audit = createAuditEvent(state.currentUser.name, 'DOCUMENT_RENEWAL_UPLOADED', { type: 'DOCUMENT', id: docId }, {
        reason: `Uploaded renewal draft ${evidence.name}`,
        at: state.simDateIso,
        isAutomated: false
      });

      set((s) => ({
        documents: s.documents.map((d) => (d.id === docId ? { ...d, status: 'RENEWAL_SUBMITTED', renewalEvidence: evidence } : d)),
        auditEvents: [...s.auditEvents, audit]
      }));

      get().addToast({
        type: 'success',
        title: 'Renewal Submitted',
        message: 'Renewal documentation submitted for compliance cell verification.'
      });
    },

    verifyDocumentRenewal: (docId, outcome, remarks) => {
      const state = get();
      const doc = state.documents.find((d) => d.id === docId);
      if (!doc) return;

      const isVerified = outcome === 'RENEWAL_VERIFIED';
      const audit = createAuditEvent(state.currentUser.name, `DOCUMENT_${outcome}`, { type: 'DOCUMENT', id: docId }, {
        reason: remarks,
        at: state.simDateIso,
        isAutomated: false
      });

      set((s) => ({
        documents: s.documents.map((d) => (d.id === docId ? { ...d, status: isVerified ? 'RENEWAL_VERIFIED' : 'EXPIRED' } : d)),
        auditEvents: [...s.auditEvents, audit]
      }));

      get().addToast({
        type: isVerified ? 'success' : 'warn',
        title: isVerified ? 'Renewal Verified' : 'Renewal Rejected',
        message: remarks
      });
    },

    markNotificationRead: (id) => {
      set((s) => ({
        notifications: s.notifications.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      }));
    },

    markAllNotificationsRead: () => {
      const now = new Date().toISOString();
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, readAt: n.readAt || now }))
      }));
    }
  };
});
