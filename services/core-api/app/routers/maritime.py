"""Maritime & Aviation Router — Відстеження суден та літаків.

Endpoints:
- /vessels — Судна (AIS)
- /aircraft — Літаки (ADS-B)
- /area — Пошук у районі
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.permissions import Permission
from app.dependencies import PermissionChecker, get_tenant_id
from app.services.maritime_aviation import MaritimeAviationService

router = APIRouter(prefix="/maritime", tags=["морський та авіаційний моніторинг"])


# ======================== REQUEST MODELS ========================


class AreaSearchRequest(BaseModel):
    """Запит на пошук у районі."""

    lat_min: float = Field(..., ge=-90, le=90, description="Мінімальна широта")
    lat_max: float = Field(..., ge=-90, le=90, description="Максимальна широта")
    lon_min: float = Field(..., ge=-180, le=180, description="Мінімальна довгота")
    lon_max: float = Field(..., ge=-180, le=180, description="Максимальна довгота")
    include_vessels: bool = Field(default=True, description="Включити судна")
    include_aircraft: bool = Field(default=True, description="Включити літаки")


# ======================== VESSELS ========================


@router.get("/vessels/{mmsi}", summary="Позиція судна")
async def get_vessel_position(
    mmsi: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримати поточну позицію судна за MMSI.

    MMSI (Maritime Mobile Service Identity) — унікальний 9-значний ідентифікатор судна.
    """
    service = MaritimeAviationService()
    try:
        position = await service.marine_client.get_vessel_position(mmsi)
        if not position:
            raise HTTPException(status_code=404, detail=f"Судно з MMSI {mmsi} не знайдено")

        return {
            "mmsi": position.mmsi,
            "imo": position.imo,
            "name": position.name,
            "callsign": position.callsign,
            "vessel_type": position.vessel_type.value,
            "flag": position.flag,
            "position": {
                "latitude": position.latitude,
                "longitude": position.longitude,
            },
            "navigation": {
                "speed_knots": position.speed,
                "course": position.course,
                "heading": position.heading,
            },
            "destination": position.destination,
            "eta": position.eta.isoformat() if position.eta else None,
            "draught": position.draught,
            "timestamp": position.timestamp.isoformat(),
        }
    finally:
        await service.close()


@router.get("/vessels/{mmsi}/info", summary="Інформація про судно")
async def get_vessel_info(
    mmsi: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримати детальну інформацію про судно."""
    service = MaritimeAviationService()
    try:
        info = await service.marine_client.get_vessel_info(mmsi)
        if not info:
            raise HTTPException(status_code=404, detail=f"Судно з MMSI {mmsi} не знайдено")

        return {
            "mmsi": info.mmsi,
            "imo": info.imo,
            "name": info.name,
            "callsign": info.callsign,
            "vessel_type": info.vessel_type.value,
            "flag": info.flag,
            "dimensions": {
                "gross_tonnage": info.gross_tonnage,
                "deadweight": info.deadweight,
                "length_m": info.length,
                "beam_m": info.beam,
            },
            "year_built": info.year_built,
            "ownership": {
                "owner": info.owner,
                "manager": info.manager,
                "insurer": info.insurer,
            },
        }
    finally:
        await service.close()


@router.get("/vessels/{mmsi}/history", summary="Історія заходів у порти")
async def get_vessel_port_calls(
    mmsi: str,
    days: Annotated[int, Query(ge=1, le=365)] = 90,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримати історію заходів судна у порти."""
    service = MaritimeAviationService()
    try:
        port_calls = await service.marine_client.get_port_calls(mmsi, days)

        return {
            "mmsi": mmsi,
            "period_days": days,
            "total_calls": len(port_calls),
            "port_calls": [
                {
                    "port_name": pc.port_name,
                    "port_code": pc.port_code,
                    "country": pc.country,
                    "arrival": pc.arrival.isoformat() if pc.arrival else None,
                    "departure": pc.departure.isoformat() if pc.departure else None,
                    "duration_hours": pc.duration_hours,
                }
                for pc in port_calls
            ],
        }
    finally:
        await service.close()


@router.get("/vessels/{mmsi}/full", summary="Повне відстеження судна")
async def track_vessel_full(
    mmsi: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Повне відстеження судна: позиція, інформація, історія портів."""
    service = MaritimeAviationService()
    try:
        result = await service.track_vessel(mmsi)
        return result
    finally:
        await service.close()


# ======================== AIRCRAFT ========================


@router.get("/aircraft/{registration}", summary="Позиція літака")
async def get_aircraft_position(
    registration: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримати поточну позицію літака за реєстраційним номером.

    Приклад: UR-PSA, N12345, G-ABCD
    """
    service = MaritimeAviationService()
    try:
        position = await service.flight_client.get_aircraft_position(registration)
        if not position:
            raise HTTPException(status_code=404, detail=f"Літак {registration} не знайдено")

        return {
            "icao24": position.icao24,
            "callsign": position.callsign,
            "registration": position.registration,
            "aircraft_type": position.aircraft_type,
            "position": {
                "latitude": position.latitude,
                "longitude": position.longitude,
                "altitude_ft": position.altitude,
            },
            "navigation": {
                "speed_knots": position.speed,
                "heading": position.heading,
                "vertical_rate_fpm": position.vertical_rate,
            },
            "route": {
                "origin": position.origin,
                "destination": position.destination,
            },
            "on_ground": position.on_ground,
            "timestamp": position.timestamp.isoformat(),
        }
    finally:
        await service.close()


@router.get("/aircraft/{registration}/history", summary="Історія польотів")
async def get_flight_history(
    registration: str,
    days: Annotated[int, Query(ge=1, le=90)] = 30,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримати історію польотів літака."""
    service = MaritimeAviationService()
    try:
        history = await service.flight_client.get_flight_history(registration, days)

        return {
            "registration": registration,
            "period_days": days,
            "total_flights": len(history),
            "flights": history,
        }
    finally:
        await service.close()


@router.get("/aircraft/{registration}/full", summary="Повне відстеження літака")
async def track_aircraft_full(
    registration: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Повне відстеження літака: позиція та історія польотів."""
    service = MaritimeAviationService()
    try:
        result = await service.track_aircraft(registration)
        return result
    finally:
        await service.close()


# ======================== AREA SEARCH ========================


@router.post("/area/search", summary="Пошук у районі")
async def search_area(
    request: AreaSearchRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Пошук суден та літаків у заданому географічному районі.

    Координати задаються у форматі WGS84 (широта/довгота).
    """
    service = MaritimeAviationService()
    try:
        result = await service.search_area(
            lat_min=request.lat_min,
            lat_max=request.lat_max,
            lon_min=request.lon_min,
            lon_max=request.lon_max,
            include_vessels=request.include_vessels,
            include_aircraft=request.include_aircraft,
        )

        return {
            "bounds": result["bounds"],
            "vessels": {
                "count": len(result["vessels"]),
                "items": result["vessels"],
            },
            "aircraft": {
                "count": len(result["aircraft"]),
                "items": result["aircraft"],
            },
        }
    finally:
        await service.close()


# ======================== PREDEFINED AREAS ========================


@router.get("/area/black-sea", summary="Чорне море")
async def search_black_sea(
    include_vessels: bool = True,
    include_aircraft: bool = False,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Пошук суден у Чорному морі."""
    service = MaritimeAviationService()
    try:
        result = await service.search_area(
            lat_min=41.0,
            lat_max=46.5,
            lon_min=27.5,
            lon_max=42.0,
            include_vessels=include_vessels,
            include_aircraft=include_aircraft,
        )

        return {
            "region": "Чорне море",
            "bounds": result["bounds"],
            "vessels": {
                "count": len(result["vessels"]),
                "items": result["vessels"],
            },
            "aircraft": {
                "count": len(result["aircraft"]),
                "items": result["aircraft"],
            } if include_aircraft else None,
        }
    finally:
        await service.close()


@router.get("/area/ukraine-ports", summary="Порти України")
async def search_ukraine_ports(
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Пошук суден біля портів України."""
    service = MaritimeAviationService()
    try:
        # Одеса, Чорноморськ, Південний, Миколаїв
        result = await service.search_area(
            lat_min=46.0,
            lat_max=47.0,
            lon_min=30.5,
            lon_max=32.0,
            include_vessels=True,
            include_aircraft=False,
        )

        return {
            "region": "Порти України",
            "ports": ["Одеса", "Чорноморськ", "Південний", "Миколаїв"],
            "bounds": result["bounds"],
            "vessels": {
                "count": len(result["vessels"]),
                "items": result["vessels"],
            },
        }
    finally:
        await service.close()


@router.get("/area/bosphorus", summary="Босфор")
async def search_bosphorus(
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Пошук суден у протоці Босфор."""
    service = MaritimeAviationService()
    try:
        result = await service.search_area(
            lat_min=40.9,
            lat_max=41.3,
            lon_min=28.9,
            lon_max=29.2,
            include_vessels=True,
            include_aircraft=False,
        )

        return {
            "region": "Протока Босфор",
            "bounds": result["bounds"],
            "vessels": {
                "count": len(result["vessels"]),
                "items": result["vessels"],
            },
        }
    finally:
        await service.close()
