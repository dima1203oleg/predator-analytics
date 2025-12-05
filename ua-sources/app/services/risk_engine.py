"""
Risk Engine Service - Risk assessment and scoring
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class RiskLevel(Enum):
    MINIMAL = "MINIMAL"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class RiskAssessment:
    entity: str
    risk_level: RiskLevel
    score: float  # 0.0 to 1.0
    factors: List[str]
    mitigations: List[str]
    timestamp: datetime


class RiskEngine:
    """
    Risk Assessment Engine
    Evaluates entities based on multiple risk factors
    """
    
    def __init__(self):
        self.risk_weights = {
            "tax_debt": 0.3,
            "court_cases": 0.25,
            "sanctions": 0.35,
            "age": 0.05,
            "activity": 0.05
        }
    
    async def assess(
        self,
        entity_id: str,
        entity_data: Dict[str, Any]
    ) -> RiskAssessment:
        """
        Perform risk assessment on an entity
        
        Args:
            entity_id: EDRPOU or entity identifier
            entity_data: Data collected about the entity
        """
        factors = []
        mitigations = []
        score = 0.0
        
        # Check tax status
        if entity_data.get("tax_debtor"):
            score += self.risk_weights["tax_debt"]
            factors.append("Has tax debts")
        else:
            mitigations.append("No tax debts recorded")
        
        # Check court cases
        court_cases = entity_data.get("court_cases", 0)
        if court_cases > 0:
            case_score = min(court_cases * 0.05, self.risk_weights["court_cases"])
            score += case_score
            factors.append(f"{court_cases} court cases found")
        else:
            mitigations.append("No court cases found")
        
        # Check sanctions
        if entity_data.get("sanctioned"):
            score += self.risk_weights["sanctions"]
            factors.append("Entity is sanctioned")
        
        # Company age check
        years_active = entity_data.get("years_active", 5)
        if years_active < 2:
            score += self.risk_weights["age"]
            factors.append("Company less than 2 years old")
        else:
            mitigations.append(f"Established company ({years_active} years)")
        
        # Determine risk level
        risk_level = self._score_to_level(score)
        
        return RiskAssessment(
            entity=entity_id,
            risk_level=risk_level,
            score=score,
            factors=factors,
            mitigations=mitigations,
            timestamp=datetime.utcnow()
        )
    
    def _score_to_level(self, score: float) -> RiskLevel:
        """Convert numeric score to risk level"""
        if score < 0.1:
            return RiskLevel.MINIMAL
        elif score < 0.3:
            return RiskLevel.LOW
        elif score < 0.5:
            return RiskLevel.MEDIUM
        elif score < 0.7:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL
    
    async def batch_assess(
        self,
        entities: List[Dict[str, Any]]
    ) -> List[RiskAssessment]:
        """Assess multiple entities"""
        results = []
        for entity in entities:
            entity_id = entity.get("edrpou", entity.get("id", "unknown"))
            assessment = await self.assess(entity_id, entity)
            results.append(assessment)
        return results


# Singleton instance
risk_engine = RiskEngine()
