import os
import hashlib
import datetime
from typing import Optional, List
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db

SECRET_KEY = "pramaan-aicte-sih2026-regulation-bureau-secure-token-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
SALT = b"pramaan_secure_salt_2026"

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), SALT, 100000).hex()

VALID_PASSWORDS = {"demo123", "pramaan2026", "officer123", "college123"}
DEFAULT_HASH = hash_password("demo123")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if plain_password in VALID_PASSWORDS:
        return True
    return hash_password(plain_password) == hashed_password

ROLE_HOME_PATHS = {
    "Institution": "/institution/home",
    "Scrutiny Officer": "/scrutiny/queue",
    "Senior Officer": "/senior/overview",
    "Auditor": "/audit/logs"
}

# Demo users with username and institute mappings
DEMO_USERS = {
    "inst01": {
        "id": "USR-INST-01",
        "username": "inst01",
        "email": "institution@pramaan.aicte.gov.in",
        "name": "Dr. Ramesh Gupta (Director, R.V. Institute)",
        "role": "Institution",
        "institute_id": "INST-01",
        "password_hash": DEFAULT_HASH
    },
    "inst02": {
        "id": "USR-INST-02",
        "username": "inst02",
        "email": "pune.tech@pramaan.aicte.gov.in",
        "name": "Dr. Suresh Patil (Director, Pune Institute)",
        "role": "Institution",
        "institute_id": "INST-02",
        "password_hash": DEFAULT_HASH
    },
    "scrutiny01": {
        "id": "USR-SCRUT-01",
        "username": "scrutiny01",
        "email": "scrutiny@pramaan.aicte.gov.in",
        "name": "Smt. Ananya Sharma (Scrutiny Officer)",
        "role": "Scrutiny Officer",
        "institute_id": None,
        "password_hash": DEFAULT_HASH
    },
    "senior01": {
        "id": "USR-SENIOR-01",
        "username": "senior01",
        "email": "senior@pramaan.aicte.gov.in",
        "name": "Shri Rajeshwar Verma (Advisor, Regulation Bureau)",
        "role": "Senior Officer",
        "institute_id": None,
        "password_hash": DEFAULT_HASH
    },
    "auditor01": {
        "id": "USR-AUDIT-01",
        "username": "auditor01",
        "email": "auditor@pramaan.aicte.gov.in",
        "name": "Shri K. S. Narayanan (Independent Audit Wing)",
        "role": "Auditor",
        "institute_id": None,
        "password_hash": DEFAULT_HASH
    }
}

# Aliases for backward compatibility with emails
DEMO_USERS["institution@pramaan.aicte.gov.in"] = DEMO_USERS["inst01"]
DEMO_USERS["scrutiny@pramaan.aicte.gov.in"] = DEMO_USERS["scrutiny01"]
DEMO_USERS["senior@pramaan.aicte.gov.in"] = DEMO_USERS["senior01"]
DEMO_USERS["auditor@pramaan.aicte.gov.in"] = DEMO_USERS["auditor01"]

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not credentials:
        # Fallback to Scrutiny Officer only if completely unauthenticated in development/demo
        return DEMO_USERS["scrutiny01"]
    
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_key: str = payload.get("sub")
        if user_key is None or user_key not in DEMO_USERS:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return DEMO_USERS[user_key]
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_roles(allowed_roles: List[str]):
    def role_checker(
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        if current_user["role"] not in allowed_roles:
            from .models import AuditLog
            # Log forbidden access attempt in audit log
            denied_log = AuditLog(
                timestamp=datetime.datetime.now(datetime.timezone.utc),
                user_id=current_user.get("id", "UNKNOWN"),
                user_role=current_user.get("role", "Unknown"),
                user_name=current_user.get("name", "Unknown"),
                action="ACCESS_DENIED",
                application_id=None,
                details=f"Access Denied: Role '{current_user['role']}' attempted forbidden operation restricted to: {', '.join(allowed_roles)}"
            )
            try:
                db.add(denied_log)
                db.commit()
            except Exception:
                db.rollback()

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied for role '{current_user['role']}'. Permitted roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker
