from typing import Dict, Optional
from app.models.risk import RiskAssessment
from app.database import db_session
from app.models.company import Company
from app.services.valkey_service import get_valkey_service
from sqlalchemy import select
import json


class RiskService:
    @staticmethod
    async def assess_risk(company_id: str) -> Optional[RiskAssessment]:
        """Оцінка ризику для компанії з кешуванням."""
        cache_key = f"risk:assessment:{company_id}"
        cached = await redis_client.get(cache_key)
        if cached:
            return RiskAssessment(**json.loads(cached))

        async with db_session() as session:
            company = await session.get(Company, company_id)
            if not company:
                return None

            # Логіка розрахунку ризику
            risk_score = await RiskService._calculate_risk_score(company)
            risk_assessment = RiskAssessment(
                company_id=company_id,
                risk_score=risk_score,
                risk_level=RiskService._get_risk_level(risk_score),
            )

            # Кешування на 1 годину
            await redis_client.setex(cache_key, 3600, risk_assessment.json())
            return risk_assessment

    @staticmethod
    async def _calculate_risk_score(company: Company) -> float:
        """Розрахунок ризику на основі даних компанії."""
        # Приклад: розрахунок ризику на основі фінансових показників
        financial_risk = company.debt_to_equity * 0.3
        compliance_risk = 0.5 if company.has_sanctions else 0.1
        return financial_risk + compliance_risk

    @staticmethod
    def _get_risk_level(score: float) -> str:
        """Визначення рівня ризику."""
        if score > 0.8:
            return "high"
        elif score > 0.5:
            return "medium"
        else:
            return "low"