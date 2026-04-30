"""War Room API (Phase 12 — SM Edition).

Endpoints for Command Center, Attack Plans, and Shadow Cartography.
"""
from typing import Any

from fastapi import APIRouter

from app.services.intelligence import CommandCenter, ShadowCartography

router = APIRouter(prefix="/warroom-v2", tags=["Command Center & Shadow Cartography"])

_command = CommandCenter()
_shadow = ShadowCartography()


@router.get("/strategy/daily")
async def get_daily_strategy() -> dict[str, Any]:
    """Щоденна стратегія та ключові загрози."""
    return _command.generate_daily_strategy()


@router.post("/attack-plan/{target_edrpou}")
async def create_attack_plan(target_edrpou: str) -> dict[str, Any]:
    """Генерація плану реагування на загрозу."""
    return _command.create_attack_plan(target_edrpou)


@router.get("/shadow-map/company/{edrpou}")
async def get_shadow_map(edrpou: str) -> dict[str, Any]:
    """Тіньова карта зв'язків компанії."""
    return _shadow.generate_shadow_map(edrpou)


@router.get("/shadow-map/beneficiary/{person_id}")
async def track_beneficiary_assets(person_id: str) -> dict[str, Any]:
    """Відстеження активів кінцевого бенефіціара (вкл. приховані)."""
    return _shadow.track_beneficiary(person_id)
