from datetime import datetime, UTC
import random
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/ooda", tags=["OODA Radar"])

class OodaStatusResponse(BaseModel):
    timestamp: str
    cycle_time_ms: int
    phases: dict[str, dict[str, float]]
    alerts: list[str]

@router.get("/status", response_model=OodaStatusResponse)
async def get_ooda_status():
    """
    Returns the real-time status of the OODA loop phases.
    This is currently a mocked implementation for the AI Factory integration.
    """
    # Mock data for OODA phases
    phases = {
        "observe": {"latency_ms": random.uniform(10, 50), "health": 0.99},
        "orient": {"latency_ms": random.uniform(50, 150), "health": 0.95},
        "decide": {"latency_ms": random.uniform(100, 300), "health": 0.98},
        "act": {"latency_ms": random.uniform(20, 80), "health": 0.99},
        "feedback": {"latency_ms": random.uniform(10, 40), "health": 1.0}
    }
    
    total_cycle = sum(p["latency_ms"] for p in phases.values())
    
    alerts = []
    if phases["orient"]["health"] < 0.96:
        alerts.append("Orient phase health is degraded.")
        
    return OodaStatusResponse(
        timestamp=datetime.now(UTC).isoformat(),
        cycle_time_ms=int(total_cycle),
        phases=phases,
        alerts=alerts
    )
