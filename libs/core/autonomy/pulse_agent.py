import asyncio
import logging
from typing import Any

try:
    from libs.core.autonomy.agent_base import AutonomousAgent
except ImportError:
    from .agent_base import AutonomousAgent

logger = logging.getLogger("predator.autonomy.pulse")


class SystemPulseAgent(AutonomousAgent):
    """Agent responsible for monitoring system health and performing
    self-healing actions like service restarts or clearing caches.
    """

    def __init__(self, api_base_url: str = "http://localhost:8000"):
        super().__init__(
            name="SystemPulse_v45", capabilities=["health_monitor", "service_control", "self_heal"]
        )
        self.api_base_url = api_base_url.rstrip("/")

    async def observe(self) -> Any:
        """Poll the system/status endpoint to get latest health state."""
        try:
            import httpx

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_base_url}/api/v1/system/status", timeout=5.0
                )
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            logger.error(f"PulseAgent observe failed: {e}")
        return None

    async def analyze(self, observation: dict[str, Any]) -> dict[str, Any]:
        """Determine if any component needs healing."""
        plan: dict[str, Any] = {"should_act": False, "actions": []}

        pulse = observation.get("pulse", {})
        status = pulse.get("status", "UNKNOWN")

        if status != "HEALTHY":
            plan["should_act"] = True
            reasons = pulse.get("reasons", [])
            plan["actions"].append(
                {
                    "type": "log_degradation",
                    "details": f"System status {status}. Reasons: {reasons}",
                }
            )

            if any("Database" in str(r) for r in reasons):
                plan["actions"].append({"type": "restart_component", "target": "postgres"})

        sys_metrics = observation.get("system", {})
        if sys_metrics.get("cpu_percent", 0) > 95:
            plan["should_act"] = True
            plan["actions"].append({"type": "throttle_pipelines", "reason": "High CPU load"})

        return plan

    async def act(self, plan: dict[str, Any]) -> Any:
        """Execute self-healing actions."""
        actions: list[dict[str, Any]] = plan.get("actions", [])
        for action in actions:
            action_type = action.get("type")
            target = action.get("target")

            logger.warning(f"ACTING: {action_type} on {target or 'system'}")

            if action_type == "log_degradation":
                logger.error(f"Autonomous Healing required: {action.get('details')}")

            elif action_type == "restart_component":
                logger.info(f"Simulating restart of {target}...")
                await asyncio.sleep(1)

            elif action_type == "throttle_pipelines":
                logger.info("Throttling data ingestion pipelines to save CPU.")

        return True
