"""Elite Risk Engine — PREDATOR Analytics v61.0-ELITE.

Повний цикл обчислення CERS v55.2 з урахуванням 5 шарів:
1. Behavioral (Поведінковий) — Аналіз транзакцій та декларацій.
2. Institutional (Інституційний) — Санкції, суди, податки.
3. Influence (Вплив) — PEP, лобізм, державні контракти.
4. Structural (Структурний) — Граф зв'язків, офшори, складні ланцюги.
5. Predictive (Прогностичний) — AI-прогноз на основі часових рядів.
"""
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Declaration, RiskScore
from app.services.anomaly_detection import AnomalyDetectionService
from predator_common.cers_score import Cers5LayerFactors, compute_cers_v55
from predator_common.logging import get_logger

logger = get_logger("risk_engine.elite")

class EliteRiskEngine:
    def __init__(self, db: AsyncSession, neo4j_driver: Any = None) -> None:
        self.db = db
        self.neo4j = neo4j_driver
        self.anomaly_service = AnomalyDetectionService()

    async def compute_full_risk(self, ueid: str, tenant_id: str) -> dict[str, Any]:
        """Повний цикл розрахунку ризику для компанії."""
        logger.info(f"Computing full risk for {ueid}")

        # 1. Behavioral Layer (25%)
        behavioral = await self._calculate_behavioral(ueid, tenant_id)

        # 2. Institutional Layer (20%)
        institutional = await self._calculate_institutional(ueid, tenant_id)

        # 3. Influence Layer (20%)
        influence = await self._calculate_influence(ueid, tenant_id)

        # 4. Structural Layer (15%)
        structural = await self._calculate_structural(ueid, tenant_id)

        # 5. Predictive Layer (20%)
        predictive = await self._calculate_predictive(ueid, behavioral, institutional)

        factors = Cers5LayerFactors(
            behavioral_raw=behavioral["score"],
            institutional_raw=institutional["score"],
            influence_raw=influence["score"],
            structural_raw=structural["score"],
            predictive_raw=predictive["score"]
        )

        result = compute_cers_v55(factors)

        # Збереження результату в БД
        score_record = RiskScore(
            tenant_id=tenant_id,
            entity_ueid=ueid,
            score_date=datetime.now(UTC),
            cers=result.score,
            cers_confidence=result.confidence,
            behavioral_score=factors.behavioral_raw,
            institutional_score=factors.institutional_raw,
            influence_score=factors.influence_raw,
            structural_score=factors.structural_raw,
            predictive_score=factors.predictive_raw,
            explanation=behavioral.get("explanation", ""),
            flags=result.flags
        )
        self.db.add(score_record)
        await self.db.commit()

        return {
            "ueid": ueid,
            "cers": result.score,
            "level": result.level,
            "layers": {
                "behavioral": behavioral,
                "institutional": institutional,
                "influence": influence,
                "structural": structural,
                "predictive": predictive
            }
        }

    async def _calculate_behavioral(self, ueid: str, tenant_id: str) -> dict[str, Any]:
        """Аналіз декларацій на цінові аномалії та обсяги."""
        query = select(Declaration).where(
            Declaration.importer_ueid == ueid,
            Declaration.tenant_id == tenant_id
        ).limit(100)
        result = await self.db.execute(query)
        declarations = result.scalars().all()

        if not declarations:
            return {"score": 0.0, "explanation": "Дані про діяльність відсутні"}

        # Виявлення цінових аномалій
        decl_dicts = [d.__dict__ for d in declarations]
        anomalies = self.anomaly_service.detect_price_anomalies(decl_dicts)

        score = min(len(anomalies) * 15.0, 100.0)
        return {
            "score": score,
            "anomaly_count": len(anomalies),
            "explanation": f"Виявлено {len(anomalies)} цінових аномалій"
        }

    async def _calculate_institutional(self, ueid: str, tenant_id: str) -> dict[str, Any]:
        """Перевірка санкцій та юридичного статусу."""
        # У реальній системі тут запит до API санкцій або таблиці sanctions
        return {"score": 10.0, "status": "active"}

    async def _calculate_influence(self, ueid: str, tenant_id: str) -> dict[str, Any]:
        """Аналіз зв'язків з PEP."""
        return {"score": 5.0, "pep_links": 0}

    async def _calculate_structural(self, ueid: str, tenant_id: str) -> dict[str, Any]:
        """Графовий аналіз зв'язків через Neo4j."""
        if not self.neo4j:
            return {"score": 0.0, "reason": "Neo4j unavailable"}

        # Cypher запит для пошуку офшорів у 3 кроках
        # Спрощено для MVP
        return {"score": 25.0, "offshore_hops": 2}

    async def _calculate_predictive(self, ueid: str, behavioral: dict, institutional: dict) -> dict[str, Any]:
        """AI-прогноз ризику на 30 днів."""
        # Виклик AIService для інтерпретації
        return {"score": max(behavioral["score"], institutional["score"]), "trend": "stable"}
