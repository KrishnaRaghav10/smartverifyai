import datetime
from typing import Dict, Any, Optional

# The exact 6 status values mandated by Section 5, F5 of AICTE-Pramaan-Spec.md
STATUS_VERIFIED = "Verified"
STATUS_MISMATCH = "Mismatch Detected"
STATUS_EXPIRED = "Expired"
STATUS_PENDING = "Verification Pending"
STATUS_UNAVAILABLE = "Source Unavailable"
STATUS_MANUAL_REVIEW = "Manual Review Required"

MOCK_REGISTRIES = {
    "University Portal": {
        "agency": "Affiliating State Technical University Portal",
        "api_endpoint": "https://university-portal.ac.in/api/v2/affiliation/verify",
        "records": {
            "AFF-MU-2025-8891": {
                "status": STATUS_VERIFIED,
                "institute_name": "R.V. Institute of Technology & Management",
                "intake": 480,
                "valid_until": "31-07-2027",
                "courses": ["Computer Engineering", "Mechanical Engineering", "Information Technology"]
            },
            "AFF-UNIV-DIFF-992": {
                "status": STATUS_MISMATCH,
                "institute_name": "Modern Institute of Applied Sciences",
                "intake": 240, # Discrepancy with application's 360
                "valid_until": "30-06-2026",
                "note": "Registry records indicate maximum approved intake is 240, but application claims 360."
            },
            "AFF-UNIV-EXP-101": {
                "status": STATUS_EXPIRED,
                "institute_name": "National Technical Campus",
                "intake": 300,
                "valid_until": "31-05-2024",
                "note": "Affiliation expired on 31-05-2024. Renewal application under dispute."
            }
        }
    },
    "NBA / NAAC": {
        "agency": "National Board of Accreditation & NAAC National Registry",
        "api_endpoint": "https://nba-india.org/api/accreditation/v3/status",
        "records": {
            "NBA-TIER1-ENG-4412": {
                "status": STATUS_VERIFIED,
                "institute_name": "R.V. Institute of Technology & Management",
                "tier": "Tier I (Washington Accord)",
                "valid_until": "30-06-2028",
                "grade": "Accredited (Score 740/1000)"
            },
            "NBA-EXP-2023-771": {
                "status": STATUS_EXPIRED,
                "institute_name": "Apex Engineering Academy",
                "tier": "Tier II",
                "valid_until": "15-01-2024",
                "grade": "Expired"
            },
            "NBA-UNAV-503": {
                "status": STATUS_UNAVAILABLE,
                "institute_name": "Kalyan Technical University Campus",
                "valid_until": None,
                "note": "Gateway timeout: Central Accreditation Repository undergoing scheduled maintenance."
            }
        }
    },
    "State Authority": {
        "agency": "State Revenue & Land Records Directorate (Bhulekh / Land NOC)",
        "api_endpoint": "https://landrecords.state.gov.in/api/v1/institution/deed-verify",
        "records": {
            "LAND-REV-MH-5521": {
                "status": STATUS_VERIFIED,
                "institute_name": "R.V. Institute of Technology & Management",
                "survey_no": "142/3-A",
                "area_acres": 12.5,
                "ownership": "Freehold Institutional Title",
                "encumbrance": "None"
            },
            "LAND-MIS-229": {
                "status": STATUS_MISMATCH,
                "institute_name": "Pioneer Institute of Engineering",
                "survey_no": "88/1",
                "area_acres": 4.2, # Discrepancy
                "note": "Survey number 88/1 records indicate agricultural classification; educational conversion pending."
            },
            "LAND-MAN-404": {
                "status": STATUS_MANUAL_REVIEW,
                "institute_name": "Shri Balaji Institute of Science",
                "survey_no": "204/C",
                "note": "Boundary demarcation dispute sub-judice before Sub-Divisional Magistrate."
            }
        }
    },
    "Fire Dept.": {
        "agency": "Directorate of Fire Prevention & Life Safety Services",
        "api_endpoint": "https://firesafety.gov.in/portal/api/verify-noc",
        "records": {
            "FIRE-NOC-2025-1102": {
                "status": STATUS_VERIFIED,
                "institute_name": "R.V. Institute of Technology & Management",
                "inspection_date": "10-01-2025",
                "valid_until": "09-01-2027",
                "hydrant_system": "Operational",
                "alarms": "Compliant"
            },
            "FIRE-NOC-EXP-900": {
                "status": STATUS_EXPIRED,
                "institute_name": "Zenith Polytechnic Institute",
                "inspection_date": "14-02-2022",
                "valid_until": "13-02-2023",
                "note": "Fire NOC lapsed over 24 months ago. No renewal inspection on record."
            },
            "FIRE-PEND-774": {
                "status": STATUS_PENDING,
                "institute_name": "Vidyapeeth College of Engineering",
                "inspection_date": "Scheduled 05-11-2026",
                "valid_until": "Pending",
                "note": "On-site hydraulic pressure inspection scheduled for next week."
            }
        }
    }
}

def verify_against_mock_source(
    doc_type: str,
    ref_number: Optional[str] = None,
    institute_name: Optional[str] = None,
    planted_status: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes simulated source check against external authority gateway.
    Returns: {
        "source": str,
        "status": str (one of 6 exact statuses),
        "timestamp": str,
        "response_payload": dict
    }
    """
    # Map document type to corresponding source
    source_name = "University Portal"
    if "nba" in doc_type.lower() or "naac" in doc_type.lower() or "accredit" in doc_type.lower():
        source_name = "NBA / NAAC"
    elif "land" in doc_type.lower() or "noc" in doc_type.lower() or "title" in doc_type.lower() or "deed" in doc_type.lower():
        source_name = "State Authority"
    elif "fire" in doc_type.lower() or "safety" in doc_type.lower():
        source_name = "Fire Dept."

    registry = MOCK_REGISTRIES.get(source_name, MOCK_REGISTRIES["University Portal"])
    timestamp_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # If planted status is requested (for demonstration test cases)
    if planted_status:
        return {
            "source": source_name,
            "status": planted_status,
            "timestamp": timestamp_str,
            "response_payload": {
                "query_ref": ref_number or "QUERY-DIRECT-CALL",
                "queried_source": registry["agency"],
                "endpoint": registry["api_endpoint"],
                "status": planted_status,
                "details": f"Simulated issuing authority lookup completed. Evaluated state: {planted_status}."
            }
        }

    # Query lookup in registry
    records = registry["records"]
    matched_record = None
    if ref_number and ref_number in records:
        matched_record = records[ref_number]
    else:
        # Fallback heuristic match by institute name
        for r_ref, r_val in records.items():
            if institute_name and institute_name.lower() in r_val.get("institute_name", "").lower():
                matched_record = r_val
                break

    if matched_record:
        status = matched_record.get("status", STATUS_VERIFIED)
        payload = {
            "query_ref": ref_number,
            "queried_source": registry["agency"],
            "endpoint": registry["api_endpoint"],
            "status": status,
            "authority_data": matched_record
        }
    else:
        # Default fallback for unplanted new documents: Verified if has ref, else Manual Review Required
        if ref_number and len(ref_number) > 3:
            status = STATUS_VERIFIED
            payload = {
                "query_ref": ref_number,
                "queried_source": registry["agency"],
                "endpoint": registry["api_endpoint"],
                "status": status,
                "authority_data": {
                    "matched": True,
                    "institute_name": institute_name or "Verified Institutional Record",
                    "issued_status": "Active & Valid"
                }
            }
        else:
            status = STATUS_MANUAL_REVIEW
            payload = {
                "query_ref": ref_number,
                "queried_source": registry["agency"],
                "endpoint": registry["api_endpoint"],
                "status": status,
                "authority_data": {
                    "matched": False,
                    "note": "Reference number could not be mapped to automated registry schema. Manual officer inspection required."
                }
            }

    return {
        "source": source_name,
        "status": status,
        "timestamp": timestamp_str,
        "response_payload": payload
    }
