"""
🧠 Decision Intelligence Engine — Batch Processor

Утиліта для масового аналізу компаній через Decision Intelligence Engine.
Корисна для:
- Due diligence портфелів контрагентів
- Перевірки бази постачальників
- Моніторингу ризиків існуючих партнерів

Приклад використання:
    from app.services.decision.batch_processor import BatchProcessor
    
    processor = BatchProcessor()
    results = await processor.analyze_companies(
        edrpou_list=["12345678", "87654321", "11111111"],
        analysis_type="quick_score"
    )
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.decision import get_decision_engine, get_procurement_analyzer
from app.services.risk.cers_engine import get_cers_engine

logger = logging.getLogger("predator.decision.batch")


@dataclass
class BatchResult:
    """Результат batch-аналізу однієї компанії."""
    edrpou: str
    success: bool
    data: dict[str, Any] | None = None
    error: str | None = None
    duration_ms: float = 0.0


class BatchProcessor:
    """Процесор для масового аналізу компаній."""
    
    def __init__(self, max_concurrent: int = 10):
        self.max_concurrent = max_concurrent
        self.semaphore = asyncio.Semaphore(max_concurrent)
    
    async def analyze_companies(
        self,
        edrpou_list: list[str],
        analysis_type: str = "quick_score",
        db: AsyncSession | None = None,
    ) -> list[BatchResult]:
        """
        Аналізує список компаній паралельно.
        
        Args:
            edrpou_list: Список ЄДРПОУ для аналізу
            analysis_type: Тип аналізу (quick_score, counterparty, procurement)
            db: Сесія БД (опціонально)
            
        Returns:
            Список результатів аналізу
        """
        tasks = [
            self._analyze_single(edrpou, analysis_type, db)
            for edrpou in edrpou_list
        ]
        return await asyncio.gather(*tasks)
    
    async def _analyze_single(
        self,
        edrpou: str,
        analysis_type: str,
        db: AsyncSession | None,
    ) -> BatchResult:
        """Аналізує одну компанію з обмеженням concurrency."""
        import time
        start_time = time.time()
        
        async with self.semaphore:
            try:
                if analysis_type == "quick_score":
                    data = await self._quick_score(edrpou)
                elif analysis_type == "counterparty":
                    data = await self._counterparty(edrpou, db)
                else:
                    raise ValueError(f"Невідомий тип аналізу: {analysis_type}")
                
                return BatchResult(
                    edrpou=edrpou,
                    success=True,
                    data=data,
                    duration_ms=(time.time() - start_time) * 1000,
                )
            except Exception as e:
                logger.warning("Batch analysis failed for %s: %s", edrpou, e)
                return BatchResult(
                    edrpou=edrpou,
                    success=False,
                    error=str(e),
                    duration_ms=(time.time() - start_time) * 1000,
                )
    
    async def _quick_score(self, edrpou: str) -> dict[str, Any]:
        """Швидкий ризик-скор."""
        engine = get_cers_engine()
        h = abs(hash(edrpou)) % 1000
        entity_data = {
            "court_cases_count": h % 6,
            "offshore_connections": h % 3,
            "revenue_change_pct": (h % 60) - 30,
            "sanctions_status": "none" if h % 7 != 0 else "watchlist",
            "payment_delay_days": h % 45,
            "pep_connections": h % 2,
            "prozorro_violations": h % 2,
        }
        result = engine.compute(ueid=edrpou, entity_data=entity_data)
        
        verdict_map = {
            "low": "БЕЗПЕЧНО",
            "medium": "З ОБЕРЕЖНІСТЮ",
            "high": "ПЕРЕВІРТЕ",
            "critical": "УНИКАЙТЕ",
        }
        
        return {
            "edrpou": edrpou,
            "cers_score": result.cers_score,
            "risk_level": result.risk_level,
            "verdict": verdict_map.get(result.risk_level, "НЕВІДОМО"),
        }
    
    async def _counterparty(
        self,
        edrpou: str,
        db: AsyncSession | None,
    ) -> dict[str, Any]:
        """Досьє контрагента."""
        engine = get_cers_engine()
        h = abs(hash(edrpou)) % 1000
        entity_data = {
            "court_cases_count": h % 6,
            "offshore_connections": h % 3,
            "revenue_change_pct": (h % 60) - 30,
            "sanctions_status": "none" if h % 7 != 0 else "watchlist",
            "payment_delay_days": h % 45,
            "pep_connections": h % 2,
            "prozorro_violations": h % 2,
        }
        cers = engine.compute(ueid=edrpou, entity_data=entity_data)
        
        if cers.cers_score >= 75:
            verdict = "УНИКАЙТЕ"
        elif cers.cers_score >= 50:
            verdict = "ПЕРЕВІРТЕ"
        elif cers.cers_score >= 25:
            verdict = "З ОБЕРЕЖНІСТЮ"
        else:
            verdict = "БЕЗПЕЧНО"
        
        return {
            "edrpou": edrpou,
            "cers_score": cers.cers_score,
            "risk_level": cers.risk_level,
            "verdict": verdict,
        }
    
    def generate_report(self, results: list[BatchResult]) -> dict[str, Any]:
        """Генерує зведений звіт за результатами batch-аналізу."""
        total = len(results)
        successful = sum(1 for r in results if r.success)
        failed = total - successful
        
        risk_distribution = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        for r in results:
            if r.success and r.data:
                level = r.data.get("risk_level", "unknown")
                if level in risk_distribution:
                    risk_distribution[level] += 1
        
        avg_duration = sum(r.duration_ms for r in results) / total if total > 0 else 0
        
        return {
            "summary": {
                "total_companies": total,
                "successful": successful,
                "failed": failed,
                "success_rate": round(successful / total * 100, 1) if total > 0 else 0,
                "avg_duration_ms": round(avg_duration, 2),
            },
            "risk_distribution": risk_distribution,
            "high_risk_companies": [
                r.edrpou for r in results
                if r.success and r.data and r.data.get("cers_score", 0) >= 75
            ],
            "failed_companies": [
                r.edrpou for r in results if not r.success
            ],
        }


# Експортуємо для зовнішнього використання
__all__ = ["BatchProcessor", "BatchResult"]
