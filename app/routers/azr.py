from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.libs.core.structured_logger import get_logger
from app.services.azr_engine_v32 import azr_engine_v32


logger = get_logger("azr_router")

router = APIRouter(prefix="/azr", tags=["AZR v32 - Sovereign Engine"])

# --- Models ---


class AzrStatus(BaseModel):
    """Schema for AZR Engine status."""
    status: str
    version: str
    health: str


class ChaosRequest(BaseModel):
    scenario: str
    duration_seconds: int = 30


class AlertRequest(BaseModel):
    message: str
    level: str = "info"


# --- Endpoints ---


@router.get("/status")
async def get_azr_status():
    """Get full AZR Engine status."""
    return azr_engine_v32.get_status()


@router.get("/health")
async def get_azr_health():
    """Get detailed health breakdown."""
    status = azr_engine_v32.get_status()
    return status.get("health_details", {})


@router.get("/anomalies")
async def get_azr_anomalies():
    """Get currently detected anomalies."""
    orientation = await azr_engine_v32._orient()  # Re-run orientation for fresh data
    return {"anomalies": orientation.get("anomalies", []), "trends": orientation.get("trends", {})}


@router.get("/experience")
async def get_experience_stats():
    """Get self-learning statistics."""
    return azr_engine_v32.memory.get_stats()


@router.get("/audit")
async def get_azr_audit(limit: int = 50):
    """Get AZR audit logs from Truth Ledger."""
    from app.libs.core.constitutional import get_ledger

    ledger = get_ledger()
    entries = ledger.get_entries(limit=limit)

    # Map to frontend format expected by SovereignAZRBrain.tsx
    return [
        {
            "sequence": e.get("id", 0),
            "time": e.get("timestamp", "").split("T")[-1][:8] if e.get("timestamp") else "00:00:00",
            "action": e.get("action", "UNKNOWN"),
            "details": {
                "message": f"{e.get('entity', '')} | {e.get('hash', '')}",
                "intent": e.get("action", "OODA Cycle"),
            },
        }
        for e in entries
    ]


@router.get("/decisions")
async def get_azr_decisions(limit: int = 20):
    """Get recent AZR decisions with logical reasoning and outcomes."""
    return azr_engine_v32.get_recent_decisions(limit=limit)


@router.post("/start")
async def start_engine(duration_hours: int = 24):
    """Start the autonomous engine loop."""
    await azr_engine_v32.start(duration_hours)
    return {"status": "started", "duration_hours": duration_hours}


@router.post("/stop")
async def stop_engine():
    """Stop the autonomous engine loop."""
    await azr_engine_v32.stop()
    return {"status": "stopped"}


@router.post("/freeze")
async def freeze_engine():
    """Emergency freeze of all autonomous actions."""
    # In v32, stop() effectively freezes action execution
    await azr_engine_v32.stop()
    logger.critical("AZR Engine FROZEN by user request")
    return {"status": "frozen"}


@router.post("/unfreeze")
async def unfreeze_engine():
    """Unfreeze and restart autonomous actions."""
    await azr_engine_v32.start()
    logger.info("AZR Engine UNFROZEN by user request")
    return {"status": "unfrozen"}


# --- Chaos Engineering ---


@router.post("/chaos/enable")
async def enable_chaos():
    """Enable chaos engineering module."""
    azr_engine_v32.chaos.enabled = True
    return {"status": "chaos_enabled"}


@router.post("/chaos/disable")
async def disable_chaos():
    """Disable chaos engineering module."""
    azr_engine_v32.chaos.enabled = False
    return {"status": "chaos_disabled"}


@router.post("/chaos/inject")
async def inject_chaos(request: ChaosRequest):
    """Manually inject a specific chaos scenario."""
    if not azr_engine_v32.chaos.enabled:
        raise HTTPException(status_code=400, detail="Chaos engine is disabled")

    return await azr_engine_v32.chaos._execute_scenario(request.scenario)


# --- Debug/Test ---


@router.post("/test/alert")
async def test_alert(request: AlertRequest):
    """Test Telegram alerting."""
    await azr_engine_v32._send_telegram_alert(request.message, request.level)
    return {"status": "sent"}
