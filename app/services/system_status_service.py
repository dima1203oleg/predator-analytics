from __future__ import annotations

import asyncio
from datetime import datetime
import logging
from typing import Any, Dict

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.libs.core.database import get_db_ctx
from app.libs.core.models.entities import ETLJob
from app.services.diagnostics_service import DiagnosticsService
from app.services.evolution_service import evolution_service
from app.services.llm import llm_service
from app.services.monitoring_service import monitoring_service


logger = logging.getLogger("services.system_status")

class SystemStatusService:
    """V25 System Status & Intelligent Advisor.
    Aggregates infra metrics, backend health, and provides LLM-driven insights.
    """
    def __init__(self):
        self._diagnostics = DiagnosticsService()

    async def get_comprehensive_status(self) -> dict[str, Any]:
        """Runs diagnostics and combines with real-time metrics.
        Returns a rich state for the Omniscience dashboard.
        """
        start_time = datetime.now()

        # 1. Individual Resilience for each diagnostic task
        diag_res = {}
        try:
            diag_res = await self._diagnostics.run_full_diagnostics()
        except Exception as e:
            logger.error(f"Diagnostics failed: {e}")
            diag_res = {"infrastructure": {}, "ai_brain": {}, "overall_status": "OFFLINE"}

        prom_metrics = {"status": "offline", "cpu_load": 0, "memory_usage": 0}
        try:
            prom_metrics = await monitoring_service.get_system_metrics()
        except Exception as e:
            logger.error(f"Monitoring metrics failed: {e}")

        queues = []
        try:
            queues = await monitoring_service.get_queue_status()
        except Exception as e:
            logger.error(f"Queue status failed: {e}")

        # 2. Fetch Real-time ETL Status
        etl_status = {"etl_running": False, "global_progress": 0, "last_job": None}
        try:
            async with get_db_ctx() as sess:
                stmt = select(ETLJob).order_by(desc(ETLJob.created_at)).limit(1)
                res = await sess.execute(stmt)
                last_job = res.scalar_one_or_none()
                if last_job:
                    etl_status["last_job"] = {
                        "id": str(last_job.id),
                        "state": last_job.state,
                        "progress": last_job.progress,
                        "updated_at": last_job.updated_at.isoformat() if last_job.updated_at else None
                    }
                    if last_job.state not in ["COMPLETED", "FAILED", "CANCELLED"]:
                        etl_status["etl_running"] = True
                        etl_status["global_progress"] = last_job.progress.get("percent", 0) if last_job.progress else 0
        except Exception as e:
            logger.error(f"ETL status fetch failed: {e}")

        # 3. Fetch Evolution Experience
        evolution_data = {"experience": [], "cycle_count": 0}
        try:
            evolution_data["experience"] = await evolution_service.get_recent_experience(limit=10)
            stats = await evolution_service.get_latest_stats()
            evolution_data["cycle_count"] = stats.get("cycle_count", 0)
        except Exception as e:
            logger.error(f"Evolution status fetch failed: {e}")

        # 4. Calculate Global Health Score (0-100)
        health_score = 0.0
        try:
            health_score = self._calculate_health(diag_res, prom_metrics, queues)
        except Exception as e:
            logger.error(f"Health score calculation failed: {e}")

        # 5. Intelligent Advisor (LLM Insight)
        advisor_note = "System status: Partial Data Available."
        try:
            advisor_note = await self._generate_advisor_note(health_score, diag_res, prom_metrics)
        except Exception as e:
            logger.error(f"Advisor note generation failed: {e}")

        # 6. Lockdown Status
        is_lockdown = False
        try:
            from app.services.system_control_service import system_control_service
            is_lockdown = await system_control_service.is_lockdown()
        except Exception as e:
            logger.error(f"Lockdown check failed: {e}")

        return {
            "timestamp": datetime.now().isoformat(),
            "health_score": health_score,
            "advisor_note": advisor_note,
            "is_lockdown": is_lockdown,
            "infrastructure": diag_res.get("infrastructure", {}),
            "ai_brain": diag_res.get("ai_brain", {}),
            "data_pipeline": {
                **(diag_res.get("data_ingestion") if isinstance(diag_res.get("data_ingestion"), dict) else {}),
                **etl_status
            },
            "evolution": evolution_data,
            "realtime_metrics": prom_metrics,
            "active_queues": len(queues),
            "latency_ms": (datetime.now() - start_time).total_seconds() * 1000
        }

    def _calculate_health(self, diag: dict[str, Any], prom: dict[str, Any], queues: list[Any]) -> float:
        """Heuristic health score calculation."""
        score = 100.0

        # Infra Penalties
        if prom.get("status") == "offline": score -= 10
        if prom.get("cpu_load", 0) > 85: score -= 15
        if prom.get("memory_usage", 0) > 90: score -= 15

        # Brain Penalties
        ai = diag.get("ai_brain", {})
        if isinstance(ai, dict):
            for status in ai.values():
                if isinstance(status, dict) and status.get("status") != "OK":
                    score -= 10

        # Pipeline Penalties
        pipe = diag.get("data_ingestion", {})
        if isinstance(pipe, dict):
            if pipe.get("postgresql", {}).get("status") != "OK": score -= 30
            if pipe.get("minio", {}).get("status") != "OK": score -= 20

        return max(0.0, score)

    async def _generate_advisor_note(self, score: float, diag: dict[str, Any], prom: dict[str, Any]) -> str:
        """Synthesize a human-friendly advice based on data."""
        if score > 95:
            return "System optimal. All neural links stable. Proactive optimization cycle pending."

        # Collect anomalies
        anomalies = []
        cpu_load = prom.get("cpu_load", 0)
        if isinstance(cpu_load, (int, float)) and cpu_load > 70:
            anomalies.append(f"High CPU load ({cpu_load}%)")

        ai = diag.get("ai_brain", {})
        if isinstance(ai, dict):
            failed_models = [m for m, s in ai.items() if isinstance(s, dict) and s.get("status") != "OK"]
            if failed_models:
                anomalies.append(f"AI Model failures: {', '.join(failed_models)}")

        if not anomalies:
            return "System operational with minor latencies. Monitoring background processes."

        # Ask LLM to be a 'Systems Architect' and give a 1-sentence advice
        prompt = f"""
        System Health Score: {score}/100
        Anomalies detected: {'; '.join(anomalies)}

        Provide a ultra-concise (max 15 words) architectural advice for the operator.
        """

        try:
            res = await llm_service.generate_with_routing(
                prompt=prompt,
                system="Systems Architect Advisor Mode. Professional, brief, technical.",
                mode="fast"
            )
            return res.content if res.success else "Anomalies detected. Review diagnostics."
        except:
            return f"Strategic Attention Required: {anomalies[0]}."

system_status_service = SystemStatusService()

if __name__ == "__main__":
    async def test():
        status = await system_status_service.get_comprehensive_status()
        import json
        print(json.dumps(status, indent=2))

    asyncio.run(test())
