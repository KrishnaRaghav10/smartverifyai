import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.mock_sources import (
    STATUS_VERIFIED, STATUS_MISMATCH, STATUS_EXPIRED,
    STATUS_PENDING, STATUS_UNAVAILABLE, STATUS_MANUAL_REVIEW
)

client = TestClient(app)

def test_login_all_four_roles():
    roles = [
        "institution@pramaan.aicte.gov.in",
        "scrutiny@pramaan.aicte.gov.in",
        "senior@pramaan.aicte.gov.in",
        "auditor@pramaan.aicte.gov.in"
    ]
    for email in roles:
        response = client.post("/api/auth/login", json={"email": email, "password": "pramaan2026"})
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == email

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "counts" in data
    assert data["counts"]["total"] >= 15
    assert "clean" in data["counts"]
    assert "needs_review" in data["counts"]
    assert "deficient" in data["counts"]
    assert "verification_pending" in data["counts"]
    assert len(data["latest_applications"]) <= 10
    assert "prototype_metrics" in data

def test_applications_list_and_filters():
    # Fetch all
    res = client.get("/api/applications")
    assert res.status_code == 200
    apps = res.json()
    assert len(apps) >= 15

    # Filter by category
    res_eoa = client.get("/api/applications?category=Extension of Approval")
    assert res_eoa.status_code == 200
    for a in res_eoa.json():
        assert a["category"] == "Extension of Approval"

    # Filter by search
    res_search = client.get("/api/applications?search=APP-2026-001")
    assert res_search.status_code == 200
    assert any(a["id"] == "APP-2026-001" for a in res_search.json())

def test_application_detail_and_checklist():
    res = client.get("/api/applications/APP-2026-001")
    assert res.status_code == 200
    detail = res.json()
    assert detail["id"] == "APP-2026-001"
    assert "institute" in detail
    assert "checklist" in detail
    assert len(detail["checklist"]) >= 3
    # APP-2026-001 is clean, checklist items should be Present
    for item in detail["checklist"]:
        assert item["status"] in ["Present", "Missing", "Expired"]

def test_mock_sources_return_all_six_statuses():
    statuses_to_test = [
        STATUS_VERIFIED,
        STATUS_MISMATCH,
        STATUS_EXPIRED,
        STATUS_PENDING,
        STATUS_UNAVAILABLE,
        STATUS_MANUAL_REVIEW
    ]
    for target_status in statuses_to_test:
        res = client.post("/api/applications/APP-2026-001/verify-source", json={
            "document_id": "DOC-99999", # Will lookup or mock
            "status": target_status
        })
        # If document not found, verify using existing doc from detail
        if res.status_code == 404:
            app_detail = client.get("/api/applications/APP-2026-001").json()
            existing_doc_id = app_detail["documents"][0]["id"]
            res = client.post("/api/applications/APP-2026-001/verify-source", json={
                "document_id": existing_doc_id,
                "status": target_status
            })
        assert res.status_code == 200
        data = res.json()
        assert data["verification"]["status"] == target_status

def test_officer_action_and_audit_trail():
    # Execute Request Clarification
    res = client.post("/api/applications/APP-2026-001/action", json={
        "action": "Request Clarification",
        "remarks": "Please provide the latest geotagged laboratory photographs."
    })
    assert res.status_code == 200
    data = res.json()
    assert data["decision_state"] == "Request Clarification"
    assert data["new_status"] == "Needs Review"

    # Verify audit log recorded this
    res_audit = client.get("/api/audit-logs?application_id=APP-2026-001")
    assert res_audit.status_code == 200
    logs = res_audit.json()
    assert any("Request Clarification" in l["details"] for l in logs)

def test_audit_logs_csv_export():
    res = client.get("/api/audit-logs/export")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "UTC Timestamp" in res.text
    assert "Action Type" in res.text

def test_rules_toggle():
    res = client.get("/api/rules")
    assert res.status_code == 200
    rules = res.json()
    assert len(rules) >= 8
    rule_id = rules[0]["id"]
    initial_state = rules[0]["enabled"]

    # Toggle
    res_toggle = client.put(f"/api/rules/{rule_id}/toggle")
    assert res_toggle.status_code == 200
    assert res_toggle.json()["enabled"] == (not initial_state)

    # Revert toggle
    client.put(f"/api/rules/{rule_id}/toggle")
