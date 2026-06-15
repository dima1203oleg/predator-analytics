"""UBO & Footprint Router — PREDATOR Analytics v55.1 Ironclad.
"""
from typing import Any

from fastapi import APIRouter, HTTPException

from app.services.beneficial_owner import BeneficialOwnerService
from app.services.digital_footprint import DigitalFootprintService

router = APIRouter()

@router.get("/ubo/{ueid}")
async def get_beneficiaries(ueid: str, tenant_id: str = "default") -> list[dict[str, Any]]:
    """Пошук кінцевих бенефіціарів (UBO) з % впливу."""
    try:
        return await BeneficialOwnerService.get_ultimate_beneficiaries(ueid, tenant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/owners/{ueid}")
async def get_direct_owners(ueid: str, tenant_id: str = "default") -> list[dict[str, Any]]:
    """Пошук прямих власників 1-го рівня."""
    try:
        return await BeneficialOwnerService.get_direct_owners(ueid, tenant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/crypto/{wallet}")
async def get_crypto_footprint(wallet: str, tenant_id: str = "default") -> list[dict[str, Any]]:
    """Взаємодія криптогаманців із сутностями."""
    try:
        return await DigitalFootprintService.track_crypto(wallet, tenant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/domain/{domain}")
async def get_domain_footprint(domain: str, tenant_id: str = "default") -> list[dict[str, Any]]:
    """Користувачі поштових доменів та їхні зв'язки."""
    try:
        return await DigitalFootprintService.match_domain_to_entities(domain, tenant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
