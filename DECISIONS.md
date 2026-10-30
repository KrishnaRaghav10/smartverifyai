# AEGIS Prototype Architectural Decisions

### 1. Simulated Clock Architecture
- **Choice:** Centralized in the global Zustand store (`simDate: Date`), initialized to statutory benchmark date **30 Oct 2026**.
- **Rationale:** Section 2 and Section 4 require evaluators to advance time by +1 day, +7 days, +30 days, or jump to a specific date to observe reactive SLA ageing, automated notification dispatch, and escalation ladder transitions without real network latency.
- **Reference:** All SLA, undertaking expiry, EVC scheduling targets, and document validity checks read from `simDate`, never native `Date.now()`.

### 2. Regulatory Safeguards & Separation of Authority
- **Choice:** Hardcoded safeguards preventing any automated final approve/reject actions.
- **Rationale:** Section 1.1 dictates that the system supports the approval process but never replaces statutory decisions of the competent authority. Automated actions are strictly labelled `"System-generated"` and final approvals/rejections require signed human execution with mandatory reasons recorded in the audit trail.
- **UI Affirmation:** Persistent safeguard line on every screen: *"Automated alerts support, but do not replace, statutory scrutiny and decisions of the competent authority."*

### 3. Cryptographic Audit Log
- **Choice:** Hash-chained ledger (`hash = computeHash(prevHash + payload)`) computed on every transition and action.
- **Rationale:** Meets Section 9 requirement for immutable, append-only traceability with short hashes, integrity verification badges, and automated vs official action differentiation.

### 4. 10 Independent Role Shells
- **Choice:** Distinct shell layout, navigation architecture, mood, and signature visual for each of the 10 roles (Institution, Scrutiny Officer, Regional Officer, Bureau Officer, EVC Coordinator, Committee Member, Compliance Officer, Senior Authority, System Admin, Auditor).
- **Rationale:** Strictly enforces Section 6 ("Hard rule: no two roles share the same layout. Each has a different shell, navigation style, home-screen composition and signature visual").

### 5. Indicative APH Default Values
- **Choice:** Clear banner in the System Admin studio highlighting: *"Illustrative defaults; must be aligned to the applicable APH (Approval Process Handbook) before statutory use."*
- **Rationale:** Satisfies the explicit evaluator instruction in Section 16.
