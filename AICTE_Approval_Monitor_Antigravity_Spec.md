# AICTE Approval & Compliance Monitor (working name: **PRAMAAN**)
### Build specification for Google Antigravity: interactive front-end prototype

> **How to use this file:** Give this whole document to the Antigravity agent as the project brief. Build in the phases listed in Section 16. Every section is a requirement unless marked *(optional)*.

---

## 1. Project Summary

Build a **front-end prototype** of an integrated digital platform that automates and monitors AICTE approval workflows and institutional compliance. It covers:

- Application routing through stages (Scrutiny, Re-scrutiny, EVC, SAC/SHC)
- Stage-wise pendency and ageing monitoring
- EVC scheduling and alerts
- Time-bound undertakings
- Lease and document validity
- Automated notifications and escalation
- A complete audit trail

**The prototype is judged on:** workflow accuracy, timeliness of alerts, reliability of deadline tracking, visibility of pending cases, reduction in manual follow-up, and completeness of the audit trail.

**Prototype scope:** no real backend. Use a typed in-browser mock API layer with seeded data and a **simulated clock**, so evaluators can fast-forward time and watch alerts and escalations fire.

### 1.1 Regulatory safeguard (must be visible in the UI)
The system supports the approval process. It **never replaces** statutory scrutiny, verification, inspection or decisions by the competent authority.

- Every automated action is labelled **"System-generated"** and every decision is labelled **"Decision by authorised official."**
- Final approve / reject / grant actions are **never automated**. They are always human clicks with a mandatory reason, recorded in the audit trail.
- A persistent footer line on all screens reads: *"Automated alerts support, but do not replace, statutory scrutiny and decisions of the competent authority."*

---

## 2. Tech Stack

| Concern | Choice |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS with CSS variables for design tokens |
| Components | shadcn/ui primitives, restyled to the design system below |
| Motion | Framer Motion (page transitions, list reorder, number count-ups, layout animations) |
| Charts | Recharts (plus custom SVG for the India map, Gantt and ageing ribbons) |
| State | Zustand (global store, one slice per domain) |
| Routing | React Router v6, role-prefixed routes (`/institution/*`, `/regional/*`, …) |
| Mock data | Seeded generator (`faker` with a fixed seed) plus handwritten "hero" cases |
| Dates | `date-fns`, all time logic reads from the **simulated clock** store, never `Date.now()` |
| Icons | `lucide-react` |
| Fonts | Headings: **Merriweather Sans** or **Poppins**. Body: **Inter**. Numerals: **JetBrains Mono** (tabular) |
| Persistence | `localStorage` with a "Reset demo data" button |

Folder layout:

```
src/
  app/            routes, layouts per role
  roles/          one folder per role, each with its own pages + components
  shared/         design-system components, charts, timeline, audit viewer
  engine/         workflow engine, SLA engine, notification engine, escalation engine
  mock/           seed data, mock API
  store/          zustand slices (clock, applications, evc, undertakings, documents, notifications, audit)
  config/         rules.json (stage maps, SLAs, escalation ladders), roles.json
```

---

## 3. Visual Design System: "Modern Government"

**Intent:** trustworthy and institutional, yet fresh and alive. Think a premium Indian public-service product, not a legacy portal. **Light theme only.**

### 3.1 Colour tokens

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#F7F8FC` | App background (soft cool white) |
| `--surface` | `#FFFFFF` | Cards, panels |
| `--surface-2` | `#EEF1F8` | Subtle fills, table headers |
| `--ink` | `#0F1B3D` | Primary text (deep navy) |
| `--ink-2` | `#5B6785` | Secondary text |
| `--line` | `#E1E6F0` | Borders, dividers |
| `--brand` | `#1F3A8A` | Primary brand (AICTE navy-blue) |
| `--brand-soft` | `#E6ECFF` | Brand tint backgrounds |
| `--saffron` | `#F28C28` | Warm accent, highlights, "due soon" |
| `--green` | `#138808` | Success / compliant (India-green) |
| `--chakra` | `#0A5CD6` | Links, focus rings, info |
| `--warn` | `#E8A100` | Approaching deadline |
| `--danger` | `#D92D20` | Overdue / escalated |
| `--violet` | `#6D4AFF` | EVC / committee accent |

**Signature touch:** a 4px **tricolour hairline** (saffron / white / green) under the top bar on every screen, plus a faint **Ashoka-chakra-style 24-spoke line pattern** at 4% opacity in hero panels and login screens.

### 3.2 Per-role accent (each role feels like its own app)

Each role gets its own **shell layout**, **navigation pattern**, **accent colour** and **hero visual** (see Section 6). The shared tokens above stay constant; only the accent and layout change.

### 3.3 Shape, depth and motion

- Radius: cards `16px`, inputs and buttons `12px`, chips `999px`.
- Shadows: soft layered (`0 1px 2px rgba(15,27,61,.06), 0 8px 24px rgba(15,27,61,.06)`). Hover lifts 2px with a slightly stronger shadow.
- Section headers get a small coloured "tab" marker at the left edge, like a file folder tab.
- **Motion rules:**
  - Page transitions: 180ms fade and 8px slide.
  - Counters count up on load.
  - Charts animate in with a stagger.
  - Status chips pulse softly when `due soon` and shake once when `overdue`.
  - Table rows animate on reorder or filter.
  - Drawers slide in from the right.
  - Respect `prefers-reduced-motion`.
- Empty states have small friendly SVG illustrations plus one clear action.
- Skeleton loaders (shimmer) on every data panel, 400–700ms fake latency.

### 3.4 Status language (consistent everywhere)

| State | Chip colour | Icon |
|---|---|---|
| On track | green | check-circle |
| Due soon | amber, pulsing | clock |
| Overdue | red | alert-triangle |
| Escalated | red with ladder icon | arrow-up-circle |
| Returned / Reverted | saffron | corner-up-left |
| Awaiting institution | blue | hourglass |
| Closed | grey | lock |

### 3.5 Accessibility
WCAG AA contrast, visible focus rings, keyboard navigation for tables, drawers and command palette, ARIA live region for toasts. Bilingual-ready text (English now, wrap strings for Hindi later). Language toggle `EN | हिं` visible, with a handful of key labels translated as proof.

---

## 4. Global Shell Features (shared across roles)

1. **Top bar:** AICTE-style logo placeholder, product name, global search (command palette `⌘K / Ctrl+K`), notification bell with live badge, simulated-clock chip, language toggle, profile menu with **role switcher** (demo only).
2. **Simulated Clock ("Time Machine"):** a floating pill on every screen showing the current simulated date and time.
   - Controls: `+1 day`, `+7 days`, `+30 days`, `Jump to date`, `Reset`.
   - Advancing the clock runs the SLA, notification and escalation engines. Toasts and bell items appear live, and dashboards update with animation.
   - This is the primary tool for demoing timeliness of alerts.
3. **Command palette:** jump to any application by ID, institution or page; run quick actions ("Schedule EVC", "Send reminder").
4. **Notification centre:** drawer with tabs *All / Pending / Upcoming / Overdue / Escalated*, mark-read, and a deep link to the source item.
5. **Audit trail viewer:** reusable drawer (see Section 9), opened from any record via a "History" button.
6. **Role-aware demo banner:** thin strip, "Prototype: simulated data", dismissible.
7. **Footer safeguard line** (Section 1.1).
8. **Toast system** with type icons and an "Undo" for non-statutory actions only.

---

## 5. Domain Model (TypeScript interfaces, abbreviated)

```ts
type Role =
  | 'INSTITUTION' | 'SCRUTINY_OFFICER' | 'REGIONAL_OFFICER'
  | 'BUREAU_OFFICER' | 'EVC_COORDINATOR' | 'COMMITTEE_MEMBER'
  | 'COMPLIANCE_OFFICER' | 'SENIOR_AUTHORITY' | 'SYSTEM_ADMIN' | 'AUDITOR';

type Pathway =
  | 'ONLY_SCRUTINY' | 'SCRUTINY_EVC' | 'EVC_SAC_SHC' | 'ONLY_EVC'
  | 'SCRUTINY_EVC_SAC_SHC';              // combinations are config-driven

type Stage =
  | 'SUBMITTED' | 'SCRUTINY' | 'RE_SCRUTINY' | 'EVC_QUEUE'
  | 'EVC_SCHEDULED' | 'EVC_DONE' | 'SAC_SHC' | 'DECISION' | 'CLOSED';

interface Application {
  id: string; institutionId: string; region: Region; type: 'NEW'|'EXTENSION'|'CLOSURE'|'OTHER';
  pathway: Pathway; currentStage: Stage; stageEnteredAt: ISODate; assignedTo: UserId;
  slaDueAt: ISODate; status: 'ON_TRACK'|'DUE_SOON'|'OVERDUE'|'ESCALATED'|'RETURNED'|'CLOSED';
  returns: ReturnRecord[]; history: AuditEvent[];
}
interface ReturnRecord { by: UserId; at: ISODate; reasonCode: string; remarks: string; resolvedAt?: ISODate }

interface EVC { id: string; applicationId: string; isNewInstitution: boolean;
  queuedAt: ISODate; scheduleTargetBy: ISODate; scheduledFor?: ISODate;
  panel: UserId[]; status: 'QUEUED'|'SCHEDULED'|'COMPLETED'|'DELAYED'; reportDueBy?: ISODate }

interface Undertaking { id: string; applicationId: string; institutionId: string;
  condition: string; dueDate: ISODate; evidence: Evidence[];
  status: 'OPEN'|'SUBMITTED'|'VERIFIED'|'REJECTED_RESUBMIT'|'OVERDUE'|'ESCALATED'|'CLOSED' }

interface PrescribedDocument { id: string; institutionId: string; type: 'LEASE'|'OTHER';
  validFrom: ISODate; validTo: ISODate; fileRef: string;
  status: 'VALID'|'EXPIRING'|'EXPIRED'|'RENEWAL_SUBMITTED'|'RENEWAL_VERIFIED' }

interface Notification { id: string; toRole: Role; toUser?: UserId; kind: 'PENDING'|'UPCOMING'|'OVERDUE'|'ESCALATION';
  entityRef: {type: string; id: string}; message: string; createdAt: ISODate; readAt?: ISODate }

interface AuditEvent { id: string; at: ISODate; actor: UserId|'SYSTEM'; action: string;
  entityRef: {type: string; id: string}; before?: any; after?: any; reason?: string; hash: string }
```

---

## 6. Role-Based Interfaces (each one **visually and structurally distinct**)

> **Hard rule:** no two roles share the same layout. Each has a different shell, navigation style, home-screen composition and signature visual. Shared components (chips, drawers, audit viewer) are reused inside, but the *frame* differs.

### 6.1 Institution Portal ("Institution Console")
**Accent:** Chakra Blue `#0A5CD6`. **Shell:** friendly **top-tab navigation** with a large, centred content column, like a guided service portal.
**Mood:** reassuring and task-oriented. Big cards, plain language, minimal jargon.

**Home: "My Action Centre"**
- Greeting banner with the institution name, AICTE ID and a **Compliance Health Ring** (animated radial gauge, 0–100) showing overall standing.
- **"What needs your attention"** carousel of action cards sorted by urgency (e.g. "Lease expires in 21 days: upload renewal", "Undertaking #3 due in 5 days"), each with a live countdown chip and a primary CTA.
- **My Applications** as a horizontal **stage stepper** per application (pathway-aware: only stages that apply are shown), with a glowing current step.
- **Calendar strip** of upcoming deadlines and an EVC visit date if scheduled.

**Pages**
1. **Applications:** list and detail. The detail page has a vertical timeline of stages, comments or deficiencies raised (if returned), and a "Respond to deficiency" flow.
2. **Respond to deficiency:** guided 3-step wizard (Read observation → Upload documents → Review & submit) with drag-and-drop upload, per-file progress and virus-scan simulation.
3. **Undertakings:** cards with condition text, due date, countdown, status chip and an **evidence uploader**. After submission the status shows "Awaiting AICTE verification" with a progress animation.
4. **Documents & Lease Vault:** grid of document tiles with **validity bars** (green → amber → red as expiry nears). "Upload renewed lease" button, plus an expiry timeline.
5. **Notifications & Messages:** inbox of system and official communications, with reminders clearly marked *System-generated*.
6. **EVC Visit:** shows the scheduled window, the panel (names and roles), a checklist of documents to keep ready, and a "Confirm availability" action.

### 6.2 Scrutiny Officer ("Scrutiny Workbench")
**Accent:** Teal `#0E8F8A`. **Shell:** **left icon rail + split-pane workspace** (queue on the left, application detail on the right), like an email or case-review tool.
**Mood:** dense, efficient, keyboard-friendly.

**Home: "My Queue"**
- Prioritised queue with **ageing heat-strip** per row (a mini bar showing time used vs SLA).
- Filters: pathway, stage, region, due-soon, returned-by-me. Saved views.
- **Split view:** selecting a row opens the case on the right without leaving the page.

**Case pane (tabs):** Summary · Documents (preview pane with checklist ticks) · Checklist (scrutiny parameters, each Pass / Deficient / NA with remarks) · Timeline · History.
**Key actions (all authorised-only, reason required):**
- **Complete scrutiny → auto-advance** to the next stage per pathway (animated "moving to EVC queue" transition and toast).
- **Return / Revert** to institution or to the previous stage: modal with a reason code dropdown, free-text, deficiency list builder, and an auto-generated standard communication preview that the officer can edit before sending.
- **Generate electronic case summary:** auto-drafted from the checklist; officer reviews and approves. Marked as a draft until confirmed.
- Keyboard shortcuts: `J/K` next/prev, `R` return, `C` complete, `/` search.

### 6.3 Regional Officer ("Regional Command View")
**Accent:** Saffron `#F28C28`. **Shell:** **left collapsible sidebar with a region switcher at the top** and a **map-first home**.
**Mood:** oversight and workload management.

**Home: "Region Overview"**
- **India map (SVG) with region heat-shading**, with the officer's region highlighted. Hover shows counts.
- KPI row: Total in region · Due soon · Overdue · EVCs pending scheduling · Undertakings overdue · Expiring leases.
- **Stage funnel** (animated horizontal funnel) with counts per stage and average dwell time.
- **Workload board:** officers as swim-lanes with stacked bars (on-track / due soon / overdue). Drag a case onto another officer to **reassign** (with a reason prompt and audit entry).
- **Bottleneck radar:** a ranked list of "slowest stages" and "longest-pending institutions".

**Pages:** Applications (table with bulk actions: remind, reassign, escalate-request) · EVC Planner (see 6.5 for the shared component, but with a region scope) · Undertakings in region · Document validity in region · Reports.

### 6.4 Bureau Officer ("Bureau Control Room")
**Accent:** Indigo `#4F46E5`. **Shell:** **top bar with mega-menu and a persistent right-side "Alerts rail"** (live feed). Layout is a **multi-widget dashboard grid** the user can rearrange (drag, resize), with the layout saved.
**Mood:** cross-region command centre.

**Home: "National Pulse"**
- Widgets (rearrangeable): Region comparison bar race (animated) · Pendency trend line (last 12 simulated weeks) · Ageing buckets (0–7, 8–15, 16–30, 30+ days) · Escalation ladder status · Top 10 overdue institutions · EVC timeliness by region · Undertaking compliance rate by region · Document-expiry funnel.
- **Compare Regions** mode: pick two or more regions and see side-by-side sparklines.
- **Drill-down:** clicking any chart segment opens a side drawer with the underlying applications, and the filter chips are preserved in the URL.

**Pages:** All Applications (advanced filter builder) · Performance (Region-wise processing scorecards) · Escalations received · Reports builder (pick metrics → preview → export CSV/PDF simulated).

### 6.5 EVC Coordinator ("EVC Scheduler")
**Accent:** Violet `#6D4AFF`. **Shell:** **full-width calendar and timeline workspace** with a collapsible left filter panel. No sidebar nav; use a **segmented control** at the top (Queue · Calendar · Panels · Reports).
**Mood:** logistics and scheduling.

**Home: "EVC Queue & Calendar"**
- **Queue lane** (applications ready for EVC after preliminary processing, auto-placed by the engine) with badges: *New institution* (prioritised), days in queue, target-schedule-by countdown.
- **Calendar (month / week / agenda)** showing scheduled EVCs. **Drag a queue card onto a date** to open the scheduling dialog (date range, panel selection, conflict detection: expert double-booking, same-district clash).
- **Panel builder:** expert pool with availability dots, past-visit count and a conflict-of-interest flag (rule-based demo). Drag experts into a panel.
- **Timeline (Gantt):** queued → scheduled → visit → report due, with delay segments in red.
- **Delay alerts:** a banner strip listing EVCs past their scheduling target, with an **"Escalate to designated authority"** button (confirm modal, audit-logged).

### 6.6 Committee Member ("Committee Desk": SAC / SHC / EVC member)
**Accent:** Plum `#8E3B8E`. **Shell:** **calm, document-centric reading layout**: narrow left list of "Meetings & Agenda items", wide central reading pane, right-side "My notes & observations" panel. Minimal chrome.
**Mood:** focused, deliberative.

**Home: "My Agenda"**
- Upcoming meeting or visit cards with a countdown.
- Agenda items per meeting: application dossier (summary, scrutiny outcome, EVC report, flags).
- **Observation editor** (rich-text) with structured fields (Recommendation: *Recommend / Recommend with conditions / Do not recommend*, rationale required).
- **Conditions builder:** if "with conditions", add time-bound undertakings (condition text + due date). These flow into the Undertakings module as *proposed*, pending the competent authority's confirmation.
- Clear banner: *"Your recommendation is advisory; the final decision rests with the competent authority."*

### 6.7 Compliance Officer ("Compliance Tracker")
**Accent:** Emerald `#0F9D58`. **Shell:** **kanban-first layout with a top tab switch (Undertakings | Documents | Escalations)** and a right-hand evidence preview drawer.
**Mood:** verification and follow-up.

**Home: "Compliance Board"**
- **Kanban columns:** Open → Due Soon → Submitted (awaiting verification) → Verified → Overdue → Escalated. Cards drag between allowed columns only (invalid moves bounce back with a tooltip explaining why).
- Card shows institution, condition, due date, countdown, evidence count.
- **Verification drawer:** side-by-side evidence viewer and checklist; actions *Verify / Reject & request resubmission / Mark insufficient*, with mandatory remarks.
- **Lease & Document Radar:** a radial or timeline view of all institutions' documents by days-to-expiry (0–30 / 31–60 / 61–90 / 90+), with advance-alert settings visible (e.g. alert at 90/60/30/7 days: configurable).
- **Bulk reminder** sender with a templated preview (**System-generated** tag) and a "scheduled send" option.

### 6.8 Senior Authority ("Executive Overview": Chairman / Member Secretary / Advisor level)
**Accent:** Deep Navy `#1F3A8A` with gold highlights `#C9A227`. **Shell:** **minimal, presentation-style, full-bleed**: a top-level "Briefing" page with large type, no dense tables. Navigation is a **bottom dock** (Briefing · Escalations · Regions · Decisions · Reports).
**Mood:** calm authority, at-a-glance.

**Home: "Today's Briefing"**
- A hero strip with 4 big KPIs (animated counters): Applications in process · Overdue · Escalated to me · Compliance rate.
- **Escalation inbox** (only items that crossed the top of the ladder), each as a large card: the issue in one line, days overdue, the history trail summary, and **"Direct action"** (Assign · Request report · Acknowledge · Close with remarks).
- **"Decisions awaiting competent authority"** shelf, linking to dossiers. Actions here are human-only, with a mandatory reason.
- **Region league table** with trend arrows.
- **Export a briefing note** (auto-drafted summary, marked as a draft).

### 6.9 System Admin ("Rules & Configuration Studio")
**Accent:** Slate `#475569` with a cyan highlight `#06B6D4`. **Shell:** **left nav with a "settings"-style tree plus a form/preview split view** (config on the left, live preview on the right).
**Mood:** configurator and safe-edit tooling.

**Home: "Configuration Studio"**
1. **Workflow Designer:** visual node graph of pathways (Only Scrutiny / Scrutiny + EVC / EVC + SAC/SHC / Only EVC / custom). Drag stages to reorder and set allowed transitions. A "Test with sample application" button animates a dummy application through the graph.
2. **SLA & Timeline Rules:** table of stage × SLA days (editable inputs, *illustrative defaults; must be aligned to the applicable APH before use*), with "due-soon threshold" sliders.
3. **Escalation Ladders:** a drag-and-drop ladder builder (Level 1 → Level N, with role, wait time and channel), per rule type (application, EVC, undertaking, document).
4. **Notification Templates:** editor with placeholders `{institution}`, `{dueDate}`, `{applicationId}`, plus a live preview and channel toggles (in-app, email, SMS: simulated).
5. **Document Types & Validity Rules:** define prescribed documents, validity, and advance-alert offsets (90/60/30/7).
6. **Users & Roles:** list, role assignment, region mapping, and a permission matrix (grid of checkboxes).
7. **Integrations (mock):** cards for "Existing AICTE systems" (status: *Connected (simulated)*), a sample API contract viewer, and a sync log.
8. **Config versioning:** every rule change creates a version with a diff view and an audit entry. A "Publish" step requires a confirmation and a reason.

### 6.10 Auditor ("Audit & Transparency Lens")
**Accent:** Charcoal `#1E293B` with amber `#F59E0B` highlight. **Shell:** **read-only, table-and-timeline-centric layout** with a prominent search bar and a **"READ-ONLY" ribbon** on every page.
**Mood:** forensic clarity.

**Home: "Audit Explorer"**
- Global event search (actor, action, entity, date range) with facet filters.
- **Case Reconstruction view:** pick an application and replay its entire life as an animated vertical timeline: every move, return, alert, escalation, verification, with actor and reason. A scrubber lets the user "play" the history.
- **Integrity indicator:** each event shows a short hash and a "chain verified ✓" badge (hash-chained, simulated).
- **Evidence of automation vs human action** donut: share of System-generated vs official actions.
- Export audit extract (simulated).

---

## 7. Workflow Engine (functional requirements)

Implement as a pure TypeScript module (`engine/workflow.ts`) driven by `config/rules.json`.

1. **Pathway resolution:** on submission, determine the pathway from application type and attributes via configurable rules; store `pathway` and the ordered stage list.
2. **Auto-advance:** when an authorised user marks a stage complete, the engine moves the application to the next stage in the pathway, resets the stage clock, recalculates `slaDueAt`, assigns the next owner (round-robin or least-loaded within the region/committee), writes an audit event, and emits notifications.
3. **Auto-queueing for EVC:** after preliminary processing (Scrutiny done, where the pathway includes it), place the application in the EVC queue with `scheduleTargetBy`. New institutions are flagged for priority.
4. **Return / Revert:** allowed only for authorised roles. Requires a reason code and remarks. It moves the application to `RETURNED` (to the institution) or back to the previous stage, pauses or resumes the SLA clock per config (clearly shown), and records everything.
5. **Guards:** illegal transitions are rejected with an explanatory message. Final decision transitions require a human actor with a decision-authority permission and a reason, and the engine never auto-fires them.
6. **Ageing & SLA:** `age = now(simClock) − stageEnteredAt`. Status derived: `ON_TRACK` < due-soon threshold ≤ `DUE_SOON` < `slaDueAt` ≤ `OVERDUE`.
7. **Workload distribution:** the engine exposes per-officer counts and average age for dashboards.

## 8. Alerts, Notifications & Escalation Engine

Run on every simulated-clock tick (and on state changes).

| Trigger | Notification | Recipient |
|---|---|---|
| Application age crosses the due-soon threshold | `UPCOMING` | Assigned officer |
| Application passes SLA | `OVERDUE` | Assigned officer and Regional Officer |
| EVC not scheduled by `scheduleTargetBy − X` | `UPCOMING` | EVC Coordinator |
| EVC past `scheduleTargetBy` | `OVERDUE` then escalate | EVC Coordinator → designated authority |
| Undertaking due in 30 / 15 / 7 / 1 days | `UPCOMING` | Institution |
| Undertaking past due | `OVERDUE` | Institution and Compliance Officer |
| Undertaking unfulfilled beyond the grace period | `ESCALATION` | Regional Officer → Bureau → Senior Authority (ladder) |
| Document expiry in 90 / 60 / 30 / 7 days | `UPCOMING` | Institution |
| Document expired, no renewal | `OVERDUE` then escalate | Institution, Compliance Officer, ladder |
| Renewal submitted | `PENDING` | Compliance Officer |

- **Escalation ladders** come from config. Each level has a wait time. If the item is still unresolved when the wait elapses, the engine notifies the next level and logs `ESCALATED`.
- Notifications are de-duplicated (one per trigger per entity per level).
- Every notification and escalation produces an audit event with actor `SYSTEM`.
- Closing the underlying item automatically resolves its open alerts.

## 9. Audit Trail (completeness is a scoring criterion)

- Every state change, view of a sensitive document *(optional)*, notification, submission, verification, return, escalation, config change and login/role-switch writes an `AuditEvent`.
- Events are **hash-chained** (`hash = sha(prevHash + payload)`) and displayed with an integrity tick.
- **Audit drawer** (available on every record): vertical timeline, filter by actor / action type, show *Before → After* diffs, and display "System-generated" vs "Official action" tags.
- Audit events are append-only; the UI offers no edit or delete.

## 10. Seed Data (make the demo rich)

- **5 Regions** (e.g. Northern, Southern, Eastern, Western, Central: use placeholder names or actual AICTE region naming) × ~6 institutions each = ~30 institutions with realistic made-up names. Use **clearly fictional names**; do not use real institutions.
- **~120 applications** distributed across pathways and stages, with ageing distributed so every status appears in numbers (roughly 55% on track, 25% due soon, 15% overdue, 5% escalated).
- **~25 EVCs** across queued / scheduled / completed / delayed, including 4 new-institution EVCs past target.
- **~40 undertakings** across all statuses, and **~50 prescribed documents** with expiry spread from −30 to +180 days from the simulated "today" (**30 Oct 2026**).
- **Hero scenarios** (handwritten, used in the guided demo):
  1. *Aarohan Institute of Technology*: lease expires in 21 days → alerts at 30 and 7 days → expiry → escalation.
  2. *Meridian College of Engineering*: new-institution EVC queued, drifting past target → escalation to the designated authority.
  3. *Vikram Sarabhai-style fictional: "Orion Polytechnic"*: an application returned for deficiencies, institution responds, it re-enters Scrutiny and advances to EVC.
  4. *Kaveri School of Management*: undertaking submitted, rejected for insufficient evidence, resubmitted, verified, closed.
- 10+ named demo users, at least one per role, including a quick "Login as…" picker on the landing screen.

## 11. Demo Mode & Guided Tour

- **Landing screen:** hero with the tricolour hairline, product name, a short value statement, and **role cards** (one per role, each in its own accent colour with an icon and one-line description). Clicking a card logs in as that role's demo user with an animated transition into that role's own shell.
- **"Guided Demo" button:** a 6-step coach-mark tour running the hero scenarios (use a lightweight tour library or custom spotlight).
  1. Institution sees the lease expiry alert. 2. Advance the clock +60 days. 3. Compliance Officer sees the overdue alert. 4. Escalation lands with the Regional Officer and Senior Authority. 5. Auditor replays the whole trail. 6. Summary screen with "What was automated vs what stayed human".
- **Scenario triggers** in a hidden dev panel (`Ctrl+Shift+D`): "Create new application", "Force overdue", "Simulate institution upload".

## 12. Interaction Catalogue (the "cool but purposeful" list)

Implement at least these:

- Count-up KPIs and radial gauges with easing
- Animated stage steppers with a travelling glow along the connector
- Drag-and-drop: reassign officers (Regional), schedule EVC (Coordinator), kanban moves (Compliance), layout widgets (Bureau), ladder building (Admin)
- Hover-to-reveal row actions, plus expandable rows with inline mini-timelines
- India region map with animated heat transitions
- Gantt with zoom (day / week / month)
- Case "replay" scrubber (Auditor)
- Skeleton shimmer, optimistic UI with undo toasts (non-statutory actions)
- Command palette with fuzzy search across applications, institutions and pages
- Confetti-lite micro-celebration (small, tasteful green check burst) when a compliance item is verified and closed
- Live clock-driven updates: advancing time makes chips change colour, counters tick and bell notifications drop in one by one

## 13. Cross-Cutting Requirements

- **Role-based access:** route guards per role; navigating to another role's URL shows a polished "Not authorised for your role" page (not a blank screen).
- **Data confidentiality cues:** masked fields (e.g. partial phone numbers), "Confidential" tags on sensitive documents, and a watermark overlay containing the user ID in the document preview.
- **Document storage (simulated):** file picker, type and size validation, upload progress, preview (PDF / image placeholder), version history per document.
- **Responsiveness:** desktop-first (≥1280px), usable on tablet; the Institution Portal must also work on mobile.
- **Performance:** lists virtualised above 200 rows; charts memoised.
- **Error and empty states** designed for every list.
- **Print styles** for the electronic case summary and the briefing note.

## 14. Screen Inventory (checklist)

| Role | Required screens |
|---|---|
| Landing | Role picker, guided demo entry |
| Institution | Home, Applications list/detail, Deficiency wizard, Undertakings, Document Vault, Notifications, EVC visit |
| Scrutiny Officer | Queue + split-pane case workbench, Return modal, Case summary |
| Regional Officer | Region overview (map), Workload board, Applications, Region EVC planner, Undertakings, Documents, Reports |
| Bureau Officer | National Pulse (grid), Compare Regions, All applications, Performance, Escalations, Report builder |
| EVC Coordinator | Queue, Calendar, Panel builder, Gantt, Delay alerts |
| Committee Member | Agenda, Dossier reader, Observation and conditions editor |
| Compliance Officer | Kanban board, Verification drawer, Document radar, Bulk reminders |
| Senior Authority | Briefing, Escalation inbox, Decisions shelf, Region league, Briefing export |
| System Admin | Workflow designer, SLA rules, Escalation ladders, Templates, Document rules, Users and permissions, Integrations, Versioning |
| Auditor | Audit explorer, Case replay, Integrity and automation analytics |
| Shared | Notification drawer, Audit drawer, Command palette, Time Machine, 403 page |

## 15. Acceptance Criteria (map to the evaluation criteria)

1. **Workflow accuracy:** each pathway moves only through its configured stages in order; an illegal transition is blocked with a clear message; returned cases resume correctly.
2. **Timeliness of alerts:** advancing the simulated clock across a threshold produces the expected notification within the same tick, to the correct recipients, exactly once.
3. **Deadline reliability:** the due-soon / overdue status of every item matches `slaDueAt` versus the simulated clock; changing the SLA config recalculates statuses.
4. **Visibility of pending cases:** any pending application can be found within 2 clicks from any dashboard, through drill-down or the command palette.
5. **Reduced manual follow-up:** bulk reminders, auto-queueing, auto-advance and auto-escalation are demonstrably automatic, and each is tagged *System-generated*.
6. **Audit completeness:** every action in the demo script appears in the Auditor's replay with actor, time, reason and an integrity tick.
7. **Role distinctness:** a reviewer can identify the role from the screen alone, without reading labels (different layout, navigation, accent and hero visual).
8. **Safeguard:** no final decision ever happens without a human click and a reason.

## 16. Build Plan for the Antigravity Agent

Work in these phases. After each phase, run the app and verify in the browser before moving on.

1. **Foundation:** scaffold Vite + React + TS + Tailwind; implement the design tokens, tricolour hairline, base components (Card, Chip, Button, Drawer, Table, Stepper, Gauge), the global shell pieces and the **Time Machine**.
2. **Data and engines:** types, seed generator, hero scenarios, workflow, SLA, notification and escalation engines, hash-chained audit log, Zustand slices. Write unit tests for the engines (pathway routing, SLA status, escalation de-duplication).
3. **Landing and routing:** landing screen with role cards, role guards, the ten distinct shells (empty pages with the correct layouts first).
4. **Roles, in this order:** Institution → Scrutiny → Compliance → EVC Coordinator → Regional → Bureau → Senior Authority → Committee → Admin → Auditor.
5. **Polish:** motion pass, empty/error/loading states, accessibility check, keyboard shortcuts, print styles, the guided demo tour.
6. **Verification:** have the agent run through the guided demo end-to-end in the browser, capture screenshots per role, fix visual or logic defects, and confirm every acceptance criterion in Section 15.


### Instruction to the agent about assumptions
- SLA days, grace periods and escalation waits in `rules.json` are **illustrative placeholders**. Show an info badge in the Admin studio: *"Align with the applicable APH before use."* Do not present them as official AICTE values.
- Use fictional institution and officer names throughout. Do not use real AICTE logos; use a neutral placeholder emblem.
- Where this spec is silent, choose the simplest option that satisfies the acceptance criteria and note the choice in `DECISIONS.md`.

---
*End of specification.*
