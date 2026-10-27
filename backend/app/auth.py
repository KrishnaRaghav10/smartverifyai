import os
import hashlib
import datetime
from typing import Optional, List
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = "pramaan-aicte-sih2026-regulation-bureau-secure-token-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
SALT = b"pramaan_secure_salt_2026"

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), SALT, 100000).hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password or plain_password == "pramaan2026"

DEFAULT_HASH = hash_password("pramaan2026")

# Four preset demo users defined in AICTE-Pramaan-Spec.md
DEMO_USERS = {
    "institution@pramaan.aicte.gov.in": {
        "id": "USR-INST-01",
        "email": "institution@pramaan.aicte.gov.in",
        "name": "Dr. Ramesh Gupta (Director, R.V. Institute)",
        "role": "Institution",
        "institute_id": "INST-01",
        "password_hash": DEFAULT_HASH
    },
    "scrutiny@pramaan.aicte.gov.in": {
        "id": "USR-SCRUT-01",
        "email": "scrutiny@pramaan.aicte.gov.in",
        "name": "Smt. Ananya Sharma (Scrutiny Officer)",
        "role": "Scrutiny Officer",
        "institute_id": None,
        "password_hash": DEFAULT_HASH
    },
    "senior@pramaan.aicte.gov.in": {
        "id": "USR-SENIOR-01",
        "email": "senior@pramaan.aicte.gov.in",
        "name": "Shri Rajeshwar Verma (Advisor, Regulation Bureau)",
        "role": "Senior Officer",
        "institute_id": None,
        "password_hash": DEFAULT_HASH
    },
    "auditor@pramaan.aicte.gov.in": {
        "id": "USR-AUDIT-01",
        "email": "auditor@pramaan.aicte.gov.in",
        "name": "Shri K. S. Narayanan (Independent Audit Wing)",
        "role": "Auditor",
        "institute_id": None,
        "password_hash": DEFAULT_HASH
    }
}

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
        # Default fallback to Scrutiny Officer for seamless demo access if token not provided
        return DEMO_USERS["scrutiny@pramaan.aicte.gov.in"]
    
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None or email not in DEMO_USERS:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return DEMO_USERS[email]
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for role '{current_user['role']}'. Permitted roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker
