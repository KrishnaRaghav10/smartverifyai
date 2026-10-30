import {
  Notification,
  Application,
  EVC,
  Undertaking,
  PrescribedDocument,
  AuditEvent
} from '../types';
import rulesConfig from '../config/rules.json';
import { differenceInDays, parseISO, formatISO, isAfter } from 'date-fns';
import { createAuditEvent } from './audit';

export interface EscalationRunResult {
  updatedApplications: Application[];
  escalationNotifications: Notification[];
  auditEvents: AuditEvent[];
}

export function runEscalationEngine(
  applications: Application[],
  evcs: EVC[],
  undertakings: Undertaking[],
  documents: PrescribedDocument[],
  simDate: Date,
  firedEscalationKeys: Set<string>
): EscalationRunResult {
  const escalationNotifications: Notification[] = [];
  const auditEvents: AuditEvent[] = [];
  const updatedApplications = [...applications];
  const simIso = formatISO(simDate);

  // 1. Applications Escalation
  for (let i = 0; i < updatedApplications.length; i++) {
    const app = updatedApplications[i];
    if (app.status === 'CLOSED' || app.currentStage === 'CLOSED') continue;
    const dueAt = parseISO(app.slaDueAt);

    if (isAfter(simDate, dueAt)) {
      const overdueDays = differenceInDays(simDate, dueAt);
      const ladder = rulesConfig.escalationLadders.application;

      for (const step of ladder) {
        if (overdueDays >= step.waitDays) {
          const key = `ESC-APP-${app.id}-L${step.level}`;
          if (!firedEscalationKeys.has(key)) {
            firedEscalationKeys.add(key);

            const msg = step.notificationTemplate
              .replace('{id}', app.id)
              .replace('{institution}', app.institutionName)
              .replace('{days}', overdueDays.toString());

            const notif: Notification = {
              id: `ESC-NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              toRole: step.targetRole as any,
              kind: 'ESCALATION',
              entityRef: { type: 'APPLICATION', id: app.id },
              message: `[Level ${step.level} Escalation] ${msg}`,
              createdAt: simIso,
              urgency: 'CRITICAL'
            };
            escalationNotifications.push(notif);

            const prevHash = app.history?.length > 0 ? app.history[app.history.length - 1].hash : undefined;
            const audit = createAuditEvent(
              'SYSTEM',
              `ESCALATED_APPLICATION_LEVEL_${step.level}`,
              { type: 'APPLICATION', id: app.id },
              {
                before: { status: app.status },
                after: { status: 'ESCALATED', escalationLevel: step.level },
                reason: msg,
                prevHash,
                isAutomated: true,
                at: simIso
              }
            );
            auditEvents.push(audit);

            updatedApplications[i] = {
              ...app,
              status: 'ESCALATED',
              history: [...(app.history || []), audit]
            };
          }
        }
      }
    }
  }

  // 2. EVC Escalation
  for (const evc of evcs) {
    if (evc.status === 'COMPLETED' || evc.status === 'SCHEDULED') continue;
    const target = parseISO(evc.scheduleTargetBy);

    if (isAfter(simDate, target)) {
      const delayedDays = differenceInDays(simDate, target);
      const ladder = rulesConfig.escalationLadders.evc;

      for (const step of ladder) {
        if (delayedDays >= step.waitDays) {
          const key = `ESC-EVC-${evc.id}-L${step.level}`;
          if (!firedEscalationKeys.has(key)) {
            firedEscalationKeys.add(key);

            const msg = step.notificationTemplate
              .replace('{institution}', evc.institutionName)
              .replace('{type}', evc.isNewInstitution ? 'New Institution' : 'Existing')
              .replace('{days}', delayedDays.toString());

            const notif: Notification = {
              id: `ESC-NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              toRole: step.targetRole as any,
              kind: 'ESCALATION',
              entityRef: { type: 'EVC', id: evc.id },
              message: `[Level ${step.level} EVC Escalation] ${msg}`,
              createdAt: simIso,
              urgency: 'CRITICAL'
            };
            escalationNotifications.push(notif);

            const audit = createAuditEvent(
              'SYSTEM',
              `ESCALATED_EVC_SCHEDULE_LEVEL_${step.level}`,
              { type: 'EVC', id: evc.id },
              {
                reason: msg,
                at: simIso,
                isAutomated: true
              }
            );
            auditEvents.push(audit);
          }
        }
      }
    }
  }

  // 3. Undertaking Escalation
  for (const u of undertakings) {
    if (u.status === 'VERIFIED' || u.status === 'CLOSED') continue;
    const due = parseISO(u.dueDate);

    if (isAfter(simDate, due)) {
      const overdueDays = differenceInDays(simDate, due);
      const ladder = rulesConfig.escalationLadders.undertaking;

      for (const step of ladder) {
        if (overdueDays >= step.waitDays) {
          const key = `ESC-UNDERTAKING-${u.id}-L${step.level}`;
          if (!firedEscalationKeys.has(key)) {
            firedEscalationKeys.add(key);

            const msg = step.notificationTemplate
              .replace('{institution}', u.institutionName)
              .replace('{condition}', u.condition)
              .replace('{days}', overdueDays.toString());

            const notif: Notification = {
              id: `ESC-NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              toRole: step.targetRole as any,
              kind: 'ESCALATION',
              entityRef: { type: 'UNDERTAKING', id: u.id },
              message: `[Level ${step.level} Undertaking Default] ${msg}`,
              createdAt: simIso,
              urgency: 'CRITICAL'
            };
            escalationNotifications.push(notif);

            const audit = createAuditEvent(
              'SYSTEM',
              `ESCALATED_UNDERTAKING_LEVEL_${step.level}`,
              { type: 'UNDERTAKING', id: u.id },
              {
                reason: msg,
                at: simIso,
                isAutomated: true
              }
            );
            auditEvents.push(audit);
          }
        }
      }
    }
  }

  // 4. Document Expiry Escalation
  for (const doc of documents) {
    if (doc.status === 'RENEWAL_VERIFIED' || doc.status === 'RENEWAL_SUBMITTED') continue;
    const validTo = parseISO(doc.validTo);

    if (isAfter(simDate, validTo)) {
      const expiredDays = differenceInDays(simDate, validTo);
      const ladder = rulesConfig.escalationLadders.document;

      for (const step of ladder) {
        if (expiredDays >= step.waitDays) {
          const key = `ESC-DOC-${doc.id}-L${step.level}`;
          if (!firedEscalationKeys.has(key)) {
            firedEscalationKeys.add(key);

            const msg = step.notificationTemplate
              .replace('{institution}', doc.institutionName)
              .replace('{docType}', doc.type)
              .replace('{days}', expiredDays.toString());

            const notif: Notification = {
              id: `ESC-NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              toRole: step.targetRole as any,
              kind: 'ESCALATION',
              entityRef: { type: 'DOCUMENT', id: doc.id },
              message: `[Level ${step.level} Document Expiry] ${msg}`,
              createdAt: simIso,
              urgency: 'CRITICAL'
            };
            escalationNotifications.push(notif);

            const audit = createAuditEvent(
              'SYSTEM',
              `ESCALATED_DOCUMENT_LAPSE_LEVEL_${step.level}`,
              { type: 'DOCUMENT', id: doc.id },
              {
                reason: msg,
                at: simIso,
                isAutomated: true
              }
            );
            auditEvents.push(audit);
          }
        }
      }
    }
  }

  return {
    updatedApplications,
    escalationNotifications,
    auditEvents
  };
}
