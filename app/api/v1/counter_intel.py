from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.counter_intel import (
    CompetitiveAttackRadar,
    DarknetMonitor,
    PsyopsDetector,
    get_competitive_attack_radar,
    get_darknet_monitor,
    get_psyops_detector,
)

router = APIRouter(prefix="/counter-intel", tags=["Контррозвідка"])

class LeakScanRequest(BaseModel):
    target_domain: str
    target_name: str

class AttackRadarRequest(BaseModel):
    target_entity: str
    keyword_alerts: list[str]
    current_market_prices: dict[str, float]

class PsyopsScanRequest(BaseModel):
    narrative_id: str
    posts: list[dict[str, Any]]

@router.post("/darknet/scan")
async def scan_darknet(
    data: LeakScanRequest,
    monitor: DarknetMonitor = Depends(get_darknet_monitor)
) -> dict[str, Any]:
    """Scans darknet resources for mention of the target (COMP-263).
    """
    result = monitor.scan_for_leaks(
        target_domain=data.target_domain,
        target_name=data.target_name
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/attack-radar/detect")
async def detect_attacks(
    data: AttackRadarRequest,
    radar: CompetitiveAttackRadar = Depends(get_competitive_attack_radar)
) -> dict[str, Any]:
    """Analyzes current data to detect dumping, black PR, etc (COMP-264).
    """
    result = radar.detect_attacks(
        target_entity=data.target_entity,
        keyword_alerts=data.keyword_alerts,
        current_market_prices=data.current_market_prices
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/psyops/analyze")
async def analyze_psyops(
    data: PsyopsScanRequest,
    detector: PsyopsDetector = Depends(get_psyops_detector)
) -> dict[str, Any]:
    """Analyzes a narrative for coordinated astroturfing or bot activity (COMP-268).
    """
    result = detector.analyze_narrative(
        narrative_id=data.narrative_id,
        posts=data.posts
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
