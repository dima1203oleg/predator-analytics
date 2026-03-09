"""
Premium Features API (Phase 9 — SM Edition).

Endpoints for Document Generation, Dossiers, and Macroeconomic Climate.
"""
from fastapi import APIRouter
from typing import Any

from app.services.premium_engine import DossierMachine, ClimateIndex

router = APIRouter(prefix="/premium-v2", tags=["Premium Features & Reports"])

_dossier = DossierMachine()
_climate = ClimateIndex()


@router.get("/dossier/templates")
async def get_dossier_templates() -> list[dict[str, str]]:
    """Отримати список доступних шаблонів для досьє."""
    return _dossier.get_templates()


@router.post("/dossier/generate")
async def generate_company_dossier(ueid: str, format_type: str = "pdf") -> dict[str, Any]:
    """Згенерувати досьє компанії (Enterprise/Government)."""
    return _dossier.generate_dossier(ueid, format_type)


@router.get("/climate/national")
async def get_national_climate_index() -> dict[str, Any]:
    """Отримати національний кліматичний індекс."""
    return _climate.get_national_climate()


@router.get("/climate/region/{region_code}")
async def get_regional_climate_index(region_code: str) -> dict[str, Any]:
    """Отримати кліматичний індекс за регіоном."""
    return _climate.get_regional_climate(region_code)
