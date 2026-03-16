"""Axiom Verifier Service — PREDATOR Analytics v55.2-SM-EXTENDED.
Constitutional Integrity Check: Верифікація системних аксіом та консистентності даних.
"""
import logging
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.graph import graph_db

logger = logging.getLogger("core_api.axioms")

class AxiomVerifier:
    @staticmethod
    async def verify_data_consistency(db: AsyncSession) -> dict[str, Any]:
        """Перевіряє базові аксіоми консистентності між SQL та Graph DB.
        """
        try:
            # Аксіома 1: Кожна компанія в SQL повинна мати вузол в Графі
            sql_count_res = await db.execute(text("SELECT count(*) FROM companies"))
            sql_count = sql_count_res.scalar()

            graph_count_query = "MATCH (c:Company) RETURN count(c) as count"
            graph_res = await graph_db.run_query(graph_count_query)
            graph_count = graph_res[0].get("count", 0)

            purity: float = (graph_count / sql_count * 100) if sql_count > 0 else 100.0

            return {
                "axiom": "SQL_GRAPH_SYNC",
                "status": "PASS" if purity > 95 else "FAIL",
                "purity": round(purity, 2),
                "details": f"SQL: {sql_count}, Graph: {graph_count}"
            }
        except Exception as e:
            logger.error(f"Axiom verification failed: {e!s}")
            return {"axiom": "SQL_GRAPH_SYNC", "status": "ERROR", "msg": str(e)}

    @staticmethod
    async def run_full_audit(db: AsyncSession) -> list[dict[str, Any]]:
        """Запуск повного аудиту цілісності."""
        results = []
        # Додаємо перевірку синхронізації
        results.append(await AxiomVerifier.verify_data_consistency(db))

        # Аксіома 2: Відсутність циклів власності "сам на себе"
        graph_cycle_query = "MATCH (c:Company)-[:OWNED_BY]->(c) RETURN c.ueid as ueid"
        cycles = await graph_db.run_query(graph_cycle_query)
        results.append({
            "axiom": "NO_SELF_OWNERSHIP",
            "status": "PASS" if not cycles else "FAIL",
            "violations": len(cycles)
        })

        return results
