# SmartVerifyAI
### Application Validation & Document Verification System for AICTE
*Smart India Hackathon 2026 · Problem Statement 26261 · Regulation Bureau, AICTE*

> **Tagline:** Check early. Verify at source. Decide with evidence.

---

## 📹 Prototype Demo Video (1m 50s Screen Recording)

A high-definition step-by-step screen recording demonstrating how a first-time user navigates Pramaan from login to final adjudication is included:

- **Interactive Player with Chapters**: [`watch_demo.html`](file:///d:/SIH%202026/watch_demo.html) *(Double-click to open in browser)*
- **Universal MP4 Video (1080p)**: [`Pramaan_Demo_Walkthrough.mp4`](file:///d:/SIH%202026/Pramaan_Demo_Walkthrough.mp4) *(54 MB)*
- **WebM Master Video (1080p)**: [`Pramaan_Demo_Walkthrough.webm`](file:///d:/SIH%202026/Pramaan_Demo_Walkthrough.webm) *(23 MB)*

### Video Chapter Breakdown
1. **0:00 - 0:14** · *Role-Based Government Portal Sign-In (Scrutiny Officer)*
2. **0:14 - 0:34** · *Executive Dashboard: 5 Status States & Prototype Benchmarks*
3. **0:34 - 0:50** · *Central Applications Registry & Discrepancy Filtering*
4. **0:50 - 1:10** · *Application Dossier Deep-Dive & Automated Checklist Selection*
5. **1:10 - 1:26** · *Live Verification at External Issuing Authority Gateways*
6. **1:26 - 1:38** · *Digital Forensics (Duplicate Hashes, ELA) & Campus Norms*
7. **1:38 - 1:47** · *Human-in-the-Loop Adjudication (Officer Action & Remarks)*
8. **1:47 - 1:50** · *Immutable Regulatory Audit Trail & Hindi Localization*

---

## 1. Executive Overview

**SmartVerifyAI** is a regulatory pre-scrutiny web platform engineered to assist AICTE officers in evaluating Extension of Approval (EoA) applications prior to formal committee hearings.

- **AI Assists, Officers Decide**: Automated processing generates forensic flags, checklist states, and confidence scores; human scrutiny officers retain complete adjudication authority.
- **Source Verification**: Automatically checks uploaded documents against issuing authority registries (University Portal, NBA/NAAC, State Land Records, Fire Services).
- **Forensic Anomaly Detection**: Uncovers cross-institutional document duplication (SHA-256), chronological inversions, PDF metadata modification tool fingerprints, and visual tampering via Error Level Analysis (ELA).
- **Government Design System**: Adheres strictly to the light, calm, official aesthetic with a top tricolour strip, no decorative gradients, 1px thin borders, square-ish 4px radius, and full English / Hindi (हिन्दी) bilingual localization.

---

## 2. Quick Start: Two-Command Execution

### Terminal 1: Backend (FastAPI + SQLite + Extraction Engine)
```powershell
cd "d:\SIH 2026\backend"
python -m uvicorn app.main:app --reload --port 8000
```
*API Swagger Documentation accessible at: `http://127.0.0.1:8000/docs`*

### Terminal 2: Frontend (React 18 + Vite + Tailwind CSS)
```powershell
cd "d:\SIH 2026\frontend"
npm.cmd run dev
```
*Open application in browser at: `http://localhost:5173`*

---

## 3. Demo Roles (One-Click Quick Switcher)

Pramaan includes a top-bar role selector with 4 preset accounts:

| Role | Demo User | Responsibility |
|---|---|---|
| **Scrutiny Officer** *(Default)* | Smt. Ananya Sharma | Reviews flags, checks sources, confirms/dismisses findings, requests clarification |
| **Senior Officer** | Shri Rajeshwar Verma | Views executive dashboard, approves final regulatory outcomes, toggles handbook rules |
| **Institution** | Dr. Ramesh Gupta (R.V. Institute) | Submits application dossier, checks deficiencies, uploads corrected filings |
| **Auditor** | Shri K. S. Narayanan | Read-only inspection of immutable regulatory audit ledger and CSV export |

*Default password for all demo accounts:* `pramaan2026`

---

## 4. Planted Seed Applications & 3-Minute Presentation Guide

Pramaan comes pre-seeded with 15 synthetic applications (`APP-2026-001` through `APP-2026-015`) planted to exhibit every regulatory condition:

| Application ID | Category | Planted Regulatory Case | Where to Inspect |
|---|---|---|---|
| `APP-2026-001` | Extension of Approval | Fully Clean Dossier | All 4 documents verified, 0 flags |
| `APP-2026-004` | Extension of Approval | Missing Mandatory Document | Checklist tab highlights missing Fire Safety Certificate |
| `APP-2026-007` | Increase in intake | Expired Accreditation | Checklist & Verification tab show lapsed NBA certificate |
| `APP-2026-009` | Extension of Approval | Name Mismatch with AICTE Record | Flags tab shows 'Pioneer Polytechnic Society' vs official title |
| `APP-2026-012` | Extension of Approval | Duplicate Document across Institutes | Flags tab shows SHA-256 hash match with `INST-01` filing |
| `APP-2026-013` | Extension of Approval | Edited Date & Stamp (Tampering) | Visual ELA tampering differential score & metadata signature |
| `APP-2026-014` | New course | External Source Timeout | Verification tab displays `Source Unavailable` (HTTP 503) |
| `APP-2026-015` | Increase in intake | Deficient Physical Infrastructure | Infrastructure tab flags 2.5 sq.m/student deficit -> *Suggest Inspection* |

---

## 5. 3-Minute SIH Presentation Walkthrough Flow

1. **Dashboard & Alerts (Minute 1)**:
   - Login as **Scrutiny Officer**.
   - Note the 5 summary cards (Total, Clean, Needs Review, Deficient, Verification Pending).
   - Review the **Needs Your Attention** alert drawer and prototype accuracy metrics panel (98.4% extraction accuracy, 1.2s verification time).
2. **Dossier Deep-Dive (Minute 2)**:
   - Click on `APP-2026-004` or `APP-2026-013` from the list.
   - **Checklist Tab**: Point out the live `✔ / ✖ / Expired` badges.
   - **Documents Tab**: View OCR-extracted metadata, reference numbers, and SHA-256 hashes.
   - **Verification Tab**: Click **Re-query Source** to demonstrate live simulated query to state authority gateways.
   - **Flags Tab**: Inspect anomaly evidence with What, Where, Why, Confidence score, and the statutory disclaimer (*"Preliminary indicator. Needs human verification."*).
3. **Adjudication & Audit Trail (Minute 3)**:
   - In the right-side **Officer Action** panel, select **Request Clarification**, type directions, and submit.
   - Switch to the **Audit Trail** screen to prove the action was appended with timestamp, officer name, and role. Click **Export CSV** to download the record.
   - Toggle the header language switch to **हिन्दी** to demonstrate bilingual Devanagari localization.

---

## 6. Automated Test Suite

To run the automated regression test suite covering authentication, API endpoints, mock verification sources, and audit exports:
```powershell
cd "d:\SIH 2026\backend"
python -m pytest tests -v
```
*Current test run:* **8 passed in 3.15s (100% pass rate)**.

---

## 7. Tech Stack & Safeguards

| Component | Technology | Rationale |
|---|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Lucide | Fast, responsive, clean government theme |
| Backend | Python 3.13, FastAPI, Uvicorn | Async performance, robust type validation |
| Persistence | SQLite & SQLAlchemy | Zero external database configuration required |
| PDF & OCR | PyMuPDF (`fitz`), Pillow, OpenCV | High-speed stream extraction & Error Level Analysis (ELA) |
| Security | PBKDF2 HMAC SHA-256, PyJWT | Cryptographic role verification & audit sealing |
| Rules | JSON-based APH 2026-27 config | Configurable without code deployment |

---

*Prototype developed for Smart India Hackathon 2026 · AICTE Regulation Bureau*
