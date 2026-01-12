
import asyncio
import logging
import time
from typing import Dict, Any, List
from datetime import datetime
import psutil
import random

from .monitoring_service import monitoring_service
from .training_status_service import training_status_service
from .simulation_service import simulation_service
from libs.core.logger import setup_logger

logger = setup_logger("predator.backend.health_aggregator")

class HealthAggregatorService:
    """
    V25 Canonical Health Aggregator.
    Collects data from all system components to produce a unified Health Score.
    """

    def __init__(self):
        self.last_score = 100
        self.last_update = 0
        self.cached_pulse = {}
        self._alerts = []

    async def get_system_pulse(self) -> Dict[str, Any]:
        """
        Calculates the overall system pulse including health score,
        active alerts, and resource utilization.
        """
        now = time.time()
        # Rate limit calculation to once every 2 seconds
        if now - self.last_update < 2 and self.cached_pulse:
            return self.cached_pulse

        try:
            # 1. Gather component status
            metrics = await monitoring_service.get_realtime_metrics()
            training = await training_status_service.get_latest_status()
            sim_status = simulation_service.get_status("ongoing_stress_test") if hasattr(simulation_service, 'get_status') else {"status": "idle"}

            # 2. Infrastructure metrics
            cpu = psutil.cpu_percent()
            memory = psutil.virtual_memory().percent

            # 3. Calculate Health Score
            score = 100
            reasons = []

            # Resource penalties
            if cpu > 90:
                score -= 20
                reasons.append("High CPU Load")
            if memory > 90:
                score -= 20
                reasons.append("High Memory Pressure")

            # Service penalties
            services = metrics.get("services", {})
            for svc, status in services.items():
                if not status:
                    score -= 15
                    reasons.append(f"Service Offline: {svc}")

            # Queues penalties
            queues = metrics.get("queues", [])
            for q in queues:
                if q.get("messages", 0) > 5000:
                    score -= 10
                    reasons.append(f"Queue Congestion: {q.get('name')}")

            # Simulation effects (Simulation can temporarily lower health to test response)
            if sim_status and sim_status.get("status") == "running":
                sim_impact = sim_status.get("config", {}).get("intensity", 0) * 0.1
                score -= sim_impact
                reasons.append(f"Simulation Active: {sim_status.get('type')}")

            score = max(0, min(100, score))
            self.last_score = score

            # 4. Filter and manage alerts
            # We only keep active alerts
            self._generate_auto_alerts(reasons)

            # 5. Autonomous Arbitration (v25 Premium)
            if score < 40 and now - getattr(self, 'last_intervention', 0) > 300:
                self.last_intervention = now
                asyncio.create_task(self._trigger_autonomous_fix(reasons))

            pulse = {
                "score": round(score, 1),
                "status": "HEALTHY" if score > 80 else ("DEGRADED" if score > 40 else "CRITICAL"),
                "reasons": reasons,
                "timestamp": datetime.utcnow().isoformat(),
                "metrics": {
                    "cpu": cpu,
                    "memory": memory,
                    "active_threads": psutil.Process().num_threads()
                },
                "components": {
                    "monitoring": "OK",
                    "training": training.get("status", "unknown"),
                    "simulation": sim_status.get("status", "idle")
                },
                "alerts": self._alerts[-5:] # Latest 5 alerts
            }

            self.cached_pulse = pulse
            self.last_update = now
            return pulse

        except Exception as e:
            logger.error(f"Failed to aggregate health: {e}")
            return {"score": 0, "status": "ERROR", "error": str(e)}

    async def _trigger_autonomous_fix(self, reasons: List[str]):
        """
        Escalates critical issues to Trinity Agent for autonomous arbitration.
        """
        logger.warning(f"🚨 SYSTEM CRITICAL! Escalating to Trinity Agent for Arbitration: {reasons}")
        try:
            from .triple_agent_service import triple_agent_service
            command = f"Arbitration needed. SYSTEM_SCORE < 40. Issues: {reasons}. Run diagnostics and fix_issue recursively until healthy."
            # Fire and forget (it will log its own progress)
            asyncio.create_task(triple_agent_service.process_command(command))
        except Exception as e:
            logger.error(f"Failed to trigger autonomous fix: {e}")

    def _generate_auto_alerts(self, reasons: List[str]):
        """Internal alerting logic based on health reasons"""
        import uuid
        current_titles = [a['title'] for a in self._alerts]

        for reason in reasons:
            if reason not in current_titles:
                self._alerts.append({
                    "id": str(uuid.uuid4()),
                    "title": reason,
                    "severity": "high" if "Offline" in reason or "Critical" in reason else "warning",
                    "timestamp": datetime.utcnow().isoformat(),
                    "acknowledged": False
                })

        # Cleanup acknowledged/old alerts if needed
        if len(self._alerts) > 50:
            self._alerts = self._alerts[-50:]

health_aggregator = HealthAggregatorService()
