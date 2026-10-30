import {
  Institution,
  Application,
  EVC,
  Undertaking,
  PrescribedDocument,
  AuditEvent,
  User,
  Region,
  Pathway,
  Stage
} from '../types';
import { addDays, subDays, formatISO } from 'date-fns';
import { createAuditEvent } from '../engine/audit';

// Base Simulated "Today" is 30 Oct 2026
export const SIMULATED_START_DATE = new Date('2026-10-30T10:00:00+05:30');

export const DEMO_USERS: User[] = [
  {
    id: 'USR-INST-01',
    name: 'Dr. Ramesh Gupta',
    email: 'principal@aarohan-tech.edu.in',
    role: 'INSTITUTION',
    designation: 'Principal & Head of Institution',
    region: 'Western'
  },
  {
    id: 'USR-SCRUT-01',
    name: 'Er. Vikram Deshmukh',
    email: 'vikram.deshmukh@aicte-india.org',
    role: 'SCRUTINY_OFFICER',
    designation: 'Senior Scrutiny Officer',
    region: 'Western'
  },
  {
    id: 'USR-RO-01',
    name: 'Dr. Sunita Sharma',
    email: 'ro.western@aicte-india.org',
    role: 'REGIONAL_OFFICER',
    designation: 'Regional Officer (Western Region)',
    region: 'Western'
  },
  {
    id: 'USR-BUR-01',
    name: 'Shri Rajeev Verma',
    email: 'advisor.approval@aicte-india.org',
    role: 'BUREAU_OFFICER',
    designation: 'Advisor & Bureau Head',
    region: 'Central'
  },
  {
    id: 'USR-EVC-01',
    name: 'Prof. Amitava Bose',
    email: 'evc.national@aicte-india.org',
    role: 'EVC_COORDINATOR',
    designation: 'National EVC Coordinator'
  },
  {
    id: 'USR-COMM-01',
    name: 'Dr. K. S. Radhakrishnan',
    email: 'radhakrishnan.sac@aicte-india.org',
    role: 'COMMITTEE_MEMBER',
    designation: 'Chairman, Standing Appellate Committee (SAC)'
  },
  {
    id: 'USR-COMP-01',
    name: 'Smt. Meenakshi Sundaram',
    email: 'compliance.cell@aicte-india.org',
    role: 'COMPLIANCE_OFFICER',
    designation: 'Director, Compliance & Quality Monitoring'
  },
  {
    id: 'USR-SENIOR-01',
    name: 'Prof. T. G. Sitharam',
    email: 'chairman@aicte-india.org',
    role: 'SENIOR_AUTHORITY',
    designation: 'Chairman, AICTE'
  },
  {
    id: 'USR-ADMIN-01',
    name: 'Arun Kumar',
    email: 'admin.systems@aicte-india.org',
    role: 'SYSTEM_ADMIN',
    designation: 'Head of Systems & Policy Architecture'
  },
  {
    id: 'USR-AUDIT-01',
    name: 'Justice (Retd.) B. N. Srikrishna',
    email: 'ombudsman@aicte-india.org',
    role: 'AUDITOR',
    designation: 'Statutory Transparency Auditor'
  }
];

export const REGIONS: Region[] = ['Northern', 'Southern', 'Eastern', 'Western', 'Central'];

export function generateSeedData() {
  const baseDate = SIMULATED_START_DATE;
  const baseIso = formatISO(baseDate);

  // 1. Generate ~30 Institutions across 5 regions
  const institutions: Institution[] = [];
  const instNamesByRegion: Record<Region, string[]> = {
    Western: [
      'Aarohan Institute of Technology', // HERO 1
      'Sahyadri College of Engineering & Research',
      'Deccan Institute of Advanced Management',
      'Konkan Polytechnic & Skill Academy',
      'Ajanta Institute of Pharmacy & Tech',
      'Marathwada School of Applied Sciences'
    ],
    Southern: [
      'Meridian College of Engineering', // HERO 2
      'Cauvery Institute of Technology',
      'Nilgiri Institute of Computer Applications',
      'Malabar Engineering Academy',
      'Dravida Institute of Pharmaceutical Studies',
      'Chola Regional Institute of Architecture'
    ],
    Northern: [
      'Orion Polytechnic Institute', // HERO 3
      'Himalayan College of Engineering',
      'Doab Institute of Technology & Research',
      'Shivalik Academy of Management Studies',
      'Kailash Regional Institute of Pharmacy',
      'Indus Institute of Emerging Technologies'
    ],
    Central: [
      'Kaveri School of Management', // HERO 4
      'Vindhya Institute of Engineering',
      'Satpura Institute of Technical Studies',
      'Narmada College of Architecture & Planning',
      'Malwa Polytechnic Institute',
      'Bundelkhand Institute of Pharmacy'
    ],
    Eastern: [
      'Brahmaputra Institute of Technology',
      'Kalinga College of Engineering & Science',
      'Sunderbans Institute of Marine Sciences',
      'Patliputra Technical Campus',
      'Mayurbhanj Institute of Mining Engineering',
      'Nalanda Advanced Research Academy'
    ]
  };

  const statesByRegion: Record<Region, string> = {
    Western: 'Maharashtra',
    Southern: 'Karnataka',
    Northern: 'Uttar Pradesh',
    Central: 'Madhya Pradesh',
    Eastern: 'Odisha'
  };

  let instCounter = 1;
  for (const reg of REGIONS) {
    const names = instNamesByRegion[reg];
    for (let i = 0; i < names.length; i++) {
      const code = reg.charAt(0);
      const id = i === 0 && reg === 'Western' ? 'INST-W-01'
               : i === 0 && reg === 'Southern' ? 'INST-S-01'
               : i === 0 && reg === 'Northern' ? 'INST-N-01'
               : i === 0 && reg === 'Central' ? 'INST-C-01'
               : `INST-${code}-${(i + 1).toString().padStart(2, '0')}`;

      institutions.push({
        id,
        name: names[i],
        aicteId: `1-${(1000000000 + instCounter).toString()}`,
        region: reg,
        state: statesByRegion[reg],
        city: reg === 'Western' ? 'Pune' : reg === 'Southern' ? 'Bengaluru' : reg === 'Northern' ? 'Noida' : reg === 'Central' ? 'Bhopal' : 'Bhubaneswar',
        establishedYear: 2005 + (i * 3) % 18,
        complianceScore: i === 0 ? 88 : 70 + (i * 5) % 28,
        contactEmail: `contact@${id.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu.in`,
        phone: `+91 98230 ${10000 + instCounter}`,
        address: `AICTE Campus Zone ${i + 1}, Institutional Area, ${statesByRegion[reg]}`
      });
      instCounter++;
    }
  }

  // 2. Applications Generator (~120 applications)
  const applications: Application[] = [];
  const pathways: Pathway[] = ['ONLY_SCRUTINY', 'SCRUTINY_EVC', 'EVC_SAC_SHC', 'ONLY_EVC', 'SCRUTINY_EVC_SAC_SHC'];
  const programmes = ['Engineering & Tech', 'Management (MBA)', 'MCA', 'Pharmacy', 'Architecture', 'Applied Arts'];

  // Seed Hero 1: Aarohan Institute of Technology (App on track, Lease expires soon)
  applications.push({
    id: 'APP-W-001',
    institutionId: 'INST-W-01',
    institutionName: 'Aarohan Institute of Technology',
    region: 'Western',
    type: 'EXTENSION',
    pathway: 'SCRUTINY_EVC',
    currentStage: 'SCRUTINY',
    stageEnteredAt: formatISO(subDays(baseDate, 3)),
    assignedTo: 'USR-SCRUT-01',
    slaDueAt: formatISO(addDays(baseDate, 4)),
    status: 'ON_TRACK',
    returns: [],
    history: [
      createAuditEvent('USR-INST-01', 'SUBMITTED_APPLICATION', { type: 'APPLICATION', id: 'APP-W-001' }, {
        reason: 'Annual Extension of Approval (EoA) submitted for AY 2026-27',
        at: formatISO(subDays(baseDate, 3)),
        isAutomated: false
      })
    ],
    courseCount: 6,
    studentIntake: 420,
    programme: 'Engineering & Tech',
    scrutinyChecklist: [
      { paramId: 'CHK-1', title: 'Land & Building Title/Lease Verification', category: 'Infrastructure', status: 'PASS', remarks: 'Registered lease copy verified. Note: Lease expires within 30 days.' },
      { paramId: 'CHK-2', title: 'Faculty-Student Ratio (1:15 compliance)', category: 'Faculty', status: 'PASS', remarks: 'Cadre ratio verified on portal.' },
      { paramId: 'CHK-3', title: 'Barrier-Free Environment & Lifts', category: 'Accessibility', status: 'PASS', remarks: 'Ramp and wheelchair access documented.' }
    ]
  });

  // Seed Hero 2: Meridian College of Engineering (New Institution EVC Queued & Delaying)
  applications.push({
    id: 'APP-S-001',
    institutionId: 'INST-S-01',
    institutionName: 'Meridian College of Engineering',
    region: 'Southern',
    type: 'NEW',
    pathway: 'SCRUTINY_EVC',
    currentStage: 'EVC_QUEUE',
    stageEnteredAt: formatISO(subDays(baseDate, 9)),
    assignedTo: 'USR-EVC-01',
    slaDueAt: formatISO(subDays(baseDate, 2)), // 2 days past target!
    status: 'OVERDUE',
    returns: [],
    history: [
      createAuditEvent('USR-SCRUT-01', 'SCRUTINY_RECOMMENDED_EVC', { type: 'APPLICATION', id: 'APP-S-001' }, {
        reason: 'First scrutiny cleared. New technical campus inspection mandated.',
        at: formatISO(subDays(baseDate, 9)),
        isAutomated: false
      })
    ],
    courseCount: 4,
    studentIntake: 240,
    programme: 'Engineering & Tech'
  });

  // Seed Hero 3: Orion Polytechnic Institute (Returned for deficiencies, ready for re-submission)
  applications.push({
    id: 'APP-N-001',
    institutionId: 'INST-N-01',
    institutionName: 'Orion Polytechnic Institute',
    region: 'Northern',
    type: 'EXTENSION',
    pathway: 'SCRUTINY_EVC_SAC_SHC',
    currentStage: 'RE_SCRUTINY',
    stageEnteredAt: formatISO(subDays(baseDate, 2)),
    assignedTo: 'USR-SCRUT-01',
    slaDueAt: formatISO(addDays(baseDate, 3)),
    status: 'RETURNED',
    deficiencies: [
      'Fire Safety NOC renewal pending from local Municipal Fire Service',
      'Shortfall in AICTE approved journal subscriptions in Digital Library',
      'Corpus fund FDR copy missing lien endorsement'
    ],
    returns: [
      {
        by: 'USR-SCRUT-01',
        at: formatISO(subDays(baseDate, 2)),
        reasonCode: 'DEFICIENCY_SCRUTINY_1',
        remarks: 'Three non-compliances identified during initial scrutiny. Rectify within 7 statutory days.',
        deficiencies: [
          'Fire Safety NOC renewal pending from local Municipal Fire Service',
          'Shortfall in AICTE approved journal subscriptions in Digital Library',
          'Corpus fund FDR copy missing lien endorsement'
        ]
      }
    ],
    history: [
      createAuditEvent('USR-SCRUT-01', 'APPLICATION_RETURNED_FOR_DEFICIENCY', { type: 'APPLICATION', id: 'APP-N-001' }, {
        reason: 'Three statutory deficiencies raised.',
        at: formatISO(subDays(baseDate, 2)),
        isAutomated: false
      })
    ],
    courseCount: 5,
    studentIntake: 300,
    programme: 'Engineering & Tech'
  });

  // Seed Hero 4: Kaveri School of Management (SAC/SHC Stage & Undertaking Workflow)
  applications.push({
    id: 'APP-C-001',
    institutionId: 'INST-C-01',
    institutionName: 'Kaveri School of Management',
    region: 'Central',
    type: 'EXTENSION',
    pathway: 'EVC_SAC_SHC',
    currentStage: 'SAC_SHC',
    stageEnteredAt: formatISO(subDays(baseDate, 4)),
    assignedTo: 'USR-COMM-01',
    slaDueAt: formatISO(addDays(baseDate, 3)),
    status: 'ON_TRACK',
    returns: [],
    history: [
      createAuditEvent('USR-EVC-01', 'EVC_COMPLETED_REFERRED_TO_SAC', { type: 'APPLICATION', id: 'APP-C-001' }, {
        reason: 'EVC conducted with minor conditions on faculty retention. Referred to Standing Appellate Committee.',
        at: formatISO(subDays(baseDate, 4)),
        isAutomated: false
      })
    ],
    courseCount: 2,
    studentIntake: 120,
    programme: 'Management (MBA)'
  });

  // Generate ~116 additional applications across all 30 institutions
  let appIdx = 5;
  const stagesList: Stage[] = ['SUBMITTED', 'SCRUTINY', 'RE_SCRUTINY', 'EVC_QUEUE', 'EVC_SCHEDULED', 'EVC_DONE', 'SAC_SHC', 'DECISION', 'CLOSED'];

  for (const inst of institutions) {
    const appsForInst = (appIdx % 3) + 3; // 3 to 5 apps per institution
    for (let j = 0; j < appsForInst; j++) {
      if (applications.length >= 120) break;
      const appId = `APP-${inst.region.charAt(0)}-${appIdx.toString().padStart(3, '0')}`;
      const pw = pathways[(appIdx + j) % pathways.length];
      const stage = stagesList[(appIdx * 2 + j) % stagesList.length];
      
      // Distribution: 55% ON_TRACK, 25% DUE_SOON, 15% OVERDUE, 5% ESCALATED
      let daysDelta = 5;
      let status: Application['status'] = 'ON_TRACK';
      const mod100 = (appIdx * 17 + j * 7) % 100;
      if (mod100 < 55) {
        status = 'ON_TRACK';
        daysDelta = 4;
      } else if (mod100 < 80) {
        status = 'DUE_SOON';
        daysDelta = 1;
      } else if (mod100 < 95) {
        status = 'OVERDUE';
        daysDelta = -2;
      } else {
        status = 'ESCALATED';
        daysDelta = -6;
      }

      if (stage === 'CLOSED') {
        status = 'CLOSED';
      }

      const stageEnteredAt = formatISO(subDays(baseDate, Math.abs(daysDelta) + 2));
      const slaDueAt = formatISO(addDays(baseDate, daysDelta));

      applications.push({
        id: appId,
        institutionId: inst.id,
        institutionName: inst.name,
        region: inst.region,
        type: j === 0 ? 'NEW' : j === 1 ? 'EXTENSION' : 'OTHER',
        pathway: pw,
        currentStage: stage,
        stageEnteredAt,
        assignedTo: inst.region === 'Western' ? 'USR-SCRUT-01' : 'USR-RO-01',
        slaDueAt,
        status,
        returns: [],
        history: [
          createAuditEvent('SYSTEM', 'APPLICATION_STAGE_INITIALIZED', { type: 'APPLICATION', id: appId }, {
            reason: `Entered ${stage} stage automatically`,
            at: stageEnteredAt,
            isAutomated: true
          })
        ],
        courseCount: 3 + ((appIdx + j) % 6),
        studentIntake: 60 * (3 + ((appIdx + j) % 6)),
        programme: programmes[(appIdx + j) % programmes.length]
      });
      appIdx++;
    }
  }

  // 3. EVC Seed Records (~25 EVCs)
  const evcs: EVC[] = [
    // Hero 2 EVC: Meridian College (Delayed)
    {
      id: 'EVC-S-001',
      applicationId: 'APP-S-001',
      institutionId: 'INST-S-01',
      institutionName: 'Meridian College of Engineering',
      region: 'Southern',
      isNewInstitution: true,
      queuedAt: formatISO(subDays(baseDate, 9)),
      scheduleTargetBy: formatISO(subDays(baseDate, 2)), // 2 days past target
      panel: [],
      status: 'DELAYED',
      expertConflicts: ['Dr. V. Rao (Conflict: Alumnus of sponsoring trust)']
    },
    // Hero 1 EVC: Aarohan (Queued)
    {
      id: 'EVC-W-001',
      applicationId: 'APP-W-001',
      institutionId: 'INST-W-01',
      institutionName: 'Aarohan Institute of Technology',
      region: 'Western',
      isNewInstitution: false,
      queuedAt: formatISO(subDays(baseDate, 2)),
      scheduleTargetBy: formatISO(addDays(baseDate, 8)),
      panel: ['Prof. K. Mehta (IIT Bombay)', 'Dr. S. Kulkarni (COEP)'],
      scheduledFor: formatISO(addDays(baseDate, 6)),
      status: 'SCHEDULED',
      reportDueBy: formatISO(addDays(baseDate, 11))
    }
  ];

  // Add 23 more EVCs
  for (let k = 1; k <= 23; k++) {
    const inst = institutions[k % institutions.length];
    const isNew = k % 4 === 0;
    const statusVal = k % 4 === 0 ? 'DELAYED' : k % 3 === 0 ? 'SCHEDULED' : k % 5 === 0 ? 'COMPLETED' : 'QUEUED';
    const queuedAt = formatISO(subDays(baseDate, 5 + k));
    const targetDays = statusVal === 'DELAYED' ? -3 : 4 + (k % 7);

    evcs.push({
      id: `EVC-${inst.region.charAt(0)}-${(100 + k).toString()}`,
      applicationId: `APP-${inst.region.charAt(0)}-${(k + 10).toString().padStart(3, '0')}`,
      institutionId: inst.id,
      institutionName: inst.name,
      region: inst.region,
      isNewInstitution: isNew,
      queuedAt,
      scheduleTargetBy: formatISO(addDays(baseDate, targetDays)),
      scheduledFor: statusVal === 'SCHEDULED' || statusVal === 'COMPLETED' ? formatISO(addDays(baseDate, targetDays - 1)) : undefined,
      panel: ['Prof. N. Sharma (Expert)', 'Dr. R. Bannerjee (NIT)'],
      status: statusVal
    });
  }

  // 4. Undertakings (~40 undertakings)
  const undertakings: Undertaking[] = [
    // Hero 4: Kaveri School of Management (resubmitted after rejection)
    {
      id: 'UND-C-001',
      applicationId: 'APP-C-001',
      institutionId: 'INST-C-01',
      institutionName: 'Kaveri School of Management',
      region: 'Central',
      condition: 'Appoint 2 Ph.D. qualified Professors in Marketing & Business Analytics per cadre ratio',
      category: 'FACULTY',
      dueDate: formatISO(addDays(baseDate, 5)),
      evidence: [
        {
          id: 'EVD-01',
          name: 'Offer_Letters_and_Joining_Reports_Phd_Faculty.pdf',
          url: '/sample_data/Offer_Letters.pdf',
          uploadedAt: formatISO(subDays(baseDate, 1)),
          size: '2.4 MB',
          fileType: 'application/pdf',
          status: 'PENDING',
          comments: 'Resubmitted with verified university approval certificates as requested.'
        }
      ],
      status: 'SUBMITTED',
      proposedBy: 'USR-COMM-01',
      remarks: 'Previous submission lacked university endorsement letters. Resubmission uploaded by institution.'
    },
    // Hero 1: Aarohan Institute of Technology (Due soon)
    {
      id: 'UND-W-001',
      applicationId: 'APP-W-001',
      institutionId: 'INST-W-01',
      institutionName: 'Aarohan Institute of Technology',
      region: 'Western',
      condition: 'Commission additional 100 Mbps leased line internet redundancy for AI Lab',
      category: 'INFRASTRUCTURE',
      dueDate: formatISO(addDays(baseDate, 5)),
      evidence: [],
      status: 'OPEN'
    }
  ];

  const undertakingConditions = [
    'Complete installation of Fire Sprinkler System in Academic Block B',
    'Deposition of Rs 15 Lakh Joint FDR in AICTE account for endowment fund',
    'Procure 50 licensed CAD/CAM design software terminals for Mechanical Lab',
    'Erection of dedicated Solar Photovoltaic rooftop 50 kW array',
    'Recruitment of qualified Training & Placement Officer with industry track record',
    'Establishing Anti-Ragging Committee web portal integration and CCTV linkage'
  ];

  for (let u = 2; u < 40; u++) {
    const inst = institutions[u % institutions.length];
    const daysOffset = (u % 4 === 0) ? -5 : (u % 3 === 0) ? 3 : 15 + u;
    const stat: Undertaking['status'] = daysOffset < -2 ? 'OVERDUE' : daysOffset <= 5 ? 'OPEN' : 'OPEN';

    undertakings.push({
      id: `UND-${inst.region.charAt(0)}-${(200 + u).toString()}`,
      applicationId: `APP-${inst.region.charAt(0)}-${(u + 5).toString().padStart(3, '0')}`,
      institutionId: inst.id,
      institutionName: inst.name,
      region: inst.region,
      condition: undertakingConditions[u % undertakingConditions.length],
      category: u % 2 === 0 ? 'INFRASTRUCTURE' : 'FACULTY',
      dueDate: formatISO(addDays(baseDate, daysOffset)),
      evidence: u % 3 === 0 ? [
        {
          id: `EVD-${u}`,
          name: `Compliance_Proof_${u}.pdf`,
          url: '/sample_data/proof.pdf',
          uploadedAt: formatISO(subDays(baseDate, 2)),
          size: '1.8 MB',
          fileType: 'application/pdf',
          status: 'PENDING'
        }
      ] : [],
      status: u % 5 === 0 ? 'VERIFIED' : stat
    });
  }

  // 5. Prescribed Documents & Lease Vault (~50 documents)
  const documents: PrescribedDocument[] = [
    // Hero 1: Aarohan Institute of Technology (Lease expires in 21 days!)
    {
      id: 'DOC-W-001',
      institutionId: 'INST-W-01',
      institutionName: 'Aarohan Institute of Technology',
      region: 'Western',
      type: 'LEASE',
      title: 'Registered Land & Campus 30-Year Lease Agreement',
      validFrom: formatISO(subDays(baseDate, 365 * 29 + 344)),
      validTo: formatISO(addDays(baseDate, 21)), // 21 DAYS REMAINING!
      fileRef: 'Aarohan_Campus_Lease_Agreement_1996_2026.pdf',
      fileSize: '4.8 MB',
      status: 'EXPIRING'
    },
    {
      id: 'DOC-W-002',
      institutionId: 'INST-W-01',
      institutionName: 'Aarohan Institute of Technology',
      region: 'Western',
      type: 'FIRE_NOC',
      title: 'Municipal Fire Safety & Prevention NOC',
      validFrom: formatISO(subDays(baseDate, 300)),
      validTo: formatISO(addDays(baseDate, 65)),
      fileRef: 'Fire_NOC_PMC_Aarohan.pdf',
      fileSize: '1.2 MB',
      status: 'VALID'
    },
    {
      id: 'DOC-W-003',
      institutionId: 'INST-W-01',
      institutionName: 'Aarohan Institute of Technology',
      region: 'Western',
      type: 'AFFILIATION_NOC',
      title: 'Affiliating University Permanent Affiliation Order',
      validFrom: formatISO(subDays(baseDate, 400)),
      validTo: formatISO(addDays(baseDate, 180)),
      fileRef: 'SPPU_Affiliation_2026_27.pdf',
      fileSize: '2.1 MB',
      status: 'VALID'
    }
  ];

  const docTypes: PrescribedDocument['type'][] = ['LEASE', 'LAND_TITLE', 'BUILDING_PLAN', 'FIRE_NOC', 'FDR_DEPOSIT', 'AFFILIATION_NOC'];

  for (let d = 3; d < 50; d++) {
    const inst = institutions[d % institutions.length];
    const dtype = docTypes[d % docTypes.length];
    // Expiry spread from -30 days to +180 days
    const expiryOffset = -25 + (d * 9) % 210;
    const validTo = formatISO(addDays(baseDate, expiryOffset));
    const validFrom = formatISO(subDays(baseDate, 365 + d * 10));

    let stat: PrescribedDocument['status'] = 'VALID';
    if (expiryOffset < 0) {
      stat = d % 2 === 0 ? 'EXPIRED' : 'RENEWAL_SUBMITTED';
    } else if (expiryOffset <= 30) {
      stat = 'EXPIRING';
    }

    documents.push({
      id: `DOC-${inst.region.charAt(0)}-${(300 + d).toString()}`,
      institutionId: inst.id,
      institutionName: inst.name,
      region: inst.region,
      type: dtype,
      title: `${dtype.replace('_', ' ')} Statutory Certificate`,
      validFrom,
      validTo,
      fileRef: `${dtype}_${inst.id}_statutory.pdf`,
      fileSize: `${(1.2 + (d % 4) * 0.8).toFixed(1)} MB`,
      status: stat,
      renewalEvidence: stat === 'RENEWAL_SUBMITTED' ? {
        id: `REN-${d}`,
        name: `Renewed_${dtype}_Draft.pdf`,
        url: '/sample_data/renewal.pdf',
        uploadedAt: formatISO(subDays(baseDate, 3)),
        size: '3.2 MB',
        fileType: 'application/pdf',
        status: 'PENDING'
      } : undefined
    });
  }

  // 6. Initial Audit Log
  const initialAudit: AuditEvent[] = [
    createAuditEvent('SYSTEM', 'PLATFORM_DATA_INITIALIZED', { type: 'SYSTEM', id: 'AEGIS-CORE' }, {
      reason: 'AEGIS seed data and cryptographic hash-chain initialized.',
      at: baseIso,
      isAutomated: true
    })
  ];

  return {
    institutions,
    applications,
    evcs,
    undertakings,
    documents,
    initialAudit
  };
}
