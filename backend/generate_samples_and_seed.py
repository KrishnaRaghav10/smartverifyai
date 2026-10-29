import os
import json
import datetime
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

from app.database import engine, Base, SessionLocal
from app.models import Institute, Application, Document, Verification, Flag, AuditLog, RuleItem
from app.services.document_processor import compute_sha256, perform_ela
from app.services.mock_sources import (
    STATUS_VERIFIED, STATUS_MISMATCH, STATUS_EXPIRED,
    STATUS_PENDING, STATUS_UNAVAILABLE, STATUS_MANUAL_REVIEW
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
SAMPLE_DOCS_DIR = os.path.join(PROJECT_ROOT, "sample_data", "documents")
SAMPLE_INFRA_DIR = os.path.join(PROJECT_ROOT, "sample_data", "infrastructure")

os.makedirs(SAMPLE_DOCS_DIR, exist_ok=True)
os.makedirs(SAMPLE_INFRA_DIR, exist_ok=True)

def create_sample_pdf(filepath: str, title: str, inst_name: str, ref_no: str, issue_date: str, expiry_date: str, authority: str, intake: int = 480):
    """Generates official-looking PDF certificate using reportlab."""
    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter
    
    # Outer Border
    c.setStrokeColor(colors.HexColor("#1B3A6B"))
    c.setLineWidth(2)
    c.rect(30, 30, width - 60, height - 60)
    c.rect(34, 34, width - 68, height - 68)
    
    # Top Tricolour Header Band
    c.setFillColor(colors.HexColor("#FF9933"))
    c.rect(36, height - 50, width - 72, 4, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#FFFFFF"))
    c.rect(36, height - 54, width - 72, 4, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#138808"))
    c.rect(36, height - 58, width - 72, 4, fill=1, stroke=0)

    # Header
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(colors.HexColor("#1B3A6B"))
    c.drawCentredString(width / 2.0, height - 90, authority.upper())
    
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(colors.HexColor("#333333"))
    c.drawCentredString(width / 2.0, height - 120, title)
    
    c.setStrokeColor(colors.HexColor("#CCCCCC"))
    c.setLineWidth(1)
    c.line(60, height - 135, width - 60, height - 135)
    
    # Body Details
    c.setFont("Helvetica", 11)
    c.setFillColor(colors.black)
    
    y = height - 170
    c.drawString(70, y, f"Reference Number: {ref_no}")
    c.drawString(380, y, f"Date of Issue: {issue_date}")
    
    y -= 30
    c.drawString(70, y, f"Subject: Official Regulatory Certification / Clearance")
    c.drawString(380, y, f"Valid Up To: {expiry_date}")
    
    y -= 45
    text_object = c.beginText(70, y)
    text_object.setFont("Helvetica", 10)
    text_object.setLeading(16)
    text_object.textLines(f"""
This is to certify that the regulatory competent authority has reviewed the institutional compliance
dossier submitted by the applicant institution:

Institution Name: {inst_name}
Approved Academic Intake: {intake} Students
Academic Session: 2026-2027

Based on technical scrutinies, physical infrastructure audits, and adherence to prescribed norms
under the regulatory statutory framework, this certificate is hereby granted for the designated validity.

Any discrepancy, unauthorized tampering, or misrepresentation will attract immediate cancellation
and punitive regulatory action as per AICTE Approval Process Regulations.
    """)
    c.drawText(text_object)
    
    # Digital Seal & Signatory Box
    y = 120
    c.setStrokeColor(colors.HexColor("#1B3A6B"))
    c.rect(70, y, 160, 60)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(80, y + 45, "REGULATORY SEAL")
    c.setFont("Helvetica", 8)
    c.drawString(80, y + 30, f"Issued by: {authority[:25]}")
    c.drawString(80, y + 15, "Digitally Verified & Logged")
    
    c.rect(width - 230, y, 160, 60)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(width - 220, y + 45, "AUTHORIZED SIGNATORY")
    c.setFont("Helvetica", 8)
    c.drawString(width - 220, y + 30, "Registrar / Competent Officer")
    c.drawString(width - 220, y + 15, "Digital Signature Valid")
    
    c.save()

def create_sample_images():
    """Generates synthetic sample infrastructure and forensic images."""
    # 1. Clean Lab Photo
    img_lab = Image.new("RGB", (800, 600), color="#E2E8F0")
    draw = ImageDraw.Draw(img_lab)
    draw.rectangle([40, 40, 760, 560], fill="#CBD5E1", outline="#1B3A6B", width=3)
    draw.text((60, 60), "AICTE CENTRAL COMPUTING LAB - 120 WORKSTATIONS", fill="#1B3A6B")
    for i in range(4):
        for j in range(3):
            x = 80 + i * 160
            y = 120 + j * 130
            draw.rectangle([x, y, x + 130, y + 90], fill="#475569", outline="#0F172A", width=2)
            draw.rectangle([x + 20, y + 20, x + 110, y + 70], fill="#38BDF8")
    img_lab.save(os.path.join(SAMPLE_INFRA_DIR, "lab_computer_center.jpg"), quality=95)

    # 2. Clean Library Photo
    img_lib = Image.new("RGB", (800, 600), color="#F1F5F9")
    draw = ImageDraw.Draw(img_lib)
    draw.rectangle([40, 40, 760, 560], fill="#E2E8F0", outline="#1B3A6B", width=3)
    draw.text((60, 60), "CENTRAL LIBRARY & DIGITAL KNOWLEDGE CENTER - 450 SQ.M", fill="#1B3A6B")
    for row in range(5):
        draw.rectangle([80, 120 + row * 80, 720, 160 + row * 80], fill="#94A3B8")
    img_lib.save(os.path.join(SAMPLE_INFRA_DIR, "library_reading_hall.jpg"), quality=95)

    # 3. Blurry Mechanical Workshop (for blur detector)
    img_blur = Image.new("RGB", (800, 600), color="#94A3B8")
    draw = ImageDraw.Draw(img_blur)
    draw.text((100, 250), "MECHANICAL WORKSHOP - DEFICIENT EVIDENCE", fill="#334155")
    # Apply severe Gaussian blur
    img_blur = img_blur.filter(ImageFilter.GaussianBlur(radius=12))
    img_blur.save(os.path.join(SAMPLE_INFRA_DIR, "blurry_mechanical_workshop.jpg"), quality=60)

    # 4. Tampered date stamp image (for ELA detection)
    img_stamp = Image.new("RGB", (600, 400), color="#FFFFFF")
    draw = ImageDraw.Draw(img_stamp)
    draw.rectangle([20, 20, 580, 380], outline="#1B3A6B", width=2)
    draw.text((40, 40), "AFFILIATION CERTIFICATE EXTENSION", fill="#1B3A6B")
    draw.text((40, 90), "Date of Issue: 15-06-2022", fill="#333333")
    draw.text((40, 140), "Valid Till: 30-06-2024", fill="#333333")
    
    # Save base
    base_stamp_path = os.path.join(SAMPLE_INFRA_DIR, "tampered_temp.jpg")
    img_stamp.save(base_stamp_path, quality=95)
    
    # Re-open, paste an altered date stamp box at high contrast
    re_img = Image.open(base_stamp_path)
    d_re = ImageDraw.Draw(re_img)
    # Tampered patch over date
    d_re.rectangle([100, 135, 300, 165], fill="#FFFFFF", outline="#E8890C", width=1)
    d_re.text((110, 140), "Valid Till: 30-06-2028 [ALTERED]", fill="#B3261E")
    
    # Save with low quality to introduce sharp resave differential
    re_img.save(os.path.join(SAMPLE_INFRA_DIR, "tampered_date_stamp.png"))
    if os.path.exists(base_stamp_path):
        os.remove(base_stamp_path)

def generate_sample_pdfs():
    """Generates the 6 required sample PDFs in sample_data/documents/"""
    # 1. Clean Affiliation Letter
    create_sample_pdf(
        os.path.join(SAMPLE_DOCS_DIR, "Affiliation_Letter_RV_Tech.pdf"),
        "CONTINUATION OF AFFILIATION LETTER (AY 2026-27)",
        "R.V. Institute of Technology & Management",
        "AFF-MU-2025-8891",
        "15-06-2025",
        "31-07-2027",
        "State Technical University Portal",
        480
    )

    # 2. Clean NBA Accreditation
    create_sample_pdf(
        os.path.join(SAMPLE_DOCS_DIR, "NBA_Accreditation_RV_Tech.pdf"),
        "NATIONAL BOARD OF ACCREDITATION - CERTIFICATE",
        "R.V. Institute of Technology & Management",
        "NBA-TIER1-ENG-4412",
        "01-07-2023",
        "30-06-2028",
        "National Board of Accreditation (NBA)",
        480
    )

    # 3. Clean Fire Safety Certificate
    create_sample_pdf(
        os.path.join(SAMPLE_DOCS_DIR, "Fire_NOC_RV_Tech.pdf"),
        "FIRE SAFETY CLEARANCE & NO OBJECTION CERTIFICATE",
        "R.V. Institute of Technology & Management",
        "FIRE-NOC-2025-1102",
        "10-01-2025",
        "09-01-2027",
        "State Disaster Management & Fire Services",
        480
    )

    # 4. Clean Land Deed / NOC
    create_sample_pdf(
        os.path.join(SAMPLE_DOCS_DIR, "Land_NOC_Apex_Eng.pdf"),
        "LAND TITLE AND NON-ENCUMBRANCE CERTIFICATE",
        "Apex Engineering Academy",
        "LAND-REV-MH-5521",
        "05-03-2022",
        "04-03-2052",
        "State Revenue & Land Records Directorate",
        360
    )

    # 5. Duplicate Document (Identical hash used across 2 institutes)
    create_sample_pdf(
        os.path.join(SAMPLE_DOCS_DIR, "Affiliation_Letter_Duplicate_Shared.pdf"),
        "ANNUAL AFFILIATION EXTENSION DOSSIER",
        "Shared Polytechnic Consortium",
        "AFF-SHARED-DUPE-77",
        "12-05-2025",
        "31-05-2027",
        "State Technical University Portal",
        300
    )

    # 6. Expired Accreditation Certificate
    create_sample_pdf(
        os.path.join(SAMPLE_DOCS_DIR, "NBA_Accreditation_Expired_2023.pdf"),
        "NBA ACCREDITATION CERTIFICATE (TIER II)",
        "Apex Engineering Academy",
        "NBA-EXP-2023-771",
        "16-01-2019",
        "15-01-2024", # Expired!
        "National Board of Accreditation (NBA)",
        360
    )

def seed_database():
    """Initializes SQLite schema, rules, and seeds 15 synthetic applications."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(Application).count() >= 15:
        print("Database already has 15+ applications. Refreshing tables.")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    # 1. Load Rules from eoa_rules.json
    rules_json_path = os.path.join(BASE_DIR, "rules", "eoa_rules.json")
    if os.path.exists(rules_json_path):
        with open(rules_json_path, "r", encoding="utf-8") as f:
            rules_data = json.load(f)
            for r in rules_data:
                db.add(RuleItem(
                    id=r["id"],
                    code=r["code"],
                    title=r["title"],
                    category=r["category"],
                    handbook_ref=r["handbook_ref"],
                    description=r["description"],
                    enabled=r.get("enabled", True),
                    severity=r.get("severity", "HIGH")
                ))
        db.commit()

    # 2. Seed 10 Institutes
    institutes_data = [
        ("INST-01", "R.V. Institute of Technology & Management", "Maharashtra", "Pune", "1-3324567891", 480),
        ("INST-02", "Pune Institute of Technical Sciences", "Maharashtra", "Pune", "1-3324567892", 420),
        ("INST-03", "Modern College of Engineering & Research", "Karnataka", "Bengaluru", "1-4412389101", 360),
        ("INST-04", "Apex Engineering Academy", "Maharashtra", "Mumbai", "1-5512998822", 360),
        ("INST-05", "Bharath Institute of Higher Technology", "Tamil Nadu", "Chennai", "1-6623119933", 300),
        ("INST-06", "Saraswati Technical Institute", "Gujarat", "Ahmedabad", "1-7734220044", 240),
        ("INST-07", "Zenith Academy of Engineering", "Telangana", "Hyderabad", "1-8845331155", 300),
        ("INST-08", "National Technical Campus", "Madhya Pradesh", "Bhopal", "1-9956442266", 240),
        ("INST-09", "Pioneer Institute of Technology", "Uttar Pradesh", "Noida", "1-1122334455", 360),
        ("INST-10", "Horizon Institute of Engineering", "Rajasthan", "Jaipur", "1-2233445566", 300),
    ]

    inst_map = {}
    for i_id, name, state, dist, aicte_id, intake in institutes_data:
        inst = Institute(
            id=i_id,
            name=name,
            state=state,
            district=dist,
            aicte_id=aicte_id,
            approved_intake=intake,
            address=f"Plot No. {intake//10}, Institutional Area, {dist}, {state}"
        )
        db.add(inst)
        inst_map[i_id] = inst
    db.commit()

    # File paths for sample attachments
    pdf_rv_aff = os.path.join(SAMPLE_DOCS_DIR, "Affiliation_Letter_RV_Tech.pdf")
    pdf_rv_nba = os.path.join(SAMPLE_DOCS_DIR, "NBA_Accreditation_RV_Tech.pdf")
    pdf_rv_fire = os.path.join(SAMPLE_DOCS_DIR, "Fire_NOC_RV_Tech.pdf")
    pdf_apex_land = os.path.join(SAMPLE_DOCS_DIR, "Land_NOC_Apex_Eng.pdf")
    pdf_shared_dupe = os.path.join(SAMPLE_DOCS_DIR, "Affiliation_Letter_Duplicate_Shared.pdf")
    pdf_expired_nba = os.path.join(SAMPLE_DOCS_DIR, "NBA_Accreditation_Expired_2023.pdf")
    img_tampered = os.path.join(SAMPLE_INFRA_DIR, "tampered_date_stamp.png")

    hash_dupe = compute_sha256(pdf_shared_dupe)

    # 3. Seed 15 Planted Applications covering all required cases from Section 9
    apps_seed = [
        # --- Case 1: 3 Fully clean ---
        {
            "id": "APP-2026-001", "inst": "INST-01", "cat": "Extension of Approval", "status": "Clean",
            "students": 480, "area": 2500.0, "labs": 10, "infra_adv": "Sufficient",
            "docs": [
                ("Affiliation Letter", pdf_rv_aff, "AFF-MU-2025-8891", "15-06-2025", "31-07-2027", "State Technical University Portal", STATUS_VERIFIED),
                ("NBA Accreditation", pdf_rv_nba, "NBA-TIER1-ENG-4412", "01-07-2023", "30-06-2028", "National Board of Accreditation (NBA)", STATUS_VERIFIED),
                ("Fire Safety Certificate", pdf_rv_fire, "FIRE-NOC-2025-1102", "10-01-2025", "09-01-2027", "State Disaster Management & Fire Services", STATUS_VERIFIED),
                ("Land Deed / NOC", pdf_apex_land, "LAND-REV-MH-5521", "05-03-2022", "04-03-2052", "State Revenue & Land Records Directorate", STATUS_VERIFIED)
            ],
            "flags": []
        },
        {
            "id": "APP-2026-002", "inst": "INST-02", "cat": "Extension of Approval", "status": "Clean",
            "students": 420, "area": 2200.0, "labs": 9, "infra_adv": "Sufficient",
            "docs": [
                ("Affiliation Letter", pdf_rv_aff, "AFF-MU-2025-8891", "15-06-2025", "31-07-2027", "State Technical University Portal", STATUS_VERIFIED),
                ("Fire Safety Certificate", pdf_rv_fire, "FIRE-NOC-2025-1102", "10-01-2025", "09-01-2027", "State Disaster Management & Fire Services", STATUS_VERIFIED)
            ],
            "flags": []
        },
        {
            "id": "APP-2026-003", "inst": "INST-03", "cat": "Increase in intake", "status": "Clean",
            "students": 420, "area": 2400.0, "labs": 10, "infra_adv": "Sufficient",
            "docs": [
                ("Affiliation Letter", pdf_rv_aff, "AFF-MU-2025-8891", "15-06-2025", "31-07-2027", "State Technical University Portal", STATUS_VERIFIED),
                ("NBA Accreditation", pdf_rv_nba, "NBA-TIER1-ENG-4412", "01-07-2023", "30-06-2028", "National Board of Accreditation (NBA)", STATUS_VERIFIED),
                ("Land Deed / NOC", pdf_apex_land, "LAND-REV-MH-5521", "05-03-2022", "04-03-2052", "State Revenue & Land Records Directorate", STATUS_VERIFIED)
            ],
            "flags": []
        },

        # --- Case 2: 3 Missing document ---
        {
            "id": "APP-2026-004", "inst": "INST-01", "cat": "Extension of Approval", "status": "Deficient",
            "students": 360, "area": 1900.0, "labs": 8, "infra_adv": "Sufficient",
            "docs": [
                ("Affiliation Letter", pdf_rv_aff, "AFF-MU-2025-8891", "15-06-2025", "31-07-2027", "State Technical University Portal", STATUS_VERIFIED),
                ("Land Deed / NOC", pdf_apex_land, "LAND-REV-MH-5521", "05-03-2022", "04-03-2052", "State Revenue & Land Records Directorate", STATUS_VERIFIED)
                # MISSING: Fire Safety Certificate
            ],
            "flags": [
                {"type": "Missing Document", "what": "Mandatory Fire Safety Certificate not uploaded", "where": "Checklist - Building Safety", "why": "APH 2026-27 Ch. 4 Cl. 4.1 requires an unexpired Fire Safety NOC from State Fire Department.", "conf": 1.0}
            ]
        },
        {
            "id": "APP-2026-005", "inst": "INST-02", "cat": "New course", "status": "Deficient",
            "students": 300, "area": 1600.0, "labs": 7, "infra_adv": "Sufficient",
            "docs": [
                ("Affiliation Letter", pdf_rv_aff, "AFF-MU-2025-8891", "15-06-2025", "31-07-2027", "State Technical University Portal", STATUS_VERIFIED)
                # MISSING: NBA Accreditation & Land NOC
            ],
            "flags": [
                {"type": "Missing Document", "what": "NBA Accreditation Dossier missing for New Course", "where": "Checklist - Quality Assurance", "why": "New Course introduction requires valid NBA accreditation in minimum 50% existing eligible courses.", "conf": 1.0}
            ]
        },
        {
            "id": "APP-2026-006", "inst": "INST-06", "cat": "Increase in intake", "status": "Deficient",
            "students": 300, "area": 1500.0, "labs": 6, "infra_adv": "Sufficient",
            "docs": [
                ("Affiliation Letter", pdf_rv_aff, "AFF-MU-2025-8891", "15-06-2025", "31-07-2027", "State Technical University Portal", STATUS_VERIFIED),
                ("Fire Safety Certificate", pdf_rv_fire, "FIRE-NOC-2025-1102", "10-01-2025", "09-01-2027", "State Disaster Management & Fire Services", STATUS_VERIFIED)
                # MISSING: Land Deed / NOC
            ],
            "flags": [
                {"type": "Missing Document", "what": "Registered Land Title / NOC Deed missing", "where": "Checklist - Legal & Land", "why": "Institutional expansion requires submitted registered lease or freehold ownership deed.", "conf": 1.0}
            ]
        },

        # --- Case 3: 2 Expired accreditation ---
        {
            "id": "APP-2026-007", "inst": "INST-07", "cat": "Increase in intake", "status": "Needs Review",
            "students": 360, "area": 1800.0, "labs": 8, "infra_adv": "Sufficient",
            "docs": [
                ("Affiliation Letter", pdf_rv_aff, "AFF-MU-2025-8891", "15-06-2025", "31-07-2027", "State Technical University Portal", STATUS_VERIFIED),
                ("NBA Accreditation", pdf_expired_nba, "NBA-EXP-2023-771", "16-01-2019", "15-01-2024", "National Board of Accreditation (NBA)", STATUS_EXPIRED)
            ],
            "flags": [
                {"type": "Date Irregularity", "what": "Accreditation expired on 15-01-2024", "where": "NBA Accreditation Certificate", "why": "Certificate validity ended prior to current academic session 2026-27.", "conf": 0.98}
            ]
        },
        {
            "id": "APP-2026-008", "inst": "INST-08", "cat": "New course", "status": "Needs Review",
            "students": 240, "area": 1400.0, "labs": 6, "infra_adv": "Sufficient",
            "docs": [
                ("Affiliation Letter", pdf_rv_aff, "AFF-MU-2025-8891", "15-06-2025", "31-07-2027", "State Technical University Portal", STATUS_VERIFIED),
                ("NBA Accreditation", pdf_expired_nba, "AFF-UNIV-EXP-101", "10-06-2021", "31-05-2024", "NBA / NAAC", STATUS_EXPIRED)
            ],
            "flags": [
                {"type": "Date Irregularity", "what": "NAAC institutional cycle expired", "where": "Accreditation Validity Field", "why": "Peer team validity lapsed over 2 academic years ago. Compliance review pending.", "conf": 0.95}
            ]
        },

        # --- Case 4: 2 Name mismatch with AICTE record ---
        {
            "id": "APP-2026-009", "inst": "INST-09", "cat": "Extension of Approval", "status": "Needs Review",
            "students": 360, "area": 1900.0, "labs": 8, "infra_adv": "Sufficient",
            "docs": [
                ("Affiliation Letter", pdf_rv_aff, "AFF-UNIV-DIFF-992", "15-06-2025", "30-06-2026", "State Technical University Portal", STATUS_MISMATCH)
            ],
            "flags": [
                {"type": "Identifier Mismatch", "what": "Discrepancy in institutional title", "where": "Affiliation Certificate - Recipient Field", "why": "Certificate issued to 'Pioneer Polytechnic Society' while AICTE records specify 'Pioneer Institute of Technology'.", "conf": 0.92}
            ]
        },
        {
            "id": "APP-2026-010", "inst": "INST-03", "cat": "Increase in intake", "status": "Needs Review",
            "students": 420, "area": 2000.0, "labs": 8, "infra_adv": "Sufficient",
            "docs": [
                ("Land Deed / NOC", pdf_apex_land, "LAND-MIS-229", "05-03-2022", "04-03-2052", "State Authority", STATUS_MISMATCH)
            ],
            "flags": [
                {"type": "Identifier Mismatch", "what": "Land revenue classification mismatch", "where": "Land Title Deed - Schedule B", "why": "Survey demarcation addresses parent educational trust rather than individual technical campus.", "conf": 0.89}
            ]
        },

        # --- Case 5: 2 Duplicate document across institutes ---
        {
            "id": "APP-2026-011", "inst": "INST-01", "cat": "Extension of Approval", "status": "Needs Review",
            "students": 480, "area": 2400.0, "labs": 9, "infra_adv": "Sufficient",
            "docs": [
                ("Affiliation Letter", pdf_shared_dupe, "AFF-SHARED-DUPE-77", "12-05-2025", "31-05-2027", "State Technical University Portal", STATUS_VERIFIED)
            ],
            "flags": []
        },
        {
            "id": "APP-2026-012", "inst": "INST-02", "cat": "Extension of Approval", "status": "Deficient",
            "students": 420, "area": 2100.0, "labs": 8, "infra_adv": "Sufficient",
            "docs": [
                ("Affiliation Letter", pdf_shared_dupe, "AFF-SHARED-DUPE-77", "12-05-2025", "31-05-2027", "State Technical University Portal", STATUS_VERIFIED)
            ],
            "flags": [
                {"type": "Duplicate Document", "what": f"Identical file hash ({hash_dupe[:12]}...)", "where": "Affiliation Letter", "why": "This exact file was also filed by INST-01 (R.V. Institute). Fraudulent duplicate submission suspected.", "conf": 0.99}
            ]
        },

        # --- Case 6: 1 Edited date on scanned letter ---
        {
            "id": "APP-2026-013", "inst": "INST-10", "cat": "Extension of Approval", "status": "Needs Review",
            "students": 300, "area": 1600.0, "labs": 7, "infra_adv": "Sufficient",
            "docs": [
                ("Affiliation Letter", img_tampered, "AFF-ALTERED-STAMP-01", "15-06-2022", "30-06-2028", "State Technical University", STATUS_MANUAL_REVIEW)
            ],
            "flags": [
                {"type": "Visual Edit Hint", "what": "High error-level differential (Score: 0.68)", "where": "Date & Stamp Segment", "why": "ELA detected distinct compression boundary along the 'Valid Till' stamp, indicative of localized photo manipulation.", "conf": 0.88},
                {"type": "Metadata Mismatch", "what": "Consumer editing software signature", "where": "Image EXIF Header", "why": "File metadata records recent modification via desktop image editor prior to portal upload.", "conf": 0.85}
            ]
        },

        # --- Case 7: 1 Source unavailable ---
        {
            "id": "APP-2026-014", "inst": "INST-08", "cat": "New course", "status": "Verification Pending",
            "students": 240, "area": 1500.0, "labs": 6, "infra_adv": "Sufficient",
            "docs": [
                ("NBA Accreditation", pdf_rv_nba, "NBA-UNAV-503", "12-02-2024", "11-02-2027", "NBA / NAAC", STATUS_UNAVAILABLE)
            ],
            "flags": [
                {"type": "External Source Timeout", "what": "Accreditation API gateway timeout (HTTP 503)", "where": "NBA / NAAC Verification Channel", "why": "External portal connection timed out after 3 attempts. Verification pending re-query.", "conf": 0.75}
            ]
        },

        # --- Case 8: 1 Infrastructure photos insufficient ---
        {
            "id": "APP-2026-015", "inst": "INST-06", "cat": "Increase in intake", "status": "Deficient",
            "students": 480, "area": 1200.0, "labs": 4, "infra_adv": "Suggest Inspection",
            "docs": [
                ("Affiliation Letter", pdf_rv_aff, "AFF-MU-2025-8891", "15-06-2025", "31-07-2027", "State Technical University Portal", STATUS_VERIFIED)
            ],
            "flags": [
                {"type": "Infrastructure Deficit", "what": "Carpet area deficit & insufficient laboratories", "where": "Campus Facilities Report", "why": "Provided 1200.0 sq.m (2.5 sq.m/student) is critically below the 4.5 sq.m/student norm. Only 4 labs reported for 480 intake.", "conf": 0.95}
            ]
        }
    ]

    for item in apps_seed:
        app = Application(
            id=item["id"],
            institute_id=item["inst"],
            category=item["cat"],
            status=item["status"],
            submitted_on=datetime.datetime.utcnow() - datetime.timedelta(days=abs(hash(item["id"])) % 14),
            assigned_officer="Smt. Ananya Sharma",
            remarks="Automated pre-scrutiny pipeline ingested all submitted documents.",
            student_count=item["students"],
            built_up_area_sqm=item["area"],
            labs_count=item["labs"],
            infra_advisory=item["infra_adv"],
            infra_notes="Infrastructure norms evaluated against AICTE APH Chapter 5."
        )
        db.add(app)
        db.commit()

        # Add documents
        for doc_tuple in item["docs"]:
            d_type, d_file, d_ref, d_issue, d_exp, d_auth, d_status = doc_tuple
            d_hash = compute_sha256(d_file)
            doc_record = Document(
                id=f"DOC-{abs(hash(item['id'] + d_type)) % 100000:05d}",
                app_id=app.id,
                doc_type=d_type,
                file_path=d_file,
                original_filename=os.path.basename(d_file),
                issue_date=d_issue,
                expiry_date=d_exp,
                ref_number=d_ref,
                issuing_authority=d_auth,
                sha256_hash=d_hash,
                extracted_json=json.dumps({
                    "institute_name": inst_map[item["inst"]].name,
                    "ref_number": d_ref,
                    "issue_date": d_issue,
                    "expiry_date": d_exp,
                    "issuing_authority": d_auth,
                    "approved_intake": item["students"]
                }),
                metadata_json=json.dumps({
                    "sha256": d_hash,
                    "pages": 1,
                    "digital_signature": "AICTE-Compliant SHA-256 Digest"
                })
            )
            db.add(doc_record)
            db.commit()

            # Add verification
            ver = Verification(
                id=f"VER-{abs(hash(doc_record.id)) % 100000:05d}",
                doc_id=doc_record.id,
                source=d_auth,
                status=d_status,
                query_ref=d_ref,
                response_payload=json.dumps({
                    "source": d_auth,
                    "status": d_status,
                    "query_ref": d_ref,
                    "evaluated_at": datetime.datetime.utcnow().isoformat() + "Z"
                })
            )
            db.add(ver)

        # Add flags
        for f in item["flags"]:
            flg = Flag(
                id=f"FLG-{abs(hash(item['id'] + f['what'])) % 100000:05d}",
                app_id=app.id,
                flag_type=f["type"],
                what=f["what"],
                where=f["where"],
                why=f["why"],
                confidence=f["conf"],
                state="Active"
            )
            db.add(flg)

        # Add initial audit log
        audit = AuditLog(
            timestamp=datetime.datetime.utcnow() - datetime.timedelta(hours=4),
            user_id="SYS-PIPELINE-01",
            user_role="System",
            user_name="Automated Ingestion Worker",
            action="PIPELINE_EVALUATION",
            application_id=app.id,
            details=f"Application {app.id} processed through OCR extraction, hash verification, and APH rules check. Computed status: {app.status}."
        )
        db.add(audit)

    db.commit()
    db.close()
    print("Database seeding completed successfully with 15 planted applications.")

if __name__ == "__main__":
    print("Generating sample PDFs...")
    generate_sample_pdfs()
    print("Generating sample images...")
    create_sample_images()
    print("Seeding database...")
    seed_database()
