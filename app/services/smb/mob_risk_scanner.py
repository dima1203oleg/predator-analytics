import logging
from typing import Dict, Any, List
import random

logger = logging.getLogger(__name__)

class MobRiskScanner:
    """
    Mobilization Risk Scanner (COMP-213)
    Analyzes personnel structure and demographic data to assess 
    the operational impact of potential mobilization on a business entity.
    """
    def __init__(self):
        pass

    def scan_risk(self, company_id: str, personnel_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Assesses mobilization risk based on age, specialty, and critical position status.
        """
        if not personnel_data:
            return {"risk_level": "unknown", "critical_staff_vulnerability": 0.0}

        total_staff = len(personnel_data)
        vulnerable_staff = 0
        critical_vulnerable = 0

        for person in personnel_data:
            # Logic: Male, certain age range, not 'reserved' (bronovan)
            if person.get("gender") == "M" and 25 <= person.get("age", 0) <= 60:
                if not person.get("is_reserved", False):
                    vulnerable_staff += 1
                    if person.get("is_critical_specialist", False):
                        critical_vulnerable += 1

        vulnerability_score = (vulnerable_staff / total_staff) * 100
        critical_vulnerability = (critical_vulnerable / total_staff) * 100 if total_staff > 0 else 0

        risk_level = "low"
        if vulnerability_score > 50 or critical_vulnerability > 20:
            risk_level = "high"
        elif vulnerability_score > 25:
            risk_level = "medium"

        return {
            "company_id": company_id,
            "risk_level": risk_level,
            "vulnerability_score": f"{vulnerability_score:.1f}%",
            "critical_staff_vulnerability": f"{critical_vulnerability:.1f}%",
            "recommendations": [
                "Apply for personnel reservation (bronyuvannya).",
                "Start talent pipeline for critical positions.",
                "Implement remote work where possible to mitigate regional risks."
            ] if risk_level != "low" else ["Monitor legislative changes."]
        }
