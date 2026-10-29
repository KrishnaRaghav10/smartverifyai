import os
import json
import datetime
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Form, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from .database import get_db, engine, Base
from .models import Institute, Application, Document, Verification, Flag, AuditLog, RuleItem
from .auth import (
    DEMO_USERS, verify_password, create_access_token, get_current_user,
    require_roles, ROLE_HOME_PATHS
)
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
    description="Role-Based Application Validation & Document Verification System for AICTE (SIH 2026)",
    version="2.0.0"
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
    user_identifier = payload.get("username") or payload.get("email")
    password = payload.get("password", "")

    if not user_identifier or user_identifier not in DEMO_USERS:
        raise HTTPException(status_code=400, detail="Invalid username or user not found in demo directory.")
    
    user = DEMO_USERS[user_identifier]
    if password and not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect credentials.")

    token = create_access_token({"sub": user["username"], "role": user["role"], "name": user["name"]})
    redirect_url = ROLE_HOME_PATHS.get(user["role"], "/institution/home")

    record_audit_event(
        db, user, "USER_LOGIN",
        f"User '{user['name']}' logged in with role '{user['role']}' from IP 127.0.0.1"
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "redirect_url": redirect_url,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "institute_id": user.get("institute_id"),
            "redirect_url": redirect_url
        }
    }

@app.get("/api/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user.get("username", current_user["id"]),
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"],
        "institute_id": current_user.get("institute_id"),
        "redirect_url": ROLE_HOME_PATHS.get(current_user["role"], "/institution/home")
    }


# --- DASHBOARD SUMMARY ---
@app.get("/api/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_role = current_user["role"]

    # Role-based query scope
    if user_role == "Institution":
        inst_id = current_user.get("institute_id")
        apps_query = db.query(Application).filter(Application.institute_id == inst_id)
        total = apps_query.count()
        clean = apps_query.filter(Application.status == "Clean").count()
        needs_review = apps_query.filter(Application.status.in_(["Needs Review", "Clarification Needed"])).count()
        deficient = apps_query.filter(Application.status == "Deficient").count()
        pending = apps_query.filter(Application.status == "Verification Pending").count()
        
        # Deficiencies count
        inst_apps = apps_query.all()
        deficiencies_count = 0
        messages_count = 0
        for a in inst_apps:
            if a.clarification_requested and not a.clarification_reply:
                messages_count += 1
            if a.status in ["Deficient", "Needs Review", "Clarification Needed"]:
                deficiencies_count += 1

        return {
            "role": "Institution",
            "counts": {
                "total": total,
                "clean": clean,
                "needs_review": needs_review,
                "deficient": deficient,
                "verification_pending": pending,
                "deficiencies_to_fix": deficiencies_count,
                "messages_count": messages_count
            },
            "open_applications": total,
            "deficiencies_to_fix": deficiencies_count,
            "messages_count": messages_count
        }

    # Regulatory officers and auditors view global stats
    total = db.query(Application).count()
    clean = db.query(Application).filter(Application.status == "Clean").count()
    needs_review = db.query(Application).filter(Application.status == "Needs Review").count()
    deficient = db.query(Application).filter(Application.status == "Deficient").count()
    pending = db.query(Application).filter(Application.status == "Verification Pending").count()

    latest = db.query(Application).order_by(desc(Application.submitted_on)).limit(10).all()
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
            "decision_state": a.decision_state,
            "assigned_officer": a.assigned_officer,
            "scrutiny_recommendation": a.scrutiny_recommendation,
            "final_decision": a.final_decision
        })

    alerts = []
    def_apps = db.query(Application).filter(Application.status == "Deficient").limit(5).all()
    for da in def_apps:
        alerts.append({
            "type": "Missing Document",
            "severity": "CRITICAL",
            "title": f"Mandatory document deficit in {da.id}",
            "description": f"Institution {da.institute.name if da.institute else ''} has missing statutory filings.",
            "app_id": da.id,
            "time": "Immediate"
        })

    exp_docs = db.query(Document).filter(Document.expiry_date.isnot(None)).limit(5).all()
    for ed in exp_docs:
        alerts.append({
            "type": "Certificate Expiry",
            "severity": "WARNING",
            "title": f"{ed.doc_type} lapsed/expiring",
            "description": f"Document {ed.original_filename} in {ed.app_id} expires {ed.expiry_date}.",
            "app_id": ed.app_id,
            "time": "Action Required"
        })

    flags = db.query(Flag).all()
    flag_type_counts = {}
    for f in flags:
        flag_type_counts[f.flag_type] = flag_type_counts.get(f.flag_type, 0) + 1

    chart_data = [{"type": k, "count": v} for k, v in flag_type_counts.items()]

    metrics = {
        "extraction_accuracy_pct": 98.4,
        "avg_verification_time_sec": 1.2,
        "flags_per_100_apps": 46.7,
        "source_success_rate_pct": 94.2
    }

    return {
        "role": user_role,
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
    assigned_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(Application)

    # STRICT DATA ISOLATION: Institution sees ONLY its own applications
    if current_user["role"] == "Institution":
        inst_id = current_user.get("institute_id")
        query = query.filter(Application.institute_id == inst_id)
    elif current_user["role"] == "Scrutiny Officer" and assigned_to == "me":
        query = query.filter(Application.assigned_officer.ilike(f"%{current_user['name']}%"))

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
    is_inst = current_user["role"] == "Institution"
    for a in apps:
        item = {
            "id": a.id,
            "institute_id": a.institute_id,
            "institute_name": a.institute.name if a.institute else "",
            "aicte_id": a.institute.aicte_id if a.institute else "",
            "state": a.institute.state if a.institute else "",
            "category": a.category,
            "status": a.status,
            "submitted_on": a.submitted_on.strftime("%d-%m-%Y") if a.submitted_on else "",
            "flags_count": 0 if is_inst else len(a.flags), # Institution cannot see anomaly flags
            "decision_state": a.decision_state,
            "infra_advisory": a.infra_advisory,
            "assigned_officer": a.assigned_officer,
            "scrutiny_recommendation": None if is_inst else a.scrutiny_recommendation,
            "final_decision": a.final_decision,
            "clarification_requested": a.clarification_requested,
            "clarification_message": a.clarification_message if a.clarification_requested else None,
            "clarification_reply": a.clarification_reply
        }
        result.append(item)

    return result


# --- CREATE APPLICATION (INSTITUTION ONLY) ---
@app.post("/api/applications")
def create_application(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Institution"]))
):
    inst_id = current_user.get("institute_id")
    if not inst_id:
        raise HTTPException(status_code=400, detail="User does not have an associated institute.")

    category = payload.get("category", "Extension of Approval")
    student_count = int(payload.get("student_count", 480))
    built_up_area_sqm = float(payload.get("built_up_area_sqm", 2500.0))
    labs_count = int(payload.get("labs_count", 8))

    # Generate new Application ID
    app_count = db.query(Application).count() + 1
    new_id = f"APP-2026-{app_count:03d}"

    new_app = Application(
        id=new_id,
        institute_id=inst_id,
        category=category,
        status="Under Scrutiny",
        submitted_on=datetime.datetime.now(datetime.timezone.utc),
        assigned_officer="Smt. Ananya Sharma",
        student_count=student_count,
        built_up_area_sqm=built_up_area_sqm,
        labs_count=labs_count,
        infra_advisory="Sufficient",
        decision_state="Pending"
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    record_audit_event(
        db, current_user, "APPLICATION_CREATED",
        f"Institution created and submitted new application {new_id} ({category})",
        application_id=new_id
    )

    return {
        "success": True,
        "application_id": new_id,
        "category": category,
        "status": new_app.status
    }


# --- CHECKLIST RULES ---
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


# --- APPLICATION DETAIL ---
@app.get("/api/applications/{app_id}")
def get_application_detail(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    app_obj = db.query(Application).filter(Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    user_role = current_user["role"]

    # STRICT ISOLATION: Institution can ONLY view their own application
    if user_role == "Institution":
        if app_obj.institute_id != current_user.get("institute_id"):
            record_audit_event(
                db, current_user, "ACCESS_DENIED",
                f"Institution user '{current_user['name']}' attempted unauthorized read of foreign application {app_id}",
                application_id=app_id
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You are not authorized to view applications belonging to other institutions."
            )

    record_audit_event(
        db, current_user, "RECORD_READ",
        f"Viewed application {app_id} ({app_obj.institute.name if app_obj.institute else ''}) with role {user_role}",
        application_id=app_id
    )

    # 1. Evaluate Checklist (Feature F1)
    req_items = CHECKLIST_RULES.get(app_obj.category, CHECKLIST_RULES["Extension of Approval"])
    checklist_status = []
    plain_deficiencies = []
    
    docs = app_obj.documents
    for item in req_items:
        match_doc = next((d for d in docs if item["name"].lower() in d.doc_type.lower()), None)
        if not match_doc:
            status_val = "Missing"
            doc_id = None
            expiry = None
            plain_deficiencies.append({
                "type": "Missing Document",
                "item": item["name"],
                "description": f"Mandatory document '{item['name']}' has not been uploaded.",
                "action_needed": "Upload the valid statutory document."
            })
        else:
            doc_id = match_doc.id
            expiry = match_doc.expiry_date
            is_expired = False
            if match_doc.expiry_date:
                try:
                    d_exp = datetime.datetime.strptime(match_doc.expiry_date, "%d-%m-%Y")
                    if d_exp < datetime.datetime.now():
                        is_expired = True
                except Exception:
                    pass
            if is_expired:
                status_val = "Expired"
                plain_deficiencies.append({
                    "type": "Expired Document",
                    "item": item["name"],
                    "description": f"Uploaded '{item['name']}' expired on {expiry}.",
                    "action_needed": "Upload an renewed / valid certificate."
                })
            else:
                status_val = "Present"

        checklist_status.append({
            "name": item["name"],
            "authority": item["authority"],
            "required": item["required"],
            "status": status_val,
            "document_id": doc_id,
            "expiry_date": expiry
        })

    # Infrastructure shortfall deficiency in plain words for institution
    if app_obj.built_up_area_sqm < 2000.0:
        plain_deficiencies.append({
            "type": "Area Shortfall",
            "item": "Campus Built-up Area",
            "description": f"Declared built-up area ({app_obj.built_up_area_sqm} sqm) is below APH threshold (2000 sqm).",
            "action_needed": "Submit land expansion approval or revised layout."
        })

    # 2. Documents
    docs_list = []
    for d in docs:
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
            "metadata": json.loads(d.metadata_json) if (d.metadata_json and user_role != "Institution") else {}
        })

    # 3. Source Verifications (HIDDEN from Institution)
    verifications_list = []
    if user_role != "Institution":
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

    # 4. Anomaly / Forgery Flags (STRICTLY HIDDEN from Institution)
    flags_list = []
    if user_role != "Institution":
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
        "notes": None if user_role == "Institution" else app_obj.infra_notes
    }

    # 6. Audit History (HIDDEN from Institution)
    history_list = []
    if user_role != "Institution":
        audit_history = (
            db.query(AuditLog)
            .filter(AuditLog.application_id == app_id)
            .order_by(desc(AuditLog.timestamp))
            .all()
        )
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
        "remarks": None if user_role == "Institution" else app_obj.remarks,
        "decision_state": app_obj.decision_state,
        "scrutiny_recommendation": None if user_role == "Institution" else app_obj.scrutiny_recommendation,
        "scrutiny_remarks": None if user_role == "Institution" else app_obj.scrutiny_remarks,
        "final_decision": app_obj.final_decision,
        "final_decision_by": app_obj.final_decision_by,
        "final_decision_date": app_obj.final_decision_date.strftime("%d-%m-%Y %H:%M:%S") if app_obj.final_decision_date else None,
        "final_decision_reason": app_obj.final_decision_reason,
        "clarification_requested": app_obj.clarification_requested,
        "clarification_message": app_obj.clarification_message if app_obj.clarification_requested else None,
        "clarification_reply": app_obj.clarification_reply,
        "clarification_date": app_obj.clarification_date.strftime("%d-%m-%Y %H:%M") if app_obj.clarification_date else None,
        "checklist": checklist_status,
        "deficiencies": plain_deficiencies, # Plain words for institution
        "documents": docs_list,
        "verifications": verifications_list, # Empty for Institution
        "flags": flags_list,                 # Empty for Institution
        "infrastructure": infra_info,
        "history": history_list              # Empty for Institution
    }


# --- UPLOAD DOCUMENT (INSTITUTION ONLY) ---
@app.post("/api/applications/{app_id}/upload")
async def upload_document(
    app_id: str,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Institution"]))
):
    app_obj = db.query(Application).filter(Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    if app_obj.institute_id != current_user.get("institute_id"):
        record_audit_event(
            db, current_user, "ACCESS_DENIED",
            f"Institution attempted to upload document to foreign application {app_id}",
            application_id=app_id
        )
        raise HTTPException(status_code=403, detail="Forbidden: You cannot upload documents to another institute's application.")

    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{app_id}_{abs(hash(file.filename + str(datetime.datetime.now(datetime.timezone.utc)))) % 10000}{file_ext}"
    target_path = os.path.join(UPLOADS_DIR, safe_filename)

    content = await file.read()
    with open(target_path, "wb") as f:
        f.write(content)

    file_sha = compute_sha256(target_path)

    metadata = {}
    if file_ext.lower() == ".pdf":
        text, metadata = extract_pdf_data(target_path)
    else:
        text = f"Image Document: {file.filename}"
        metadata = {"format": file_ext}

    extracted_fields = parse_document_fields(text, file.filename)

    existing_docs = db.query(Document).join(Document.application).all()
    hash_map = {d.sha256_hash: d.application.institute_id for d in existing_docs if d.sha256_hash}

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
        f"Institution uploaded {doc_type} ({file.filename}) with SHA256 {file_sha[:10]}...",
        application_id=app_id
    )

    return {
        "success": True,
        "document_id": doc_record.id,
        "filename": file.filename,
        "doc_type": doc_type
    }


# --- INSTITUTION REPLY TO CLARIFICATION (INSTITUTION ONLY) ---
@app.post("/api/applications/{app_id}/institution-reply")
def reply_clarification(
    app_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Institution"]))
):
    app_obj = db.query(Application).filter(Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    if app_obj.institute_id != current_user.get("institute_id"):
        raise HTTPException(status_code=403, detail="Forbidden.")

    reply_text = payload.get("reply", "").strip()
    if not reply_text:
        raise HTTPException(status_code=400, detail="Reply cannot be empty.")

    app_obj.clarification_reply = reply_text
    app_obj.status = "Under Scrutiny"
    db.commit()

    record_audit_event(
        db, current_user, "CLARIFICATION_REPLIED",
        f"Institution replied to clarification request for {app_id}: {reply_text}",
        application_id=app_id
    )

    return {"success": True, "application_id": app_id, "status": app_obj.status}


# --- RUN SOURCE VERIFICATION (SCRUTINY & SENIOR OFFICER ONLY) ---
@app.post("/api/applications/{app_id}/verify-source")
def trigger_mock_verification(
    app_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Scrutiny Officer", "Senior Officer"]))
):
    doc_id = payload.get("document_id")
    planted_status = payload.get("status")

    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    res = verify_against_mock_source(
        doc_type=doc.doc_type,
        ref_number=doc.ref_number,
        institute_name=doc.application.institute.name if doc.application and doc.application.institute else None,
        planted_status=planted_status
    )

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


# --- ACCEPT / DISMISS FLAG (SCRUTINY & SENIOR OFFICER ONLY) ---
@app.post("/api/applications/{app_id}/flag-action")
def review_flag(
    app_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Scrutiny Officer", "Senior Officer"]))
):
    flag_id = payload.get("flag_id")
    action = payload.get("action") # "Accept" or "Dismiss"
    reason = payload.get("reason", "").strip()

    if action not in ["Accept", "Dismiss"]:
        raise HTTPException(status_code=400, detail="Action must be 'Accept' or 'Dismiss'.")
    if not reason:
        raise HTTPException(status_code=400, detail="A written reason is required when accepting or dismissing a flag.")

    flag = db.query(Flag).filter(Flag.id == flag_id, Flag.app_id == app_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found.")

    flag.state = "Confirmed" if action == "Accept" else "Dismissed"
    db.commit()

    record_audit_event(
        db, current_user, "FLAG_REVIEWED",
        f"Officer '{current_user['name']}' set flag {flag_id} ({flag.flag_type}) to '{flag.state}'. Reason: {reason}",
        application_id=app_id
    )

    return {"success": True, "flag_id": flag.id, "state": flag.state}


# --- REQUEST CLARIFICATION FROM INSTITUTION (SCRUTINY & SENIOR OFFICER ONLY) ---
@app.post("/api/applications/{app_id}/request-clarification")
def request_clarification(
    app_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Scrutiny Officer", "Senior Officer"]))
):
    app_obj = db.query(Application).filter(Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    message = payload.get("message", "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Clarification message cannot be empty.")

    app_obj.clarification_requested = True
    app_obj.clarification_message = message
    app_obj.clarification_reply = None
    app_obj.clarification_date = datetime.datetime.now(datetime.timezone.utc)
    app_obj.status = "Clarification Needed"
    db.commit()

    record_audit_event(
        db, current_user, "CLARIFICATION_REQUESTED",
        f"Officer '{current_user['name']}' requested clarification from institution: {message}",
        application_id=app_id
    )

    return {"success": True, "application_id": app_id, "status": app_obj.status}


# --- SEND CASE TO SENIOR OFFICER WITH RECOMMENDATION (SCRUTINY OFFICER ONLY) ---
@app.post("/api/applications/{app_id}/recommend")
def submit_recommendation(
    app_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Scrutiny Officer"]))
):
    app_obj = db.query(Application).filter(Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    recommendation = payload.get("recommendation") # "Recommend Approval", "Recommend Rejection", "Needs Senior Review"
    remarks = payload.get("remarks", "").strip()

    if recommendation not in ["Recommend Approval", "Recommend Rejection", "Needs Senior Review"]:
        raise HTTPException(status_code=400, detail="Invalid recommendation.")

    app_obj.scrutiny_recommendation = recommendation
    app_obj.scrutiny_remarks = remarks
    app_obj.status = "Needs Review"
    db.commit()

    record_audit_event(
        db, current_user, "CASE_ESCALATED",
        f"Scrutiny Officer submitted recommendation '{recommendation}' to Senior Officer. Remarks: {remarks}",
        application_id=app_id
    )

    return {
        "success": True,
        "application_id": app_id,
        "recommendation": app_obj.scrutiny_recommendation,
        "status": app_obj.status
    }


# --- FINAL REGULATORY DECISION (SENIOR OFFICER ONLY) ---
@app.post("/api/applications/{app_id}/decision")
def final_decision(
    app_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Senior Officer"]))
):
    decision = payload.get("decision") # "Approve", "Return for Correction", "Recommend Rejection"
    reason = payload.get("reason", "").strip()

    if decision not in ["Approve", "Return for Correction", "Recommend Rejection"]:
        raise HTTPException(status_code=400, detail="Decision must be 'Approve', 'Return for Correction', or 'Recommend Rejection'.")

    # Adverse decisions require a mandatory written reason
    if decision in ["Return for Correction", "Recommend Rejection"] and not reason:
        raise HTTPException(status_code=400, detail="Adverse decision requires a written justification/reason.")

    app_obj = db.query(Application).filter(Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    app_obj.final_decision = decision
    app_obj.final_decision_by = current_user["name"]
    app_obj.final_decision_date = datetime.datetime.now(datetime.timezone.utc)
    app_obj.final_decision_reason = reason

    if decision == "Approve":
        app_obj.status = "Approved"
    elif decision == "Return for Correction":
        app_obj.status = "Returned"
    elif decision == "Recommend Rejection":
        app_obj.status = "Rejected"

    db.commit()

    record_audit_event(
        db, current_user, "FINAL_DECISION",
        f"Senior Officer finalized regulatory decision: '{decision}'. Reason: {reason or 'Compliant'}",
        application_id=app_id
    )

    return {
        "success": True,
        "application_id": app_id,
        "final_decision": app_obj.final_decision,
        "status": app_obj.status,
        "decision_date": app_obj.final_decision_date.isoformat()
    }


# --- REASSIGN CASE (SENIOR OFFICER ONLY) ---
@app.post("/api/applications/{app_id}/reassign")
def reassign_case(
    app_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Senior Officer"]))
):
    officer_name = payload.get("assigned_officer", "").strip()
    if not officer_name:
        raise HTTPException(status_code=400, detail="Officer name cannot be empty.")

    app_obj = db.query(Application).filter(Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    old_officer = app_obj.assigned_officer
    app_obj.assigned_officer = officer_name
    db.commit()

    record_audit_event(
        db, current_user, "CASE_REASSIGNED",
        f"Reassigned application {app_id} from '{old_officer}' to '{officer_name}'",
        application_id=app_id
    )

    return {"success": True, "application_id": app_id, "assigned_officer": officer_name}


# --- LEGACY OFFICER ACTION (COMPATIBILITY) ---
@app.post("/api/applications/{app_id}/action")
def officer_action(
    app_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Scrutiny Officer", "Senior Officer"]))
):
    action = payload.get("action")
    remarks = payload.get("remarks", "")

    app_obj = db.query(Application).filter(Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    if action not in ["Accept Finding", "Dismiss", "Request Clarification"]:
        raise HTTPException(status_code=400, detail="Invalid officer action.")

    app_obj.decision_state = action
    app_obj.decision_remarks = remarks
    app_obj.decision_timestamp = datetime.datetime.now(datetime.timezone.utc)

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


# --- INFRASTRUCTURE CHECK ---
@app.post("/api/applications/{app_id}/infra-check")
def run_infra_check(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Scrutiny Officer", "Senior Officer"]))
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
    current_user: dict = Depends(require_roles(["Senior Officer", "Auditor", "Scrutiny Officer"]))
):
    query = db.query(AuditLog)

    # Scrutiny Officer can only see own audit entries
    if current_user["role"] == "Scrutiny Officer":
        query = query.filter(AuditLog.user_id == current_user["id"])

    if application_id:
        query = query.filter(AuditLog.application_id == application_id)
    if action and action != "All":
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(desc(AuditLog.timestamp)).limit(300).all()

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
    current_user: dict = Depends(require_roles(["Senior Officer", "Auditor"]))
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
def get_rules(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
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
    current_user: dict = Depends(require_roles(["Senior Officer"]))
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


# --- FRONTEND STATIC & SPA ROUTING ---
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
