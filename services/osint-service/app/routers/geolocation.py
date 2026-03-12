"""Geolocation Router — геолокація та аналіз місцезнаходження."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.tools import get_tool_registry

router = APIRouter(prefix="/geolocation", tags=["Geolocation OSINT"])


# ======================== REQUEST MODELS ========================


class GeoIPRequest(BaseModel):
    """Запит на геолокацію IP."""

    ip: str = Field(..., description="IP адреса")
    include_asn: bool = Field(default=True)
    include_threat: bool = Field(default=True)


class CreepyRequest(BaseModel):
    """Запит на геолокацію з соцмереж."""

    target: str = Field(..., description="Username або URL зображення")
    source: str = Field(default="auto", description="twitter | instagram | flickr | exif | auto")
    build_timeline: bool = Field(default=True)


# ======================== ENDPOINTS ========================


@router.post("/ip")
async def geolocate_ip(request: GeoIPRequest):
    """Геолокація за IP адресою.

    Визначає:
    - Країна, місто, регіон
    - ISP, ASN
    - Координати
    - Threat intelligence

    Returns:
        Геолокація та мережева інформація
    """
    registry = get_tool_registry()
    geoip = registry.get("geoip")

    if not geoip:
        raise HTTPException(status_code=503, detail="GeoIP недоступний")

    result = await geoip.run_with_timeout(
        request.ip,
        options={
            "include_asn": request.include_asn,
            "include_threat": request.include_threat,
        },
    )

    return result.data


@router.post("/social")
async def geolocate_social(request: CreepyRequest):
    """Геолокація з соціальних мереж.

    Джерела:
    - Twitter (геотеги, фото)
    - Instagram (локації, фото)
    - Flickr (EXIF)
    - EXIF метадані зображень

    Returns:
        Локації та timeline переміщень
    """
    registry = get_tool_registry()
    creepy = registry.get("creepy")

    if not creepy:
        raise HTTPException(status_code=503, detail="Creepy недоступний")

    result = await creepy.run_with_timeout(
        request.target,
        options={
            "source": request.source,
            "build_timeline": request.build_timeline,
        },
    )

    return result.data


@router.post("/investigate")
async def investigate_location(target: str):
    """Комплексне розслідування локації.

    Для IP:
    - GeoIP lookup
    - ASN інформація
    - Threat intelligence

    Для username:
    - Соціальні мережі
    - Timeline переміщень
    - Патерни поведінки

    Returns:
        Повний аналіз локації
    """
    registry = get_tool_registry()
    results = {}
    all_findings = []

    # Визначаємо тип цілі
    import re
    is_ip = bool(re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", target))

    if is_ip:
        # GeoIP
        geoip = registry.get("geoip")
        if geoip:
            geo_result = await geoip.run_with_timeout(target)
            results["geoip"] = geo_result.data
            all_findings.extend(geo_result.findings)
    else:
        # Creepy (соцмережі)
        creepy = registry.get("creepy")
        if creepy:
            creepy_result = await creepy.run_with_timeout(target)
            results["social_locations"] = creepy_result.data
            all_findings.extend(creepy_result.findings)

    return {
        "target": target,
        "target_type": "ip" if is_ip else "username",
        "results": results,
        "findings": all_findings,
        "locations_found": len(all_findings),
    }


@router.get("/status")
async def get_geolocation_status():
    """Статус Geolocation інструментів."""
    registry = get_tool_registry()

    return {
        "tools": [
            {
                "name": "GeoIP",
                "id": "geoip",
                "available": registry.get("geoip") is not None,
                "description": "Геолокація за IP адресою",
            },
            {
                "name": "Creepy",
                "id": "creepy",
                "available": registry.get("creepy") is not None,
                "description": "Геолокація з соцмереж та EXIF",
            },
        ],
    }
