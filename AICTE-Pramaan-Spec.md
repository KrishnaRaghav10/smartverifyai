# PRAMAAN
### Application Validation & Document Verification System for AICTE
*Smart India Hackathon 2026 · Problem Statement 26261 · Regulation Bureau, AICTE*

> **Tagline:** Check early. Verify at source. Decide with evidence.

---

## 1. Build Brief (for Antigravity)

Build a **working web prototype** named **Pramaan**.
It helps AICTE officers pre-check Extension of Approval (EoA) applications before scrutiny.

- AI **assists**. Officers **decide**.
- All data is **synthetic**. All issuing-authority sources are **mocked**.
- Keep the interface plain, readable and form-like, as on a government portal.

---

## 2. Users

| Role | What they do |
|---|---|
| Institution | Submits application, fixes deficiencies |
| Scrutiny Officer | Reviews flags, confirms or dismisses |
| Senior Officer | Views dashboard, takes the final call |
| Auditor | Read-only access to logs |

Login is role-based. Use a demo login with four preset users.

---

## 3. Look & Feel

**Theme:** light, official, calm.

| Item | Choice |
|---|---|
| Background | White `#FFFFFF`, panels `#F6F8FB` |
| Primary | Navy `#1B3A6B` |
| Accent | Saffron `#E8890C` (buttons, highlights only) |
| Success | Green `#1E7B34` |
| Warning / Error | Amber `#B7791F` / Red `#B3261E` |
| Font | Noto Sans (English), Noto Sans Devanagari (Hindi) |
| Corners | Square-ish, 4px radius |
| Shadows | None. Use thin 1px grey borders |

**Layout rules**
- Thin tricolour strip at the very top of the page.
- Header: logo placeholder, "Pramaan", and an **EN | हिं** toggle.
- Left sidebar with five links. No icons-only menus.
- Breadcrumbs on every inner page.
- Footer: "Prototype for SIH 2026. Not an official AICTE system."
- No gradients, no animations, no emojis, no chat-style UI.
- Status shown as a **coloured tag with text**, never colour alone.

---

## 4. Screens

1. **Login**
2. **Dashboard**
3. **Applications List**
4. **Application Detail** (the main screen)
5. **Audit Log**

### 4.1 Dashboard
- Five count cards: Total, Clean, Needs Review, Deficient, Verification Pending
- Table: latest 10 applications
- Panel: "Needs your attention" (alerts)
- Bar chart: deficiencies by type

### 4.2 Applications List
- Search by institute name or ID
- Filters: category, status, date
- Columns: App ID, Institute, Category, Submitted On, Status, Flags

### 4.3 Application Detail
Tabbed layout:

| Tab | Shows |
|---|---|
| Summary | Institute info, category, overall status, officer remarks box |
| Checklist | Required documents with ✔ / ✖ / Expired |
| Documents | Uploaded files, preview, extracted fields |
| Verification | Source checks with status, time, source name |
| Flags | Anomalies with evidence and reason |
| Infrastructure | Photos / plans with advisory notes |
| History | Actions on this application |

Right-side panel: **Officer Action** → *Accept Finding · Dismiss · Request Clarification*.

---

## 5. Features

### F1. Checklist Selection
- Detects application category
- Loads the matching checklist from a JSON file
- Marks each item: Present, Missing, Expired

### F2. Document Reading
- Upload PDF or image
- OCR extracts text
- Classifies document type
- Pulls key fields (name, number, dates, issuer)

### F3. Record Matching
- Compares extracted values with AICTE records
- Checks across documents too
- Flags differences in name, ID, date, intake

### F4. Anomaly Flags
Each flag has: **What · Where · Why · Confidence**

| Check | How |
|---|---|
| Duplicate document | Image/text hash match |
| Date irregularity | Issue date after expiry, future dates |
| Metadata mismatch | PDF creation vs. edit date, software used |
| Identifier mismatch | Same number, different institute |
| Visual edit hint | Error-level analysis on images |

Label shown on every flag: *"Preliminary indicator. Needs human verification."*

### F5. Source Verification (Mocked)
| Document | Mock Source |
|---|---|
| Affiliation letter | University portal |
| Accreditation | NBA / NAAC |
| Land / NOC | State authority |
| Fire safety | Fire dept. |

Supported by QR scan and reference number lookup.

**Status values (use exactly these):**
`Verified` · `Mismatch Detected` · `Expired` · `Verification Pending` · `Source Unavailable` · `Manual Review Required`

Every result stores: source, timestamp, response.

### F6. Infrastructure Check
- Upload photos and floor plans
- Compare against rule values (e.g. area per student, labs count)
- Basic image checks: blur, duplicate photo, wrong category
- Output is **advisory**: *Sufficient · Needs More Evidence · Suggest Inspection*

### F7. Alerts
- Missing document
- Expiring within 30 days
- Verification pending over 3 days
- New anomaly flag

Shown on dashboard and as a bell list. No emails needed.

### F8. Audit Trail
Logs every: rule applied, record read, source called, flag raised, officer action.
Fields: time, user, action, application, details.
Cannot be edited or deleted. Exportable as CSV.

### F9. Configurable Rules
- Rules sit in `rules/*.json`
- Admin page lists rules and allows toggle on/off
- Each rule shows its handbook reference (e.g. "APH 2026-27, Ch. 3")

---

## 6. Safeguards (show on a visible "About this tool" page)

- AI output is advice only
- No adverse action without officer sign-off
- Role-based access
- Uploaded files stored encrypted
- Every access is logged
- Only authorised sources used; none bypassed
- Retention: demo data auto-clears after 30 days

---

## 7. Tech Stack

| Layer | Use |
|---|---|
| Frontend | React + Vite, plain CSS or Tailwind |
| Backend | Python FastAPI |
| Database | SQLite |
| OCR | Tesseract (`pytesseract`) |
| PDF | PyMuPDF |
| Images | OpenCV, Pillow |
| QR | `pyzbar` |
| Auth | Simple JWT, four demo roles |

Run with two commands: one for backend, one for frontend. Include a `README.md`.

---

## 8. Data Model (short)

- `institutes` — id, name, state, aicte_id
- `applications` — id, institute_id, category, status, submitted_on
- `documents` — id, app_id, type, file, extracted_json, expiry
- `verifications` — id, doc_id, source, status, timestamp, response
- `flags` — id, doc_id, type, reason, evidence, confidence, state
- `audit_log` — id, time, user, action, details

---

## 9. Seed Data

Create **15 synthetic applications** across 3 categories:
1. Extension of Approval (continuing)
2. Increase in intake
3. New course

Plant these on purpose so the demo shows every state:

| Case | Planted issue |
|---|---|
| 3 | Fully clean |
| 3 | Missing document |
| 2 | Expired accreditation |
| 2 | Name mismatch with AICTE record |
| 2 | Duplicate document across institutes |
| 1 | Edited date on scanned letter |
| 1 | Source unavailable |
| 1 | Infrastructure photos insufficient |

Add 6 sample PDFs and 4 sample images in `/sample_data`.

---

## 10. Demo Flow (3 minutes)

1. Login as Scrutiny Officer
2. Dashboard shows alerts
3. Open an application with issues
4. Checklist shows one missing and one expired item
5. Open a document and view extracted fields
6. Verification tab runs mock source check → *Mismatch Detected*
7. Flags tab shows a duplicate with evidence
8. Officer clicks **Request Clarification**
9. Audit Log shows all steps

---

## 11. Measures to Display

A small "Prototype Metrics" panel on the dashboard:
- Extraction accuracy (on sample set)
- Average verification time
- Flags per 100 applications
- Source check success rate

---

## 12. Done When

- [ ] Login works for all four roles
- [ ] Upload → OCR → fields appear
- [ ] Checklist updates automatically
- [ ] At least 4 mock sources return all six statuses
- [ ] Flags show evidence and reason
- [ ] Officer action is saved and logged
- [ ] Audit log exports to CSV
- [ ] Hindi toggle works on main labels
- [ ] Works on a laptop screen; readable on tablet

---

## 13. Out of Scope

Real AICTE or DigiLocker connections · Final approval or rejection · Payments · Mobile app · Real inspection scheduling

---

## 14. Future Path (one slide)

Connect to AICTE portal APIs · Add DigiLocker / NAD / state registries · Train models on real scanned documents · Add field inspection app

---

*Pramaan · Prototype · Smart India Hackathon 2026*
