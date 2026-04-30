from __future__ import annotations

"""Simulation Router - Demo/Testing data endpoints.

⚠️ WARNING: This router provides SIMULATED DATA for testing purposes only.
Do NOT use in production for real analytics.
"""
import random

from fastapi import APIRouter

router = APIRouter(prefix="/simulation", tags=["Simulation (Demo Only)"])


@router.get("/metrics")
async def get_simulated_metrics():
    """Get simulated metrics."""
    return {
        "cpu": random.randint(10, 80),
        "memory": random.randint(30, 70),
        "gpu": random.randint(0, 100),
        "network": {"ingress": random.uniform(10, 100), "egress": random.uniform(5, 50)},
    }


@router.get("/agents")
async def get_simulated_agents():
    """Get simulated agent data."""
    return [{"id": f"agent-{i}", "status": random.choice(["ACTIVE", "IDLE"])} for i in range(5)]
