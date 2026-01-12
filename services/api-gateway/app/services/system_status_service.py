import logging
import asyncio
from datetime import datetime
from typing import Dict, Any

from app.services.monitoring_service import monitoring_service
from app.services.diagnostics_service import DiagnosticsService
from app.services.llm import llm_service

logger = logging.getLogger("services.system_status")

class SystemStatusService:
    """
    V25 System Status & Intelligent Advisor.
    Aggregates infra metrics, backend health, and provides LLM-driven insights.
    """
    def __init__(self):
        self._diagnostics = DiagnosticsService()

    async def get_comprehensive_status(self) -> Dict[str, Any]:
        """
        Runs diagnostics and combines with real-time metrics.
        Returns a rich state for the Omniscience dashboard.
        """
        start_time = datetime.now()

        # 1. Parallel Data Collection
        tasks = [
            self._diagnostics.run_full_diagnostics(),
            monitoring_service.get_system_metrics(),
            monitoring_service.get_queue_status()
        ]
        results = await asyncio.gather(*tasks)

        diag_res = results[0]
        prom_metrics = results[1]
        queues = results[2]

        # 2. Calculate Global Health Score (0-100)
        health_score = self._calculate_health(diag_res, prom_metrics, queues)

        # 3. Intelligent Advisor (LLM Insight)
        advisor_note = await self._generate_advisor_note(health_score, diag_res, prom_metrics)

        # 4. Lockdown Status
        from app.services.system_control_service import system_control_service
        is_lockdown = await system_control_service.is_lockdown()

        return {
            "timestamp": datetime.now().isoformat(),
            "health_score": health_score,
            "advisor_note": advisor_note,
            "is_lockdown": is_lockdown,
            "infrastructure": diag_res.get("infrastructure", {}),
            "ai_brain": diag_res.get("ai_brain", {}),
            "data_pipeline": diag_res.get("data_ingestion", {}),
            "realtime_metrics": prom_metrics,
            "active_queues": len(queues),
            "latency_ms": (datetime.now() - start_time).total_seconds() * 1000
        }

    def _calculate_health(self, diag: Dict, prom: Dict, queues: list) -> float:
        """Heuristic health score calculation"""
        score = 100.0

        # Infra Penalties
        if prom.get("status") == "offline": score -= 10
        if prom.get("cpu_load", 0) > 85: score -= 15
        if prom.get("memory_usage", 0) > 90: score -= 15

        # Brain Penalties
        ai = diag.get("ai_brain", {})
        for model, status in ai.items():
            if status.get("status") != "OK":
                score -= 10

        # Pipeline Penalties
        pipe = diag.get("data_ingestion", {})
        if pipe.get("postgresql", {}).get("status") != "OK": score -= 30
        if pipe.get("minio", {}).get("status") != "OK": score -= 20

        return max(0.0, score)

    async def _generate_advisor_note(self, score: float, diag: Dict, prom: Dict) -> str:
        """Synthesize a human-friendly advice based on data"""
        if score > 95:
            return "System optimal. All neural links stable. Proactive optimization cycle pending."

        # Collect anomalies
        anomalies = []
        if prom.get("cpu_load", 0) > 70: anomalies.append(f"High CPU load ({prom['cpu_load']}%)")

        ai = diag.get("ai_brain", {})
        failed_models = [m for m, s in ai.items() if s.get("status") != "OK"]
        if failed_models: anomalies.append(f"AI Model failures: {', '.join(failed_models)}")

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
