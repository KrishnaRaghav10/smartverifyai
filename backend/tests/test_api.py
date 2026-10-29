import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import AuditLog
from app.services.mock_sources import (
    STATUS_VERIFIED, STATUS_MISMATCH, STATUS_EXPIRED,
    STATUS_PENDING, STATUS_UNAVAILABLE, STATUS_MANUAL_REVIEW
)

client = TestClient(app)

def get_token(username: str, password: str = "demo123") -> str:
    res = client.post("/api/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200, f"Login failed for {username}: {res.text}"
    return res.json()["access_token"]

def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}

# 1. TEST: All Demo Logins and Role-Based Landing Redirects
def test_login_and_redirects():
    test_cases = [
        ("inst01", "Institution", "/institution/home"),
        ("inst02", "Institution", "/institution/home"),
        ("scrutiny01", "Scrutiny Officer", "/scrutiny/queue"),
        ("senior01", "Senior Officer", "/senior/overview"),
        ("auditor01", "Auditor", "/audit/logs")
    ]
    for username, expected_role, expected_redirect in test_cases:
        res = client.post("/api/auth/login", json={"username": username, "password": "demo123"})
        assert res.status_code == 200
        data = res.json()
        assert data["user"]["role"] == expected_role
        assert data["redirect_url"] == expected_redirect
        assert "access_token" in data

# 2. TEST: Institution Data Isolation
def test_institution_data_isolation():
    token_inst1 = get_token("inst01")
    token_inst2 = get_token("inst02")

    # inst01 sees only INST-01
    res1 = client.get("/api/applications", headers=auth_headers(token_inst1))
    assert res1.status_code == 200
    apps1 = res1.json()
    assert len(apps1) > 0
    for a in apps1:
        assert a["institute_id"] == "INST-01"

    # inst02 sees only INST-02
    res2 = client.get("/api/applications", headers=auth_headers(token_inst2))
    assert res2.status_code == 200
    apps2 = res2.json()
    assert len(apps2) > 0
    for a in apps2:
        assert a["institute_id"] == "INST-02"

# 3. TEST: Institution Forbidden from Other Institute's Application (Returns 403)
def test_institution_access_to_other_institute_returns_403():
    token_inst1 = get_token("inst01")
    # APP-2026-002 belongs to INST-02
    res = client.get("/api/applications/APP-2026-002", headers=auth_headers(token_inst1))
    assert res.status_code == 403
    assert "Access Denied" in res.json()["detail"]

# 4. TEST: Institution Cannot See Anomaly / Forgery Flags
def test_institution_cannot_see_flags():
    token_inst1 = get_token("inst01")
    # APP-2026-004 belongs to INST-01 and has flags
    res = client.get("/api/applications/APP-2026-004", headers=auth_headers(token_inst1))
    assert res.status_code == 200
    detail = res.json()
    # Institution MUST NOT see anomaly flags or internal history
    assert detail["flags"] == []
    assert detail["history"] == []
    assert detail["verifications"] == []
    # But DOES see plain deficiencies
    assert "deficiencies" in detail

# 5. TEST: Scrutiny Officer Cannot Make Final Decision (Returns 403)
def test_scrutiny_cannot_make_final_decision():
    token_scrutiny = get_token("scrutiny01")
    res = client.post("/api/applications/APP-2026-001/decision", json={
        "decision": "Approve",
        "reason": "Everything is verified"
    }, headers=auth_headers(token_scrutiny))
    assert res.status_code == 403
    assert "Access Denied" in res.json()["detail"]

# 6. TEST: Senior Officer Can Make Final Decision
def test_senior_can_make_final_decision():
    token_senior = get_token("senior01")
    # Approval
    res_app = client.post("/api/applications/APP-2026-001/decision", json={
        "decision": "Approve",
        "reason": "All statutory documents verified"
    }, headers=auth_headers(token_senior))
    assert res_app.status_code == 200
    assert res_app.json()["final_decision"] == "Approve"

    # Adverse decision requires reason
    res_adv_no_reason = client.post("/api/applications/APP-2026-003/decision", json={
        "decision": "Return for Correction",
        "reason": ""
    }, headers=auth_headers(token_senior))
    assert res_adv_no_reason.status_code == 400

    # Adverse decision with reason succeeds
    res_adv = client.post("/api/applications/APP-2026-003/decision", json={
        "decision": "Return for Correction",
        "reason": "Affiliation letter expired"
    }, headers=auth_headers(token_senior))
    assert res_adv.status_code == 200
    assert res_adv.json()["final_decision"] == "Return for Correction"

# 7. TEST: Scrutiny Cannot Toggle Rules (Returns 403); Senior Can
def test_rules_toggle_permissions():
    token_scrutiny = get_token("scrutiny01")
    token_senior = get_token("senior01")

    rules = client.get("/api/rules", headers=auth_headers(token_senior)).json()
    rule_id = rules[0]["id"]
    initial_state = rules[0]["enabled"]

    # Scrutiny tries -> 403
    res_scrutiny = client.put(f"/api/rules/{rule_id}/toggle", headers=auth_headers(token_scrutiny))
    assert res_scrutiny.status_code == 403

    # Senior tries -> 200
    res_senior = client.put(f"/api/rules/{rule_id}/toggle", headers=auth_headers(token_senior))
    assert res_senior.status_code == 200
    assert res_senior.json()["enabled"] == (not initial_state)

    # Revert
    client.put(f"/api/rules/{rule_id}/toggle", headers=auth_headers(token_senior))

# 8. TEST: Auditor Read-Only (Zero Action Buttons / Forbidden from Writes)
def test_auditor_forbidden_from_actions():
    token_auditor = get_token("auditor01")

    # Auditor cannot verify source
    res_v = client.post("/api/applications/APP-2026-001/verify-source", json={
        "document_id": "DOC-001",
        "status": STATUS_VERIFIED
    }, headers=auth_headers(token_auditor))
    assert res_v.status_code == 403

    # Auditor cannot decide
    res_d = client.post("/api/applications/APP-2026-001/decision", json={
        "decision": "Approve"
    }, headers=auth_headers(token_auditor))
    assert res_d.status_code == 403

    # Auditor cannot toggle rules
    res_r = client.put("/api/rules/RULE-01/toggle", headers=auth_headers(token_auditor))
    assert res_r.status_code == 403

    # Auditor CAN view audit logs & export CSV
    res_logs = client.get("/api/audit-logs", headers=auth_headers(token_auditor))
    assert res_logs.status_code == 200

    res_csv = client.get("/api/audit-logs/export", headers=auth_headers(token_auditor))
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]

# 9. TEST: Access Denied Events Appear in Audit Log
def test_access_denied_logged_in_audit_trail():
    token_inst = get_token("inst01")
    # Trigger 403 by trying to export audit logs
    res = client.get("/api/audit-logs/export", headers=auth_headers(token_inst))
    assert res.status_code == 403

    # Check database audit_logs table
    db = SessionLocal()
    denied_events = db.query(AuditLog).filter(AuditLog.action == "ACCESS_DENIED").all()
    db.close()
    assert len(denied_events) > 0
    assert any("Access Denied" in e.details or "forbidden" in e.details.lower() for e in denied_events)

# 10. TEST: Institution Forbidden from Audit Logs and Rule Edits
def test_institution_forbidden_audit_and_rules():
    token_inst = get_token("inst01")
    res_logs = client.get("/api/audit-logs", headers=auth_headers(token_inst))
    assert res_logs.status_code == 403

    res_rule = client.put("/api/rules/RULE-01/toggle", headers=auth_headers(token_inst))
    assert res_rule.status_code == 403

# 11. TEST: Scrutiny Officer Can Recommend to Senior Officer
def test_scrutiny_recommendation_flow():
    token_scrutiny = get_token("scrutiny01")
    res = client.post("/api/applications/APP-2026-001/recommend", json={
        "recommendation": "Recommend Approval",
        "remarks": "All documents verified at official sources with clean ELA scan."
    }, headers=auth_headers(token_scrutiny))
    assert res.status_code == 200
    assert res.json()["recommendation"] == "Recommend Approval"

# 12. TEST: Institution Can Create Application
def test_institution_create_application():
    token_inst = get_token("inst01")
    res = client.post("/api/applications", json={
        "category": "Extension of Approval",
        "student_count": 500,
        "built_up_area_sqm": 2600.0,
        "labs_count": 10
    }, headers=auth_headers(token_inst))
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert "APP-2026-" in res.json()["application_id"]
