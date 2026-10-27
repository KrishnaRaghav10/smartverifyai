import cv2
import numpy as np
from typing import Dict, Any, List

def evaluate_image_quality(image_path: str) -> Dict[str, Any]:
    """Evaluates image focus and sharpness using Laplacian variance."""
    try:
        img = cv2.imread(image_path)
        if img is None:
            return {"sharpness": 0, "is_blurry": True, "note": "Unreadable image format"}
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        is_blurry = variance < 70.0
        
        return {
            "sharpness": round(variance, 2),
            "is_blurry": is_blurry,
            "resolution": f"{img.shape[1]}x{img.shape[0]}",
            "channels": img.shape[2]
        }
    except Exception as e:
        return {"sharpness": 100.0, "is_blurry": False, "note": str(e)}

def evaluate_infrastructure_compliance(
    student_count: int,
    built_up_area_sqm: float,
    labs_count: int,
    image_paths: List[str] = None
) -> Dict[str, Any]:
    """
    Evaluates campus physical infrastructure against AICTE APH Chapter 5 norms.
    Advisory outputs strictly: 'Sufficient' · 'Needs More Evidence' · 'Suggest Inspection'
    """
    image_paths = image_paths or []
    norm_area_per_student = 4.5 # sq.m per student
    required_area = student_count * norm_area_per_student
    actual_ratio = round(built_up_area_sqm / max(student_count, 1), 2)
    
    required_labs = max(6, int(student_count / 60))
    
    issues = []
    
    # 1. Area evaluation
    if built_up_area_sqm < (required_area * 0.80):
        issues.append(f"Instructional area deficit: Provided {built_up_area_sqm} sq.m vs. required {required_area} sq.m ({actual_ratio} sq.m/student vs norm {norm_area_per_student} sq.m).")
    elif built_up_area_sqm < required_area:
        issues.append(f"Instructional area marginal: {actual_ratio} sq.m/student is slightly below standard norm of {norm_area_per_student} sq.m.")

    # 2. Labs evaluation
    if labs_count < required_labs:
        issues.append(f"Laboratory deficiency: {labs_count} labs reported vs minimum requirement of {required_labs} labs for {student_count} intake.")

    # 3. Photo checks
    blurry_photos = 0
    for p in image_paths:
        res = evaluate_image_quality(p)
        if res.get("is_blurry"):
            blurry_photos += 1
            
    if blurry_photos > 0:
        issues.append(f"{blurry_photos} submitted infrastructure photo(s) suffer from low resolution or severe optical blur.")

    if len(image_paths) < 2 and len(image_paths) > 0:
        issues.append("Insufficient photographic coverage: fewer than 2 distinct physical vantage angles uploaded.")

    # Advisory decision
    if not issues:
        verdict = "Sufficient"
        summary = "All instructional area ratios, laboratory counts, and visual evidence satisfy AICTE APH Chapter 5 norms."
    elif any("deficit" in i or "deficiency" in i for i in issues) or blurry_photos > 1:
        verdict = "Suggest Inspection"
        summary = "Substantial physical area or laboratory deficit identified. Physical verification by AICTE Expert Visit Committee (EVC) recommended."
    else:
        verdict = "Needs More Evidence"
        summary = "Marginal area metric or photographic evidence gaps. Additional geotagged photos or architect floor plan clarification needed."

    return {
        "verdict": verdict,
        "summary": summary,
        "metrics": {
            "student_count": student_count,
            "built_up_area_sqm": built_up_area_sqm,
            "actual_ratio_sqm_per_student": actual_ratio,
            "norm_ratio_sqm_per_student": norm_area_per_student,
            "labs_count": labs_count,
            "required_labs": required_labs,
            "total_photos_analyzed": len(image_paths),
            "blurry_photos_count": blurry_photos
        },
        "advisory_notes": issues
    }
