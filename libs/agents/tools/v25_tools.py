
import logging
import asyncio
from typing import Dict, Any
from .registry import registry

logger = logging.getLogger("tools.v25")

@registry.register(name="get_v25_pulse", description="Get real-time system pulse score and health status from v25 Aggregator")
async def get_v25_pulse() -> str:
    """
    Retrieve current health score, active alerts, and degradation reasons.
    """
    try:
        # Dynamic import to avoid circular dependency
        from app.services.health_aggregator import health_aggregator
        pulse = await health_aggregator.get_system_pulse()
        import json
        return json.dumps(pulse, indent=2)
    except Exception as e:
        return f"Error fetching pulse: {e}"

@registry.register(name="manage_simulation", description="Manage Digital Twin simulations (start_stress_test, list_simulations)")
async def manage_simulation(action: str, target: str = "backend", intensity: float = 0.5) -> str:
    """
    Start or list digital twin simulations.
    Actions: start_stress_test, list_simulations, get_status
    """
    try:
        from app.services.simulation_service import simulation_service
        import json

        if action == "start_stress_test":
            res = await simulation_service.run_stress_test(target, intensity)
            return json.dumps(res, indent=2)
        elif action == "list_simulations":
            res = simulation_service.list_simulations()
            return json.dumps(res, indent=2)
        elif action == "get_status":
            res = simulation_service.get_status()
            return json.dumps(res, indent=2)
        else:
             return f"Unknown action: {action}"
    except Exception as e:
        return f"Simulation error: {e}"

@registry.register(name="trigger_guardian_recovery", description="Manually trigger the Self-Healing Guardian recovery loop")
async def trigger_guardian_recovery() -> str:
    """
    Force the Guardian to run its auto-recovery logic immediately.
    """
    try:
        from libs.core.guardian import guardian
        import json
        res = await guardian.run_auto_recovery()
        return json.dumps(res, indent=2)
    except Exception as e:
        return f"Guardian trigger failed: {e}"
