from typing import Annotated, Any
from fastapi import APIRouter, Depends
from app.dependencies import get_tenant_id
from app.services.ukraine_registries import UkraineRegistriesService

router = APIRouter(prefix="/osint", tags=["OSINT"])

@router.get("/registries", summary="Статус підключення до реєстрів (для UI)")
async def get_osint_registries(
    service: Annotated[UkraineRegistriesService, Depends()],
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> dict[str, Any]:
    """Повертає статус усіх підключених реєстрів у форматі, який очікує UI."""
    return await service.get_registries_status()
