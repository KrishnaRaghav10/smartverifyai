# FIX: Role-Based Interfaces for Pramaan

## The Bug

All four roles land on the **same dashboard** after login and see the same menu, buttons and data.

This is wrong. In a regulatory system, each role has a different job and different authority.

## What To Do

Build **four separate interfaces**, one per role. After login, redirect the user to their own home page. Each role sees only the screens, data and buttons that belong to them.

**Enforce this in two places:**
1. **Frontend:** hide menus and buttons the role should not have.
2. **Backend:** reject forbidden API calls with `403`. Hiding a button is not security.

---

## Login Redirect

| Role | Lands on |
|---|---|
| Institution | `/institution/home` |
| Scrutiny Officer | `/scrutiny/queue` |
| Senior Officer | `/senior/overview` |
| Auditor | `/audit/logs` |

- Typing another role's URL shows an "Access Denied" page, not a crash.
- Logout returns to login.
- Show **role name + user name** in the header on every page.

---

## 1. Institution Interface
*"Submit and fix."*

**Menu:** My Applications · New Application · Deficiencies · Messages

**Home page**
- Status tracker for each application: *Submitted → Under Scrutiny → Clarification Needed → Decided*
- Count cards: Open Applications, Deficiencies to Fix, Messages

**Can do**
- Create and submit an application
- Upload or replace documents
- See the checklist for their category
- See deficiencies in plain words (missing, expired, mismatch)
- Reply to clarification requests

**Cannot do**
- See other institutes' data
- See anomaly or forgery flags
- See officer remarks or internal notes
- See the audit log or rules
- Make or see any decision draft

**Look:** simple, form-like, large buttons, step-by-step.

---

## 2. Scrutiny Officer Interface
*"Review and recommend."*

**Menu:** My Queue · All Applications · Alerts · My Activity

**Home page**
- Work queue: applications assigned to this officer
- Filters: priority, category, pending verification
- Alert panel: expiring documents, pending source checks, new flags

**Can do**
- Open full application detail (all tabs)
- Run or re-run source verification
- Review flags: **Accept** or **Dismiss** (with a reason)
- Request clarification from the institution
- Add internal remarks
- Send a case to Senior Officer with a recommendation

**Cannot do**
- Give final approval or rejection
- Change rules or checklists
- Reassign cases
- Delete or edit audit entries
- See cases not assigned to them (unless escalated)

**Look:** dense table + split view (document on left, extracted fields and flags on right).

---

## 3. Senior Officer Interface
*"Oversee and decide."*

**Menu:** Overview · Escalated Cases · Decisions · Assign · Rules · Reports

**Home page**
- Count cards: Total, Clean, Needs Review, Deficient, Pending
- Bar chart: deficiencies by type
- Table: cases awaiting decision
- Metrics: average verification time, flags per 100 applications

**Can do**
- See all applications
- Take the final decision: **Approve · Return for Correction · Recommend Rejection**
- Reassign cases between Scrutiny Officers
- Turn rules on/off (with handbook reference shown)
- Download summary reports

**Rules**
- Any adverse decision requires a written reason and shows a confirmation step
- Show the officer's recommendation and evidence before the decision buttons

**Cannot do**
- Upload or edit institution documents
- Edit or delete audit entries

**Look:** summary-first, charts and counts, decision panel pinned at the right.

---

## 4. Auditor Interface
*"Observe and report. Read-only."*

**Menu:** Audit Log · Applications (view) · Rule History · Export

**Home page**
- Searchable audit table: time, user, role, action, application, details
- Filters: user, role, action type, date range

**Can do**
- View audit log, applications and rule changes
- Export logs to CSV

**Cannot do**
- Anything that changes data. **No action buttons anywhere.**
- Upload, verify, decide, assign, or edit rules

**Look:** plain, table-heavy, a "Read-only access" tag in the header.

---

## Permission Matrix

| Action | Inst. | Scrutiny | Senior | Auditor |
|---|:-:|:-:|:-:|:-:|
| Submit / upload documents | ✔ | – | – | – |
| View own applications | ✔ | – | – | – |
| View assigned applications | – | ✔ | ✔ | view |
| View all applications | – | – | ✔ | view |
| See anomaly flags | – | ✔ | ✔ | view |
| Run source verification | – | ✔ | ✔ | – |
| Accept / dismiss flags | – | ✔ | ✔ | – |
| Request clarification | – | ✔ | ✔ | – |
| Final decision | – | – | ✔ | – |
| Reassign cases | – | – | ✔ | – |
| Edit rules | – | – | ✔ | – |
| View audit log | – | own only | ✔ | ✔ |
| Export audit CSV | – | – | ✔ | ✔ |

---

## Visual Differences (keep the same light theme)

- Same navy + saffron theme, same fonts.
- Each role gets a **different sidebar menu** and a **role badge** in the header.
- Thin top strip colour per role:
  - Institution: green
  - Scrutiny: navy
  - Senior: saffron
  - Auditor: grey
- No shared "one size fits all" dashboard.

---

## Demo Logins

| Role | Username | Password |
|---|---|---|
| Institution | `inst01` | `demo123` |
| Scrutiny Officer | `scrutiny01` | `demo123` |
| Senior Officer | `senior01` | `demo123` |
| Auditor | `auditor01` | `demo123` |

Seed at least **2 institutions** so the data-isolation rule can be shown.

---

## Audit Rule

Every role-specific action is logged: who, role, action, time, application.
Forbidden attempts (403) are also logged as "Access Denied".

---

## Test Checklist (fix is done only when all pass)

- [ ] Each role lands on a different home page
- [ ] Each role has a different sidebar menu
- [ ] Institution sees only its own applications
- [ ] Institution does not see anomaly flags
- [ ] Scrutiny Officer cannot open a decision button
- [ ] Senior Officer can approve / return / recommend rejection
- [ ] Auditor sees zero action buttons
- [ ] Calling a forbidden API directly returns `403`
- [ ] Opening another role's URL shows Access Denied
- [ ] Access Denied attempts appear in the audit log
