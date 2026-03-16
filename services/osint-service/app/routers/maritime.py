"""Maritime OSINT Router — відстеження суден, контейнерів, портів."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.tools import get_tool_registry

router = APIRouter(prefix="/maritime", tags=["Maritime OSINT"])


# ======================== REQUEST MODELS ========================


class VesselSearchRequest(BaseModel):
    """Запит на пошук судна."""

    query: str = Field(..., description="MMSI, IMO або назва судна")
    search_type: str | None = Field(default=None, description="mmsi | imo | name")
    include_history: bool = Field(default=True)
    include_ownership: bool = Field(default=True)
    include_ais_gaps: bool = Field(default=True)
    history_days: int = Field(default=90, ge=1, le=365)


class ContainerSearchRequest(BaseModel):
    """Запит на пошук контейнера."""

    container_number: str = Field(..., description="Номер контейнера (напр. MAEU1234567)")
    include_history: bool = Field(default=True)
    include_vessel: bool = Field(default=True)


class PortAnalysisRequest(BaseModel):
    """Запит на аналіз порту."""

    port_code: str = Field(..., description="UN/LOCODE порту (напр. UAODS)")
    include_vessels: bool = Field(default=True)
    include_statistics: bool = Field(default=True)
    include_trade_flows: bool = Field(default=True)


# ======================== ENDPOINTS ========================


@router.post("/vessel/search")
async def search_vessel(request: VesselSearchRequest):
    """Пошук та розслідування судна.

    Можливості:
    - Пошук за MMSI, IMO або назвою
    - Історія портових заходів
    - Аналіз AIS gaps (підозрілі вимкнення)
    - Ланцюг власності
    - Санкційний статус

    Returns:
        Детальна інформація про судно
    """
    registry = get_tool_registry()
    vessel_tracker = registry.get("vessel_tracker")

    if not vessel_tracker:
        raise HTTPException(status_code=503, detail="Vessel Tracker недоступний")

    result = await vessel_tracker.run_with_timeout(
        request.query,
        options={
            "search_type": request.search_type,
            "include_history": request.include_history,
            "include_ownership": request.include_ownership,
            "include_ais_gaps": request.include_ais_gaps,
            "history_days": request.history_days,
        },
    )

    return {
        "status": result.status.value,
        "data": result.data,
        "findings": result.findings,
        "duration_seconds": result.duration_seconds,
    }


@router.get("/vessel/{identifier}")
async def get_vessel_info(identifier: str):
    """Швидкий пошук судна за MMSI або IMO.

    Args:
        identifier: MMSI (9 цифр) або IMO (7 цифр)
    """
    registry = get_tool_registry()
    vessel_tracker = registry.get("vessel_tracker")

    result = await vessel_tracker.run_with_timeout(identifier)

    return result.data


@router.post("/container/track")
async def track_container(request: ContainerSearchRequest):
    """Відстеження контейнера.

    Можливості:
    - Поточний статус та локація
    - Історія переміщень
    - Інформація про судно
    - Аналіз ризиків

    Returns:
        Дані контейнера та історія
    """
    registry = get_tool_registry()
    container_tracker = registry.get("container_tracker")

    if not container_tracker:
        raise HTTPException(status_code=503, detail="Container Tracker недоступний")

    result = await container_tracker.run_with_timeout(
        request.container_number,
        options={
            "include_history": request.include_history,
            "include_vessel": request.include_vessel,
        },
    )

    return {
        "status": result.status.value,
        "data": result.data,
        "findings": result.findings,
        "duration_seconds": result.duration_seconds,
    }


@router.get("/container/{container_number}")
async def get_container_status(container_number: str):
    """Швидкий статус контейнера.

    Args:
        container_number: Номер контейнера (напр. MAEU1234567)
    """
    registry = get_tool_registry()
    container_tracker = registry.get("container_tracker")

    result = await container_tracker.run_with_timeout(container_number)

    return result.data


@router.post("/port/analyze")
async def analyze_port(request: PortAnalysisRequest):
    """Аналіз порту.

    Можливості:
    - Інформація про порт
    - Судна в порту
    - Статистика трафіку
    - Торгові потоки
    - Санкційний статус

    Returns:
        Аналітика порту
    """
    registry = get_tool_registry()
    port_intel = registry.get("port_intel")

    if not port_intel:
        raise HTTPException(status_code=503, detail="Port Intel недоступний")

    result = await port_intel.run_with_timeout(
        request.port_code,
        options={
            "include_vessels": request.include_vessels,
            "include_statistics": request.include_statistics,
            "include_trade_flows": request.include_trade_flows,
        },
    )

    return {
        "status": result.status.value,
        "data": result.data,
        "findings": result.findings,
        "duration_seconds": result.duration_seconds,
    }


@router.get("/port/{port_code}")
async def get_port_info(port_code: str):
    """Швидка інформація про порт.

    Args:
        port_code: UN/LOCODE порту (напр. UAODS, NLRTM)
    """
    registry = get_tool_registry()
    port_intel = registry.get("port_intel")

    result = await port_intel.run_with_timeout(port_code)

    return result.data


@router.get("/ports/ukraine")
async def get_ukraine_ports():
    """Список українських портів."""
    return {
        "ports": [
            {"code": "UAODS", "name": "Одеса", "status": "operational"},
            {"code": "UAILK", "name": "Чорноморськ", "status": "operational"},
            {"code": "UAPVL", "name": "Південний", "status": "operational"},
            {"code": "UAMKP", "name": "Миколаїв", "status": "limited"},
            {"code": "UAKHE", "name": "Херсон", "status": "occupied"},
            {"code": "UABRP", "name": "Бердянськ", "status": "occupied"},
            {"code": "UAMRP", "name": "Маріуполь", "status": "occupied"},
        ],
    }


@router.get("/ais/stream")
async def get_ais_stream_info():
    """Інформація про AIS Stream API."""
    registry = get_tool_registry()
    ais_stream = registry.get("ais_stream")

    is_available = await ais_stream.is_available() if ais_stream else False

    return {
        "service": "AISStream.io",
        "is_configured": is_available,
        "capabilities": [
            "Real-time vessel positions",
            "Historical track data",
            "Port arrivals/departures",
            "Vessel metadata",
        ],
        "documentation": "https://aisstream.io/documentation",
    }
