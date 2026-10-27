import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class Institute(Base):
    __tablename__ = "institutes"

    id = Column(String(50), primary_key=True, index=True) # e.g. INST-MH-001
    name = Column(String(255), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    aicte_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. 1-3324567891
    approved_intake = Column(Integer, default=360)
    address = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    applications = relationship("Application", back_populates="institute")


class Application(Base):
    __tablename__ = "applications"

    id = Column(String(50), primary_key=True, index=True) # e.g. APP-2026-001
    institute_id = Column(String(50), ForeignKey("institutes.id"), nullable=False)
    category = Column(String(100), nullable=False) # "Extension of Approval", "Increase in intake", "New course"
    status = Column(String(50), default="Needs Review", index=True) # "Clean", "Needs Review", "Deficient", "Verification Pending"
    submitted_on = Column(DateTime, default=datetime.datetime.utcnow)
    assigned_officer = Column(String(100), default="Scrutiny Officer")
    remarks = Column(Text, nullable=True)
    
    # Infrastructure attributes for F6 checking
    student_count = Column(Integer, default=480)
    built_up_area_sqm = Column(Float, default=2400.0)
    labs_count = Column(Integer, default=8)
    infra_advisory = Column(String(50), default="Sufficient") # "Sufficient", "Needs More Evidence", "Suggest Inspection"
    infra_notes = Column(Text, nullable=True)

    # Officer action outcome
    decision_state = Column(String(50), default="Pending") # "Pending", "Accepted Finding", "Dismissed", "Clarification Requested"
    decision_remarks = Column(Text, nullable=True)
    decision_timestamp = Column(DateTime, nullable=True)

    institute = relationship("Institute", back_populates="applications")
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    flags = relationship("Flag", back_populates="application", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(50), primary_key=True, index=True) # e.g. DOC-001
    app_id = Column(String(50), ForeignKey("applications.id"), nullable=False)
    doc_type = Column(String(100), nullable=False) # e.g. "Affiliation Letter", "NBA Accreditation", "Land Deed / NOC", "Fire Safety Certificate"
    file_path = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    extracted_json = Column(Text, nullable=True) # JSON containing parsed fields (institute_name, ref_no, issue_date, expiry_date, etc.)
    issue_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    ref_number = Column(String(100), nullable=True)
    issuing_authority = Column(String(255), nullable=True)
    sha256_hash = Column(String(64), index=True, nullable=True)
    metadata_json = Column(Text, nullable=True) # PDF/Image metadata, ELA score, producer tool
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("Application", back_populates="documents")
    verifications = relationship("Verification", back_populates="document", cascade="all, delete-orphan")
    flags = relationship("Flag", back_populates="document", cascade="all, delete-orphan")


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(String(50), primary_key=True, index=True) # e.g. VER-001
    doc_id = Column(String(50), ForeignKey("documents.id"), nullable=False)
    source = Column(String(100), nullable=False) # "University Portal", "NBA / NAAC", "State Authority", "Fire Dept."
    status = Column(String(50), nullable=False) # Verified, Mismatch Detected, Expired, Verification Pending, Source Unavailable, Manual Review Required
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    query_ref = Column(String(100), nullable=True)
    response_payload = Column(Text, nullable=True) # JSON raw response from mock external gateway

    document = relationship("Document", back_populates="verifications")


class Flag(Base):
    __tablename__ = "flags"

    id = Column(String(50), primary_key=True, index=True) # e.g. FLG-001
    app_id = Column(String(50), ForeignKey("applications.id"), nullable=False)
    doc_id = Column(String(50), ForeignKey("documents.id"), nullable=True)
    flag_type = Column(String(100), nullable=False) # "Duplicate Document", "Date Irregularity", "Metadata Mismatch", "Identifier Mismatch", "Visual Edit Hint"
    what = Column(String(255), nullable=False)
    where = Column(String(255), nullable=False)
    why = Column(Text, nullable=False)
    confidence = Column(Float, default=0.92) # e.g. 0.95
    state = Column(String(50), default="Active") # "Active", "Confirmed", "Dismissed"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("Application", back_populates="flags")
    document = relationship("Document", back_populates="flags")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    user_id = Column(String(100), nullable=False)
    user_role = Column(String(50), nullable=False)
    user_name = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False) # e.g. "RECORD_READ", "RULE_APPLIED", "SOURCE_VERIFIED", "FLAG_RAISED", "OFFICER_ACTION"
    application_id = Column(String(50), nullable=True, index=True)
    details = Column(Text, nullable=False)


class RuleItem(Base):
    __tablename__ = "rules"

    id = Column(String(50), primary_key=True)
    code = Column(String(100), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    handbook_ref = Column(String(100), nullable=False) # e.g. "APH 2026-27, Ch. 3"
    description = Column(Text, nullable=False)
    enabled = Column(Boolean, default=True)
    severity = Column(String(50), default="HIGH")
