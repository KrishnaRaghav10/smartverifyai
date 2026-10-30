export type Role =
  | 'INSTITUTION'
  | 'SCRUTINY_OFFICER'
  | 'REGIONAL_OFFICER'
  | 'BUREAU_OFFICER'
  | 'EVC_COORDINATOR'
  | 'COMMITTEE_MEMBER'
  | 'COMPLIANCE_OFFICER'
  | 'SENIOR_AUTHORITY'
  | 'SYSTEM_ADMIN'
  | 'AUDITOR';

export type Pathway =
  | 'ONLY_SCRUTINY'
  | 'SCRUTINY_EVC'
  | 'EVC_SAC_SHC'
  | 'ONLY_EVC'
  | 'SCRUTINY_EVC_SAC_SHC';

export type Stage =
  | 'SUBMITTED'
  | 'SCRUTINY'
  | 'RE_SCRUTINY'
  | 'EVC_QUEUE'
  | 'EVC_SCHEDULED'
  | 'EVC_DONE'
  | 'SAC_SHC'
  | 'DECISION'
  | 'CLOSED';

export type Region = 'Northern' | 'Southern' | 'Eastern' | 'Western' | 'Central';

export type ApplicationType = 'NEW' | 'EXTENSION' | 'CLOSURE' | 'OTHER';

export type Status = 'ON_TRACK' | 'DUE_SOON' | 'OVERDUE' | 'ESCALATED' | 'RETURNED' | 'CLOSED';

export interface ReturnRecord {
  by: string;
  at: string;
  reasonCode: string;
  remarks: string;
  resolvedAt?: string;
  deficiencies?: string[];
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string | 'SYSTEM';
  action: string;
  entityRef: { type: string; id: string };
  before?: any;
  after?: any;
  reason?: string;
  hash: string;
  prevHash?: string;
  isAutomated?: boolean;
}

export interface Application {
  id: string;
  institutionId: string;
  institutionName: string;
  region: Region;
  type: ApplicationType;
  pathway: Pathway;
  currentStage: Stage;
  stageEnteredAt: string;
  assignedTo: string;
  slaDueAt: string;
  status: Status;
  returns: ReturnRecord[];
  history: AuditEvent[];
  courseCount: number;
  studentIntake: number;
  programme: string;
  deficiencies?: string[];
  electronicSummaryDraft?: string;
  scrutinyChecklist?: {
    paramId: string;
    title: string;
    category: string;
    status: 'PASS' | 'DEFICIENT' | 'NA';
    remarks?: string;
  }[];
  finalDecision?: {
    outcome: 'APPROVED' | 'REJECTED';
    decidedBy: string;
    decidedAt: string;
    mandatoryReason: string;
  };
}

export interface EVC {
  id: string;
  applicationId: string;
  institutionId: string;
  institutionName: string;
  region: Region;
  isNewInstitution: boolean;
  queuedAt: string;
  scheduleTargetBy: string;
  scheduledFor?: string;
  panel: string[]; // Expert user names/IDs
  status: 'QUEUED' | 'SCHEDULED' | 'COMPLETED' | 'DELAYED';
  reportDueBy?: string;
  reportSubmittedAt?: string;
  observations?: string;
  expertConflicts?: string[];
}

export interface Evidence {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  size: string;
  fileType: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  comments?: string;
}

export interface Undertaking {
  id: string;
  applicationId: string;
  institutionId: string;
  institutionName: string;
  region: Region;
  condition: string;
  category: 'FACULTY' | 'INFRASTRUCTURE' | 'LAB_EQUIPMENT' | 'LIBRARY' | 'FINANCIAL';
  dueDate: string;
  evidence: Evidence[];
  status: 'OPEN' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED_RESUBMIT' | 'OVERDUE' | 'ESCALATED' | 'CLOSED';
  proposedBy?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  remarks?: string;
}

export type DocumentType =
  | 'LEASE'
  | 'LAND_TITLE'
  | 'BUILDING_PLAN'
  | 'FIRE_NOC'
  | 'FDR_DEPOSIT'
  | 'AFFILIATION_NOC';

export interface PrescribedDocument {
  id: string;
  institutionId: string;
  institutionName: string;
  region: Region;
  type: DocumentType;
  title: string;
  validFrom: string;
  validTo: string;
  fileRef: string;
  fileSize: string;
  status: 'VALID' | 'EXPIRING' | 'EXPIRED' | 'RENEWAL_SUBMITTED' | 'RENEWAL_VERIFIED';
  renewalEvidence?: Evidence;
  lastAlertSentAt?: string;
}

export interface Notification {
  id: string;
  toRole: Role;
  toUser?: string;
  kind: 'PENDING' | 'UPCOMING' | 'OVERDUE' | 'ESCALATION';
  entityRef: { type: string; id: string };
  message: string;
  createdAt: string;
  readAt?: string;
  urgency?: 'NORMAL' | 'HIGH' | 'CRITICAL';
}

export interface Institution {
  id: string;
  name: string;
  aicteId: string;
  region: Region;
  state: string;
  city: string;
  establishedYear: number;
  complianceScore: number;
  contactEmail: string;
  phone: string;
  address: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  designation: string;
  region?: Region;
  department?: string;
}

export interface StageConfig {
  stage: Stage;
  name: string;
  defaultSlaDays: number;
  dueSoonThresholdDays: number;
  allowedNextStages: Stage[];
}

export interface EscalationLevel {
  level: number;
  targetRole: Role;
  waitDays: number;
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'ALL';
  notificationTemplate: string;
}

export interface SystemRules {
  stages: Record<Stage, StageConfig>;
  pathways: Record<Pathway, Stage[]>;
  escalationLadders: {
    application: EscalationLevel[];
    evc: EscalationLevel[];
    undertaking: EscalationLevel[];
    document: EscalationLevel[];
  };
  documentExpiryAlertOffsets: number[]; // e.g. [90, 60, 30, 7]
  disclaimer: string;
}
