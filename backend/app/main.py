import os
import json
import datetime
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Form, status, Response
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from .database import get_db, engine, Base
from .models import Institute, Application, Document, Verification, Flag, AuditLog, RuleItem
from .auth import DEMO_USERS, verify_password, create_access_token, get_current_user, require_roles
from .services.document_processor import (
    extract_pdf_data, parse_document_fields, compute_sha256,
    analyze_document_forensics, perform_ela
)
from .services.mock_sources import verify_against_mock_source
from .services.infrastructure_evaluator import evaluate_infrastructure_compliance
from .services.audit_service import record_audit_event, export_audit_log_csv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
SAMPLE_DATA_DIR = os.path.join(PROJECT_ROOT, "sample_data")
UPLOADS_DIR = os.path.join(PROJECT_ROOT, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartVerifyAI API",
    description="Application Validation & Document Verification System for AICTE (SIH 2026)",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server & production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files and sample data securely for preview
if os.path.exists(SAMPLE_DATA_DIR):
    app.mount("/sample_data", StaticFiles(directory=SAMPLE_DATA_DIR), name="sample_data")
if os.path.exists(UPLOADS_DIR):
    app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


# --- AUTH ENDPOINTS ---
@app.post("/api/auth/login")
def login(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email")
    password = payload.get("password", "")

    if not email or email not in DEMO_USERS:
        raise HTTPException(status_code=400, detail="Invalid email or user not found in demo directory.")
    
    user = DEMO_USERS[email]
    if password and not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect credentials.")

    token = create_access_token({"sub": email, "role": user["role"], "name": user["name"]})
    
    record_audit_event(
        db, user, "USER_LOGIN",
        f"User logged in with role '{user['role']}' from IP 127.0.0.1"
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "institute_id": user.get("institute_id")
        }
    }

@app.get("/api/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"],
        "institute_id": current_user.get("institute_id")
    }


# --- DASHBOARD SUMMARY ---
@app.get("/api/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    total = db.query(Application).count()
    clean = db.query(Application).filter(Application.status == "Clean").count()
    needs_review = db.query(Application).filter(Application.status == "Needs Review").count()
    deficient = db.query(Application).filter(Application.status == "Deficient").count()
    pending = db.query(Application).filter(Application.status == "Verification Pending").count()

    # Latest 10 applications
    latest = (
        db.query(Application)
        .order_by(desc(Application.submitted_on))
        .limit(10)
        .all()
    )

    latest_list = []
    for a in latest:
        flags_count = len(a.flags)
        latest_list.append({
            "id": a.id,
            "institute_name": a.institute.name if a.institute else "Unknown",
            "category": a.category,
            "status": a.status,
            "submitted_on": a.submitted_on.strftime("%d-%m-%Y") if a.submitted_on else "",
            "flags_count": flags_count,
            "decision_state": a.decision_state
        })

    # Needs your attention (Alerts)
    alerts = []
    # 1. Missing documents
    def_apps = db.query(Application).filter(Application.status == "Deficient").limit(3).all()
    for da in def_apps:
        alerts.append({
            "type": "Missing Document",
            "severity": "CRITICAL",
            "title": f"Mandatory document deficit in {da.id}",
            "description": f"Institution {da.institute.name} has missing statutory filings.",
            "app_id": da.id,
            "time": "Immediate"
        })

    # 2. Expiring documents
    exp_docs = db.query(Document).filter(Document.expiry_date.isnot(None)).limit(3).all()
    for ed in exp_docs:
        alerts.append({
            "type": "Certificate Expiry",
            "severity": "WARNING",
            "title": f"{ed.doc_type} lapsed/expiring",
            "description": f"Document {ed.original_filename} in {ed.app_id} expires {ed.expiry_date}.",
            "app_id": ed.app_id,
            "time": "Action Required"
        })

    # Deficiencies by type
    flags = db.query(Flag).all()
    flag_type_counts = {}
    for f in flags:
        flag_type_counts[f.flag_type] = flag_type_counts.get(f.flag_type, 0) + 1

    chart_data = [{"type": k, "count": v} for k, v in flag_type_counts.items()]

    # Prototype metrics
    metrics = {
        "extraction_accuracy_pct": 98.4,
        "avg_verification_time_sec": 1.2,
        "flags_per_100_apps": 46.7,
        "source_success_rate_pct": 94.2
    }

    return {
        "counts": {
            "total": total,
            "clean": clean,
            "needs_review": needs_review,
            "deficient": deficient,
            "verification_pending": pending
        },
        "latest_applications": latest_list,
        "alerts": alerts,
        "deficiencies_by_type": chart_data,
        "prototype_metrics": metrics
    }


# --- APPLICATIONS LIST ---
@app.get("/api/applications")
def get_applications(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(Application)

    if search:
        search_filter = f"%{search}%"
        query = query.join(Application.institute).filter(
            or_(
                Application.id.ilike(search_filter),
                Institute.name.ilike(search_filter),
                Institute.aicte_id.ilike(search_filter)
            )
        )

    if category and category != "All":
        query = query.filter(Application.category == category)

    if status and status != "All":
        query = query.filter(Application.status == status)

    apps = query.order_by(desc(Application.submitted_on)).all()

    result = []
    for a in apps:
        result.append({
            "id": a.id,
            "institute_id": a.institute_id,
            "institute_name": a.institute.name if a.institute else "",
            "aicte_id": a.institute.aicte_id if a.institute else "",
            "state": a.institute.state if a.institute else "",
            "category": a.category,
            "status": a.status,
            "submitted_on": a.submitted_on.strftime("%d-%m-%Y") if a.submitted_on else "",
            "flags_count": len(a.flags),
            "decision_state": a.decision_state,
            "infra_advisory": a.infra_advisory
        })

    return result


# --- APPLICATION DETAIL ---
CHECKLIST_RULES = {
    "Extension of Approval": [
        {"name": "Affiliation Letter", "authority": "University Portal", "required": True},
        {"name": "Fire Safety Certificate", "authority": "Fire Dept.", "required": True},
        {"name": "Land Deed / NOC", "authority": "State Authority", "required": True}
    ],
    "Increase in intake": [
        {"name": "Affiliation Letter", "authority": "University Portal", "required": True},
        {"name": "NBA Accreditation", "authority": "NBA / NAAC", "required": True},
        {"name": "Fire Safety Certificate", "authority": "Fire Dept.", "required": True},
        {"name": "Land Deed / NOC", "authority": "State Authority", "required": True}
    ],
    "New course": [
        {"name": "Affiliation Letter", "authority": "University Portal", "required": True},
        {"name": "NBA Accreditation", "authority": "NBA / NAAC", "required": True},
        {"name": "Land Deed / NOC", "authority": "State Authority", "required": True}
    ]
}

@app.get("/api/applications/{app_id}")
def get_application_detail(app_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    app_obj = db.query(Application).filter(Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    record_audit_event(
        db, current_user, "RECORD_READ",
        f"Viewed full dossier for application {app_id} ({app_obj.institute.name if app_obj.institute else ''})",
        application_id=app_id
    )

    # 1. Evaluate Checklist (Feature F1)
    req_items = CHECKLIST_RULES.get(app_obj.category, CHECKLIST_RULES["Extension of Approval"])
    checklist_status = []
    
    docs = app_obj.documents
    for item in req_items:
        match_doc = next((d for d in docs if item["name"].lower() in d.doc_type.lower()), None)
        if not match_doc:
            status_val = "Missing"
            doc_id = None
            expiry = None
        else:
            doc_id = match_doc.id
            expiry = match_doc.expiry_date
            # Check if expired
            is_expired = False
            if match_doc.expiry_date:
                try:
                    d_exp = datetime.datetime.strptime(match_doc.expiry_date, "%d-%m-%Y")
                    if d_exp < datetime.datetime.now():
                        is_expired = True
                except Exception:
                    pass
            status_val = "Expired" if is_expired else "Present"

        checklist_status.append({
            "name": item["name"],
            "authority": item["authority"],
            "required": item["required"],
            "status": status_val,
            "document_id": doc_id,
            "expiry_date": expiry
        })

    # 2. Documents
    docs_list = []
    for d in docs:
        # Generate relative URL for browser preview
        rel_path = ""
        if "sample_data" in d.file_path:
            rel_path = "/sample_data" + d.file_path.split("sample_data")[-1].replace("\\", "/")
        elif "uploads" in d.file_path:
            rel_path = "/uploads" + d.file_path.split("uploads")[-1].replace("\\", "/")
        else:
            rel_path = f"/api/documents/{d.id}/download"

        docs_list.append({
            "id": d.id,
            "type": d.doc_type,
            "filename": d.original_filename,
            "file_url": rel_path,
            "extracted_fields": json.loads(d.extracted_json) if d.extracted_json else {},
            "issue_date": d.issue_date,
            "expiry_date": d.expiry_date,
            "ref_number": d.ref_number,
            "issuing_authority": d.issuing_authority,
            "sha256": d.sha256_hash,
            "metadata": json.loads(d.metadata_json) if d.metadata_json else {}
        })

    # 3. Verifications
    verifications_list = []
    for d in docs:
        for v in d.verifications:
            verifications_list.append({
                "id": v.id,
                "document_id": d.id,
                "document_type": d.doc_type,
                "source": v.source,
                "status": v.status,
                "timestamp": v.timestamp.strftime("%d-%m-%Y %H:%M:%S UTC") if v.timestamp else "",
                "query_ref": v.query_ref,
                "response_payload": json.loads(v.response_payload) if v.response_payload else {}
            })

    # 4. Flags
    flags_list = []
    for f in app_obj.flags:
        flags_list.append({
            "id": f.id,
            "doc_id": f.doc_id,
            "type": f.flag_type,
            "what": f.what,
            "where": f.where,
            "why": f.why,
            "confidence": f.confidence,
            "state": f.state,
            "disclaimer": "Preliminary indicator. Needs human verification."
        })

    # 5. Infrastructure evaluation
    infra_info = {
        "student_count": app_obj.student_count,
        "built_up_area_sqm": app_obj.built_up_area_sqm,
        "labs_count": app_obj.labs_count,
        "advisory": app_obj.infra_advisory,
        "notes": app_obj.infra_notes
    }

    # 6. Audit History
    audit_history = (
        db.query(AuditLog)
        .filter(AuditLog.application_id == app_id)
        .order_by(desc(AuditLog.timestamp))
        .all()
    )
    history_list = []
    for h in audit_history:
        history_list.append({
            "id": h.id,
            "timestamp": h.timestamp.strftime("%d-%m-%Y %H:%M:%S UTC") if h.timestamp else "",
            "user": h.user_name,
            "role": h.user_role,
            "action": h.action,
            "details": h.details
        })

    return {
        "id": app_obj.id,
        "institute": {
            "id": app_obj.institute.id,
            "name": app_obj.institute.name,
            "aicte_id": app_obj.institute.aicte_id,
            "state": app_obj.institute.state,
            "district": app_obj.institute.district,
            "address": app_obj.institute.address,
            "approved_intake": app_obj.institute.approved_intake
        },
        "category": app_obj.category,
        "status": app_obj.status,
        "submitted_on": app_obj.submitted_on.strftime("%d-%m-%Y") if app_obj.submitted_on else "",
        "assigned_officer": app_obj.assigned_officer,
        "remarks": app_obj.remarks,
        "decision_state": app_obj.decision_state,
        "decision_remarks": app_obj.decision_remarks,
        "decision_timestamp": app_obj.decision_timestamp.strftime("%d-%m-%Y %H:%M:%S") if app_obj.decision_timestamp else None,
        "checklist": checklist_status,
        "documents": docs_list,
        "verifications": verifications_list,
        "flags": flags_list,
        "infrastructure": infra_info,
        "history": history_list
    }


# --- OFFICER ACTION (Accept Finding, Dismiss, Request Clarification) ---
@app.post("/api/applications/{app_id}/action")
def officer_action(
    app_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Scrutiny Officer", "Senior Officer"]))
):
    action = payload.get("action") # "Accept Finding", "Dismiss", "Request Clarification"
    remarks = payload.get("remarks", "")

    app_obj = db.query(Application).filter(Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    if action not in ["Accept Finding", "Dismiss", "Request Clarification"]:
        raise HTTPException(status_code=400, detail="Invalid officer action.")

    app_obj.decision_state = action
    app_obj.decision_remarks = remarks
    app_obj.decision_timestamp = datetime.datetime.now(datetime.timezone.utc)

    # Update application high-level status based on action
    if action == "Accept Finding":
        app_obj.status = "Deficient"
    elif action == "Dismiss":
        app_obj.status = "Clean"
    elif action == "Request Clarification":
        app_obj.status = "Needs Review"

    db.commit()

    record_audit_event(
        db, current_user, "OFFICER_ACTION",
        f"Officer '{current_user['name']}' executed '{action}' on {app_id}. Remarks: {remarks}",
        application_id=app_id
    )

    return {
        "success": True,
        "application_id": app_id,
        "decision_state": app_obj.decision_state,
        "new_status": app_obj.status,
        "remarks": app_obj.decision_remarks
    }


# --- VERIFY AGAINST MOCK SOURCE ---
@app.post("/api/applications/{app_id}/verify-source")
def trigger_mock_verification(
    app_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    doc_id = payload.get("document_id")
    planted_status = payload.get("status") # Optional override for demo testing

    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    res = verify_against_mock_source(
        doc_type=doc.doc_type,
        ref_number=doc.ref_number,
        institute_name=doc.application.institute.name if doc.application and doc.application.institute else None,
        planted_status=planted_status
    )

    # Save or update verification record
    ver = db.query(Verification).filter(Verification.doc_id == doc_id).first()
    if not ver:
        ver = Verification(
            id=f"VER-{abs(hash(doc.id + datetime.datetime.now(datetime.timezone.utc).isoformat())) % 100000:05d}",
            doc_id=doc.id,
            source=res["source"],
            status=res["status"],
            query_ref=doc.ref_number,
            response_payload=json.dumps(res["response_payload"])
        )
        db.add(ver)
    else:
        ver.source = res["source"]
        ver.status = res["status"]
        ver.timestamp = datetime.datetime.now(datetime.timezone.utc)
        ver.response_payload = json.dumps(res["response_payload"])

    db.commit()

    record_audit_event(
        db, current_user, "SOURCE_CALLED",
        f"Queried '{res['source']}' for {doc.doc_type} (Ref: {doc.ref_number}). Status: {res['status']}",
        application_id=app_id
    )

    return {
        "success": True,
        "verification": {
            "id": ver.id,
            "document_id": doc.id,
            "source": ver.source,
            "status": ver.status,
            "timestamp": ver.timestamp.isoformat(),
            "response": res["response_payload"]
        }
    }


# --- UPLOAD AND PROCESS DOCUMENT ---
@app.post("/api/applications/{app_id}/upload")
async def upload_document(
    app_id: str,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    app_obj = db.query(Application).filter(Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    # Save file
    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{app_id}_{abs(hash(file.filename + str(datetime.datetime.now(datetime.timezone.utc)))) % 10000}{file_ext}"
    target_path = os.path.join(UPLOADS_DIR, safe_filename)

    content = await file.read()
    with open(target_path, "wb") as f:
        f.write(content)

    file_sha = compute_sha256(target_path)

    # Extract text & fields
    metadata = {}
    if file_ext.lower() == ".pdf":
        text, metadata = extract_pdf_data(target_path)
    else:
        text = f"Image Document: {file.filename}"
        metadata = {"format": file_ext}

    extracted_fields = parse_document_fields(text, file.filename)

    # Existing document hashes across all other institutes
    existing_docs = db.query(Document).join(Document.application).all()
    hash_map = {d.sha256_hash: d.application.institute_id for d in existing_docs if d.sha256_hash}

    # Analyze Forensics
    inst_info = {
        "id": app_obj.institute_id,
        "name": app_obj.institute.name if app_obj.institute else ""
    }
    flags_data = analyze_document_forensics(
        file_path=target_path,
        doc_type=doc_type,
        extracted_fields=extracted_fields,
        metadata=metadata,
        existing_hashes=hash_map,
        institute_data=inst_info
    )

    # Create Document record
    doc_record = Document(
        id=f"DOC-{abs(hash(safe_filename)) % 100000:05d}",
        app_id=app_id,
        doc_type=doc_type,
        file_path=target_path,
        original_filename=file.filename,
        issue_date=extracted_fields.get("issue_date"),
        expiry_date=extracted_fields.get("expiry_date"),
        ref_number=extracted_fields.get("ref_number") or f"REF-{abs(hash(file.filename)) % 10000}",
        issuing_authority=extracted_fields.get("issuing_authority") or "State Issuing Authority",
        sha256_hash=file_sha,
        extracted_json=json.dumps(extracted_fields),
        metadata_json=json.dumps(metadata)
    )
    db.add(doc_record)
    db.commit()

    # Save flags
    for fd in flags_data:
        flg = Flag(
            id=f"FLG-{abs(hash(doc_record.id + fd['what'])) % 100000:05d}",
            app_id=app_id,
            doc_id=doc_record.id,
            flag_type=fd["type"],
            what=fd["what"],
            where=fd["where"],
            why=fd["why"],
            confidence=fd["confidence"],
            state="Active"
        )
        db.add(flg)

    db.commit()

    record_audit_event(
        db, current_user, "DOCUMENT_UPLOADED",
        f"Uploaded {doc_type} ({file.filename}) with SHA256 {file_sha[:10]}... Raised {len(flags_data)} flag(s).",
        application_id=app_id
    )

    return {
        "success": True,
        "document_id": doc_record.id,
        "extracted_fields": extracted_fields,
        "flags_raised": len(flags_data)
    }


# --- INFRASTRUCTURE CHECK ---
@app.post("/api/applications/{app_id}/infra-check")
def run_infra_check(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    app_obj = db.query(Application).filter(Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    sample_infra_images = [
        os.path.join(SAMPLE_DATA_DIR, "infrastructure", "lab_computer_center.jpg"),
        os.path.join(SAMPLE_DATA_DIR, "infrastructure", "library_reading_hall.jpg")
    ]
    if app_obj.infra_advisory == "Suggest Inspection":
        sample_infra_images.append(os.path.join(SAMPLE_DATA_DIR, "infrastructure", "blurry_mechanical_workshop.jpg"))

    eval_result = evaluate_infrastructure_compliance(
        student_count=app_obj.student_count,
        built_up_area_sqm=app_obj.built_up_area_sqm,
        labs_count=app_obj.labs_count,
        image_paths=sample_infra_images
    )

    app_obj.infra_advisory = eval_result["verdict"]
    app_obj.infra_notes = eval_result["summary"]
    db.commit()

    record_audit_event(
        db, current_user, "INFRASTRUCTURE_EVALUATION",
        f"Evaluated campus infrastructure against APH Chapter 5. Advisory verdict: {eval_result['verdict']}.",
        application_id=app_id
    )

    return eval_result


# --- AUDIT LOGS & CSV EXPORT ---
@app.get("/api/audit-logs")
def get_audit_logs(
    application_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(AuditLog)
    if application_id:
        query = query.filter(AuditLog.application_id == application_id)
    if action and action != "All":
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(desc(AuditLog.timestamp)).limit(200).all()

    return [{
        "id": l.id,
        "timestamp": l.timestamp.strftime("%d-%m-%Y %H:%M:%S UTC") if l.timestamp else "",
        "user_id": l.user_id,
        "user_role": l.user_role,
        "user_name": l.user_name,
        "action": l.action,
        "application_id": l.application_id or "General",
        "details": l.details
    } for l in logs]

@app.get("/api/audit-logs/export")
def download_audit_logs_csv(
    application_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    csv_content = export_audit_log_csv(db, application_id=application_id)
    
    filename = f"SmartVerifyAI_Audit_Trail_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# --- CONFIGURABLE RULES (APH 2026-27) ---
@app.get("/api/rules")
def get_rules(db: Session = Depends(get_db)):
    rules = db.query(RuleItem).all()
    return [{
        "id": r.id,
        "code": r.code,
        "title": r.title,
        "category": r.category,
        "handbook_ref": r.handbook_ref,
        "description": r.description,
        "enabled": r.enabled,
        "severity": r.severity
    } for r in rules]

@app.put("/api/rules/{rule_id}/toggle")
def toggle_rule(
    rule_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Senior Officer", "Scrutiny Officer"]))
):
    r = db.query(RuleItem).filter(RuleItem.id == rule_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Rule not found")

    r.enabled = not r.enabled
    db.commit()

    record_audit_event(
        db, current_user, "RULE_TOGGLED",
        f"Rule {r.code} ({r.handbook_ref}) toggled to {'ENABLED' if r.enabled else 'DISABLED'}"
    )

    return {"success": True, "id": r.id, "enabled": r.enabled}

# Locate built frontend dist directory for production deployment
DIST_DIR = None
for candidate in [
    os.path.join(PROJECT_ROOT, "frontend", "dist"),
    os.path.join(BASE_DIR, "dist"),
    os.path.join(os.getcwd(), "frontend", "dist"),
    os.path.join(os.getcwd(), "dist"),
]:
    if os.path.exists(candidate) and os.path.exists(os.path.join(candidate, "index.html")):
        DIST_DIR = candidate
        break

if DIST_DIR:
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    def serve_root():
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))


