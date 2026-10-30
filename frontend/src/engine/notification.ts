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

export interface EngineTickResult {
  notifications: Notification[];
  auditEvents: AuditEvent[];
}

export function runNotificationEngine(
  applications: Application[],
  evcs: EVC[],
  undertakings: Undertaking[],
  documents: PrescribedDocument[],
  simDate: Date,
  existingNotificationKeys: Set<string>
): EngineTickResult {
  const newNotifications: Notification[] = [];
  const newAuditEvents: AuditEvent[] = [];
  const simIso = formatISO(simDate);

  // 1. Check Applications SLA
  for (const app of applications) {
    if (app.status === 'CLOSED' || app.currentStage === 'CLOSED') continue;
    const dueAt = parseISO(app.slaDueAt);
    const daysRemaining = differenceInDays(dueAt, simDate);
    const stageCfg = rulesConfig.stages[app.currentStage as keyof typeof rulesConfig.stages];
    const threshold = stageCfg?.dueSoonThresholdDays ?? 2;

    // Approaching SLA threshold
    if (daysRemaining > 0 && daysRemaining <= threshold) {
      const key = `NOTIF-APP-DUE-SOON-${app.id}-${app.currentStage}`;
      if (!existingNotificationKeys.has(key)) {
        existingNotificationKeys.add(key);
        const notif: Notification = {
          id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          toRole: 'SCRUTINY_OFFICER',
          toUser: app.assignedTo,
          kind: 'UPCOMING',
          entityRef: { type: 'APPLICATION', id: app.id },
          message: `Application ${app.id} (${app.institutionName}) SLA due in ${daysRemaining} day(s) for ${app.currentStage}.`,
          createdAt: simIso,
          urgency: 'HIGH'
        };
        newNotifications.push(notif);
        newAuditEvents.push(
          createAuditEvent('SYSTEM', 'NOTIFICATION_SENT_DUE_SOON', { type: 'APPLICATION', id: app.id }, {
            reason: notif.message,
            at: simIso,
            isAutomated: true
          })
        );
      }
    }

    // Application Overdue
    if (isAfter(simDate, dueAt)) {
      const overdueDays = differenceInDays(simDate, dueAt);
      const key = `NOTIF-APP-OVERDUE-${app.id}-${app.currentStage}`;
      if (!existingNotificationKeys.has(key)) {
        existingNotificationKeys.add(key);
        const notif: Notification = {
          id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          toRole: 'REGIONAL_OFFICER',
          kind: 'OVERDUE',
          entityRef: { type: 'APPLICATION', id: app.id },
          message: `Application ${app.id} (${app.institutionName}) is ${overdueDays} day(s) OVERDUE in ${app.currentStage}.`,
          createdAt: simIso,
          urgency: 'CRITICAL'
        };
        newNotifications.push(notif);
        newAuditEvents.push(
          createAuditEvent('SYSTEM', 'NOTIFICATION_SENT_OVERDUE', { type: 'APPLICATION', id: app.id }, {
            reason: notif.message,
            at: simIso,
            isAutomated: true
          })
        );
      }
    }
  }

  // 2. Check EVC Scheduling Targets
  for (const evc of evcs) {
    if (evc.status === 'COMPLETED' || evc.status === 'SCHEDULED') continue;
    const target = parseISO(evc.scheduleTargetBy);
    const daysLeft = differenceInDays(target, simDate);

    if (daysLeft > 0 && daysLeft <= 2) {
      const key = `NOTIF-EVC-DUE-SOON-${evc.id}`;
      if (!existingNotificationKeys.has(key)) {
        existingNotificationKeys.add(key);
        const notif: Notification = {
          id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          toRole: 'EVC_COORDINATOR',
          kind: 'UPCOMING',
          entityRef: { type: 'EVC', id: evc.id },
          message: `EVC scheduling for ${evc.institutionName} reaches target in ${daysLeft} day(s).`,
          createdAt: simIso,
          urgency: 'HIGH'
        };
        newNotifications.push(notif);
      }
    }

    if (isAfter(simDate, target)) {
      const delayedDays = differenceInDays(simDate, target);
      const key = `NOTIF-EVC-DELAYED-${evc.id}`;
      if (!existingNotificationKeys.has(key)) {
        existingNotificationKeys.add(key);
        const notif: Notification = {
          id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          toRole: 'REGIONAL_OFFICER',
          kind: 'OVERDUE',
          entityRef: { type: 'EVC', id: evc.id },
          message: `EVC for ${evc.institutionName} delayed by ${delayedDays} day(s) beyond scheduling target!`,
          createdAt: simIso,
          urgency: 'CRITICAL'
        };
        newNotifications.push(notif);
        newAuditEvents.push(
          createAuditEvent('SYSTEM', 'EVC_SCHEDULE_DELAY_ALERT', { type: 'EVC', id: evc.id }, {
            reason: notif.message,
            at: simIso,
            isAutomated: true
          })
        );
      }
    }
  }

  // 3. Check Undertakings Due Dates (30, 15, 7, 1 days & overdue)
  const undertakingOffsets = [30, 15, 7, 1];
  for (const u of undertakings) {
    if (u.status === 'VERIFIED' || u.status === 'CLOSED') continue;
    const due = parseISO(u.dueDate);
    const daysLeft = differenceInDays(due, simDate);

    for (const offset of undertakingOffsets) {
      if (daysLeft === offset || (daysLeft > 0 && daysLeft <= offset && offset === 7)) {
        const key = `NOTIF-UNDERTAKING-${u.id}-${offset}D`;
        if (!existingNotificationKeys.has(key)) {
          existingNotificationKeys.add(key);
          const notif: Notification = {
            id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            toRole: 'INSTITUTION',
            toUser: u.institutionId,
            kind: 'UPCOMING',
            entityRef: { type: 'UNDERTAKING', id: u.id },
            message: `Undertaking requirement "${u.condition}" is due in ${daysLeft} day(s). Please submit evidence.`,
            createdAt: simIso,
            urgency: offset <= 7 ? 'HIGH' : 'NORMAL'
          };
          newNotifications.push(notif);
        }
      }
    }

    if (isAfter(simDate, due)) {
      const overdueDays = differenceInDays(simDate, due);
      const key = `NOTIF-UNDERTAKING-OVERDUE-${u.id}`;
      if (!existingNotificationKeys.has(key)) {
        existingNotificationKeys.add(key);
        const notif: Notification = {
          id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          toRole: 'COMPLIANCE_OFFICER',
          kind: 'OVERDUE',
          entityRef: { type: 'UNDERTAKING', id: u.id },
          message: `Undertaking for ${u.institutionName} (${u.condition}) is ${overdueDays} day(s) overdue.`,
          createdAt: simIso,
          urgency: 'CRITICAL'
        };
        newNotifications.push(notif);
        newAuditEvents.push(
          createAuditEvent('SYSTEM', 'UNDERTAKING_OVERDUE_ALERT', { type: 'UNDERTAKING', id: u.id }, {
            reason: notif.message,
            at: simIso,
            isAutomated: true
          })
        );
      }
    }
  }

  // 4. Check Document Validity (90, 60, 30, 7 days offsets)
  for (const doc of documents) {
    if (doc.status === 'RENEWAL_VERIFIED') continue;
    const validTo = parseISO(doc.validTo);
    const daysToExpiry = differenceInDays(validTo, simDate);

    for (const offset of rulesConfig.documentExpiryAlertOffsets) {
      if (daysToExpiry === offset || (daysToExpiry > 0 && daysToExpiry <= offset && offset === 7)) {
        const key = `NOTIF-DOC-EXPIRY-${doc.id}-${offset}D`;
        if (!existingNotificationKeys.has(key)) {
          existingNotificationKeys.add(key);
          const notif: Notification = {
            id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            toRole: 'INSTITUTION',
            toUser: doc.institutionId,
            kind: 'UPCOMING',
            entityRef: { type: 'DOCUMENT', id: doc.id },
            message: `Document "${doc.title}" for ${doc.institutionName} expires in ${daysToExpiry} day(s). Initiate renewal upload.`,
            createdAt: simIso,
            urgency: offset <= 30 ? 'HIGH' : 'NORMAL'
          };
          newNotifications.push(notif);
        }
      }
    }

    if (isAfter(simDate, validTo) && doc.status !== 'RENEWAL_SUBMITTED') {
      const expiredDays = differenceInDays(simDate, validTo);
      const key = `NOTIF-DOC-EXPIRED-${doc.id}`;
      if (!existingNotificationKeys.has(key)) {
        existingNotificationKeys.add(key);
        const notif: Notification = {
          id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          toRole: 'COMPLIANCE_OFFICER',
          kind: 'OVERDUE',
          entityRef: { type: 'DOCUMENT', id: doc.id },
          message: `Prescribed document "${doc.title}" of ${doc.institutionName} has expired (${expiredDays} days ago).`,
          createdAt: simIso,
          urgency: 'CRITICAL'
        };
        newNotifications.push(notif);
        newAuditEvents.push(
          createAuditEvent('SYSTEM', 'PRESCRIBED_DOCUMENT_EXPIRED_ALERT', { type: 'DOCUMENT', id: doc.id }, {
            reason: notif.message,
            at: simIso,
            isAutomated: true
          })
        );
      }
    }
  }

  return { notifications: newNotifications, auditEvents: newAuditEvents };
}
