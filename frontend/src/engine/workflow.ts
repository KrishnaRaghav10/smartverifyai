import { Application, Stage, Pathway, Role, ReturnRecord, EVC } from '../types';
import rulesConfig from '../config/rules.json';
import { addDays, formatISO } from 'date-fns';
import { createAuditEvent } from './audit';

export function resolvePathway(type: Application['type']): Pathway {
  switch (type) {
    case 'NEW':
      return 'SCRUTINY_EVC';
    case 'EXTENSION':
      return 'ONLY_SCRUTINY';
    case 'CLOSURE':
      return 'ONLY_SCRUTINY';
    default:
      return 'SCRUTINY_EVC_SAC_SHC';
  }
}

export function getNextStageInPathway(pathway: Pathway, currentStage: Stage): Stage | null {
  const stageList = rulesConfig.pathways[pathway] as Stage[];
  if (!stageList) return null;
  const currentIndex = stageList.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex >= stageList.length - 1) {
    return null;
  }
  return stageList[currentIndex + 1];
}

export function canRoleActOnStage(role: Role, stage: Stage): boolean {
  switch (stage) {
    case 'SUBMITTED':
    case 'SCRUTINY':
    case 'RE_SCRUTINY':
      return role === 'SCRUTINY_OFFICER' || role === 'REGIONAL_OFFICER' || role === 'SYSTEM_ADMIN';
    case 'EVC_QUEUE':
    case 'EVC_SCHEDULED':
      return role === 'EVC_COORDINATOR' || role === 'REGIONAL_OFFICER' || role === 'SYSTEM_ADMIN';
    case 'EVC_DONE':
      return role === 'EVC_COORDINATOR' || role === 'COMMITTEE_MEMBER' || role === 'SYSTEM_ADMIN';
    case 'SAC_SHC':
      return role === 'COMMITTEE_MEMBER' || role === 'SENIOR_AUTHORITY' || role === 'SYSTEM_ADMIN';
    case 'DECISION':
      return role === 'SENIOR_AUTHORITY' || role === 'SYSTEM_ADMIN';
    default:
      return true;
  }
}

export interface WorkflowTransitionResult {
  success: boolean;
  message: string;
  updatedApplication?: Application;
  newEvc?: EVC;
}

export function advanceApplicationStage(
  app: Application,
  actor: string,
  actorRole: Role,
  simDate: Date,
  reason: string,
  customNextStage?: Stage
): WorkflowTransitionResult {
  // Regulatory Safeguard Check: Final decision can NEVER be automated
  if (app.currentStage === 'DECISION' && actor === 'SYSTEM') {
    return {
      success: false,
      message: 'REGULATORY SAFEGUARD VIOLATION: Statutory decisions of the competent authority cannot be automated.'
    };
  }

  if (!canRoleActOnStage(actorRole, app.currentStage)) {
    return {
      success: false,
      message: `Role ${actorRole} is not authorised to complete stage ${app.currentStage}.`
    };
  }

  const nextStage = customNextStage || getNextStageInPathway(app.pathway, app.currentStage);
  if (!nextStage) {
    return {
      success: false,
      message: `No next stage found in pathway ${app.pathway} after ${app.currentStage}.`
    };
  }

  const nextStageCfg = rulesConfig.stages[nextStage as keyof typeof rulesConfig.stages];
  const slaDays = nextStageCfg?.defaultSlaDays ?? 7;
  const stageEnteredAt = formatISO(simDate);
  const slaDueAt = formatISO(addDays(simDate, slaDays));

  const prevHash = app.history?.length > 0 ? app.history[app.history.length - 1].hash : undefined;
  const audit = createAuditEvent(
    actor,
    `ADVANCED_STAGE_${app.currentStage}_TO_${nextStage}`,
    { type: 'APPLICATION', id: app.id },
    {
      before: { stage: app.currentStage, slaDueAt: app.slaDueAt },
      after: { stage: nextStage, slaDueAt },
      reason,
      prevHash,
      isAutomated: actor === 'SYSTEM',
      at: stageEnteredAt
    }
  );

  let createdEvc: EVC | undefined = undefined;
  if (nextStage === 'EVC_QUEUE') {
    // Auto-queue for EVC
    const isNew = app.type === 'NEW';
    const targetDays = isNew ? 7 : 10;
    createdEvc = {
      id: `EVC-${app.id.replace('APP-', '')}`,
      applicationId: app.id,
      institutionId: app.institutionId,
      institutionName: app.institutionName,
      region: app.region,
      isNewInstitution: isNew,
      queuedAt: stageEnteredAt,
      scheduleTargetBy: formatISO(addDays(simDate, targetDays)),
      panel: [],
      status: 'QUEUED'
    };
  }

  const updated: Application = {
    ...app,
    currentStage: nextStage,
    stageEnteredAt,
    slaDueAt,
    status: 'ON_TRACK',
    history: [...(app.history || []), audit]
  };

  return {
    success: true,
    message: `Application advanced successfully to ${nextStageCfg?.name || nextStage}.`,
    updatedApplication: updated,
    newEvc: createdEvc
  };
}

export function returnApplicationDeficiency(
  app: Application,
  actor: string,
  actorRole: Role,
  simDate: Date,
  reasonCode: string,
  remarks: string,
  deficiencies: string[]
): WorkflowTransitionResult {
  if (actorRole !== 'SCRUTINY_OFFICER' && actorRole !== 'REGIONAL_OFFICER' && actorRole !== 'SYSTEM_ADMIN') {
    return {
      success: false,
      message: 'Only Scrutiny or Regional Officers can return an application for deficiency.'
    };
  }

  const nowIso = formatISO(simDate);
  const returnRecord: ReturnRecord = {
    by: actor,
    at: nowIso,
    reasonCode,
    remarks,
    deficiencies
  };

  const prevHash = app.history?.length > 0 ? app.history[app.history.length - 1].hash : undefined;
  const audit = createAuditEvent(
    actor,
    'APPLICATION_RETURNED_FOR_DEFICIENCY',
    { type: 'APPLICATION', id: app.id },
    {
      before: { status: app.status },
      after: { status: 'RETURNED', reasonCode, remarks },
      reason: remarks,
      prevHash,
      isAutomated: false,
      at: nowIso
    }
  );

  const updated: Application = {
    ...app,
    status: 'RETURNED',
    currentStage: 'RE_SCRUTINY',
    deficiencies,
    returns: [...(app.returns || []), returnRecord],
    history: [...(app.history || []), audit]
  };

  return {
    success: true,
    message: `Application returned to ${app.institutionName} with ${deficiencies.length} identified deficiencies.`,
    updatedApplication: updated
  };
}
