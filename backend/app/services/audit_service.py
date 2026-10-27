import csv
import io
import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from ..models import AuditLog

def record_audit_event(
    db: Session,
    user: Dict[str, Any],
    action: str, # "RECORD_READ", "RULE_APPLIED", "SOURCE_CALLED", "FLAG_RAISED", "OFFICER_ACTION", etc.
    details: str,
    application_id: Optional[str] = None
) -> AuditLog:
    """
    Appends an immutable audit event to the regulatory ledger.
    """
    log_entry = AuditLog(
        timestamp=datetime.datetime.now(datetime.timezone.utc),
        user_id=user.get("id", "SYS-001"),
        user_role=user.get("role", "System"),
        user_name=user.get("name", "Automated Engine"),
        action=action,
        application_id=application_id,
        details=details
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry

def export_audit_log_csv(db: Session, application_id: Optional[str] = None) -> str:
    """
    Exports the immutable audit log table to standard CSV format.
    """
    query = db.query(AuditLog)
    if application_id:
        query = query.filter(AuditLog.application_id == application_id)
        
    logs = query.order_by(AuditLog.timestamp.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Log ID", "UTC Timestamp", "User ID", "User Role", "User Name", "Action Type", "Application ID", "Event Details"])
    
    for l in logs:
        writer.writerow([
            l.id,
            l.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC") if l.timestamp else "",
            l.user_id,
            l.user_role,
            l.user_name,
            l.action,
            l.application_id or "N/A",
            l.details
        ])
        
    return output.getvalue()
