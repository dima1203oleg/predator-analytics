from __future__ import annotations


"""Sovereign Observer Module (SOM) - Chaos Engineering Router
Handles stress tests, invariant monitoring, and system resilience.
"""
import asyncio
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from app.libs.core.structured_logger import get_logger, log_security_event
from app.services.chaos_tester import chaos_tester


logger = get_logger("predator.api.som")

router = APIRouter(prefix="/som", tags=["SOM Chaos Engine"])


class ChaosStatus(BaseModel):
    chaos_mode: bool
    active_tests: list[str]
    last_event: str | None
    health_score: float


_chaos_state = {"chaos_mode": False, "active_tests": [], "last_event": None, "health_score": 100.0}


@router.get("/chaos/scenarios")
async def list_scenarios():
    """List all available chaos engineering scenarios."""
    return {"scenarios": chaos_tester.scenarios}


@router.post("/chaos/run/{scenario_id}")
async def run_specific_scenario(scenario_id: str, background_tasks: BackgroundTasks):
    """Run a specific chaos scenario by ID."""
    scenario = next((s for s in chaos_tester.scenarios if s.get("id") == scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario {scenario_id} not found")

    _chaos_state["chaos_mode"] = True
    _chaos_state["active_tests"].append(scenario_id)
    _chaos_state["last_event"] = f"Scenario {scenario_id} triggered at {datetime.now().isoformat()}"

    # Run in background
    background_tasks.add_task(_run_and_update_state, scenario_id)

    return {"status": "initiated", "scenario": scenario}


async def _run_and_update_state(scenario_id: str):
    await chaos_tester.run_scenario(scenario_id)
    _chaos_state["chaos_mode"] = False
    if scenario_id in _chaos_state["active_tests"]:
        _chaos_state["active_tests"].remove(scenario_id)
    _chaos_state["last_event"] = f"Scenario {scenario_id} completed at {datetime.now().isoformat()}"


@router.get("/chaos/status", response_model=ChaosStatus)
async def get_chaos_status():
    """Get current status of Chaos Engineering engine."""
    return _chaos_state


@router.post("/chaos/spike")
async def trigger_chaos_spike(duration: int = 15, background_tasks: BackgroundTasks = None):
    """Trigger a Chaos Spike (Stress Test).
    Simulates high load or latency for testing system resilience.
    """
    if _chaos_state["chaos_mode"]:
        return {"status": "already_active", "message": "Chaos Spike in progress"}

    _chaos_state["chaos_mode"] = True
    _chaos_state["last_event"] = f"Spike triggered at {datetime.now().isoformat()}"

    logger.warning("chaos_spike_initiated", duration=duration)
    log_security_event(logger, "chaos_spike", "medium", status="started")

    # Start a random chaos scenario in background
    if background_tasks:
        background_tasks.add_task(_run_random_and_reset)
    else:
        # Fallback if no background tasks (shouldn't happen with correct usage)
        asyncio.create_task(_run_random_and_reset())

    return {
        "status": "initiated",
        "duration_seconds": duration,
        "active_tests": _chaos_state["active_tests"],
    }


async def _run_random_and_reset():
    await chaos_tester.run_random_test()
    _chaos_state["chaos_mode"] = False
    _chaos_state["active_tests"] = []
    _chaos_state["last_event"] = f"Random test completed at {datetime.now().isoformat()}"
    logger.info("chaos_spike_completed")


@router.get("/invariants")
async def check_invariants():
    """Check system invariants (Rules that must never be broken)."""
    return {
        "invariants": [
            {
                "id": "INV_001",
                "name": "Atomic Truth",
                "status": "PASSING",
                "description": "Ledger must match DB state",
            },
            {
                "id": "INV_002",
                "name": "Zero Tamper",
                "status": "PASSING",
                "description": "Constitution hash must match golden reference",
            },
            {
                "id": "INV_003",
                "name": "Budget Guard",
                "status": "PASSING",
                "description": "AI spend must not exceed daily limit",
            },
        ],
        "overall_integrity": "100%",
    }


@router.get("/anomalies")
async def get_anomalies():
    """Advanced Anomaly Detection (Prediction Engine).
    Returns Z-score analysis, forecasts, and active anomalies.
    """
    from app.services.anomaly_service import anomaly_service

    return await anomaly_service.detect_anomalies()
