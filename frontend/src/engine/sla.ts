import { Application, EVC, Undertaking, PrescribedDocument, Status } from '../types';
import rulesConfig from '../config/rules.json';
import { differenceInDays, parseISO, isAfter } from 'date-fns';

export function calculateApplicationSla(
  app: Application,
  simDate: Date
): { status: Status; ageDays: number; daysRemaining: number } {
  if (app.currentStage === 'CLOSED' || app.status === 'CLOSED') {
    return { status: 'CLOSED', ageDays: 0, daysRemaining: 0 };
  }
  if (app.status === 'RETURNED') {
    const ageDays = Math.max(0, differenceInDays(simDate, parseISO(app.stageEnteredAt)));
    return { status: 'RETURNED', ageDays, daysRemaining: 0 };
  }

  const enteredAt = parseISO(app.stageEnteredAt);
  const dueAt = parseISO(app.slaDueAt);
  const stageCfg = rulesConfig.stages[app.currentStage as keyof typeof rulesConfig.stages];
  const dueSoonDays = stageCfg?.dueSoonThresholdDays ?? 2;

  const ageDays = Math.max(0, differenceInDays(simDate, enteredAt));
  const daysRemaining = differenceInDays(dueAt, simDate);

  if (isAfter(simDate, dueAt)) {
    // Overdue or Escalated
    const overdueDays = differenceInDays(simDate, dueAt);
    if (overdueDays >= 3) {
      return { status: 'ESCALATED', ageDays, daysRemaining };
    }
    return { status: 'OVERDUE', ageDays, daysRemaining };
  }

  if (daysRemaining <= dueSoonDays) {
    return { status: 'DUE_SOON', ageDays, daysRemaining };
  }

  return { status: 'ON_TRACK', ageDays, daysRemaining };
}

export function calculateUndertakingStatus(
  u: Undertaking,
  simDate: Date
): Undertaking['status'] {
  if (u.status === 'VERIFIED' || u.status === 'CLOSED' || u.status === 'SUBMITTED') {
    return u.status;
  }
  
  const due = parseISO(u.dueDate);
  if (isAfter(simDate, due)) {
    const overdueDays = differenceInDays(simDate, due);
    return overdueDays >= 7 ? 'ESCALATED' : 'OVERDUE';
  }

  return u.status;
}

export function calculateDocumentStatus(
  doc: PrescribedDocument,
  simDate: Date
): PrescribedDocument['status'] {
  if (doc.status === 'RENEWAL_VERIFIED' || doc.status === 'RENEWAL_SUBMITTED') {
    return doc.status;
  }

  const validTo = parseISO(doc.validTo);
  if (isAfter(simDate, validTo)) {
    return 'EXPIRED';
  }

  const daysToExpiry = differenceInDays(validTo, simDate);
  if (daysToExpiry <= 30) {
    return 'EXPIRING';
  }

  return 'VALID';
}

export function calculateEvcStatus(
  evc: EVC,
  simDate: Date
): EVC['status'] {
  if (evc.status === 'COMPLETED' || evc.status === 'SCHEDULED') {
    return evc.status;
  }

  const target = parseISO(evc.scheduleTargetBy);
  if (isAfter(simDate, target)) {
    return 'DELAYED';
  }

  return 'QUEUED';
}
