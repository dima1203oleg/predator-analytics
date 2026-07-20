"""Watchlist Router — API ендпоїнти для управління моніторингом.

Ендпоїнти:
- POST /watchlist — Додати сутність на моніторинг
- GET /watchlist — Отримати список моніторингу
- DELETE /watchlist/{item_id} — Видалити з моніторингу
- GET /watchlist/alerts — Отримати алерти
- GET /watchlist/alerts/stats — Статистика алертів
- POST /watchlist/alerts/{alert_id}/read — Позначити як прочитаний
- POST /watchlist/alerts/read-all — Позначити всі як прочитані
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.watchlist_service import WatchlistService

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


# ── Pydantic моделі ──

class WatchlistAddRequest(BaseModel):
    """Запит на додавання сутності до watchlist."""
    entity_id: str = Field(..., description="Унікальний ідентифікатор сутності (ЄДРПОУ, ІПН, тощо)")
    entity_type: str = Field(default="company", description="Тип сутності: company, person, cryptowallet")
    entity_name: str = Field(..., description="Назва сутності для відображення")
    frequency: str = Field(default="daily", description="Частота перевірки: hourly, daily, weekly, monthly")
    notes: str | None = Field(default=None, description="Нотатки аналітика")
    tags: list[str] | None = Field(default=None, description="Теги для категоризації")


class AlertReadRequest(BaseModel):
    """Запит на позначення алерту як прочитаного."""
    alert_id: str


# ── Ендпоїнти ──

@router.post("", summary="Додати на моніторинг")
async def add_to_watchlist(
    req: WatchlistAddRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Додати сутність до списку безперервного моніторингу.
    
    Система автоматично перескановуватиме цю сутність згідно
    з вказаною частотою та генеруватиме алерти при змінах.
    """
    # TODO: Отримати tenant_id та user_id з JWT токена
    tenant_id = "00000000-0000-0000-0000-000000000001"
    user_id = "00000000-0000-0000-0000-000000000001"

    return await WatchlistService.add_to_watchlist(
        db=db,
        tenant_id=tenant_id,
        user_id=user_id,
        entity_id=req.entity_id,
        entity_type=req.entity_type,
        entity_name=req.entity_name,
        frequency=req.frequency,
        notes=req.notes,
        tags=req.tags,
    )


@router.get("", summary="Список моніторингу")
async def get_watchlist(
    include_inactive: bool = Query(False, description="Включити деактивовані"),
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """Отримати всі об'єкти під моніторингом для поточного тенанта."""
    tenant_id = "00000000-0000-0000-0000-000000000001"

    return await WatchlistService.get_watchlist(
        db=db,
        tenant_id=tenant_id,
        include_inactive=include_inactive,
    )


@router.delete("/{item_id}", summary="Видалити з моніторингу")
async def remove_from_watchlist(
    item_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Деактивувати об'єкт моніторингу (soft delete)."""
    tenant_id = "00000000-0000-0000-0000-000000000001"

    return await WatchlistService.remove_from_watchlist(
        db=db,
        tenant_id=tenant_id,
        item_id=item_id,
    )


@router.get("/alerts", summary="Алерти моніторингу")
async def get_alerts(
    unread_only: bool = Query(False, description="Тільки непрочитані"),
    severity: str | None = Query(None, description="Фільтр за severity: critical, high, medium, low, info"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Отримати алерти з пагінацією та фільтрами."""
    tenant_id = "00000000-0000-0000-0000-000000000001"

    return await WatchlistService.get_alerts(
        db=db,
        tenant_id=tenant_id,
        unread_only=unread_only,
        severity=severity,
        limit=limit,
        offset=offset,
    )


@router.get("/alerts/stats", summary="Статистика алертів")
async def get_alert_stats(
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Кількість непрочитаних алертів за severity для badge counters."""
    tenant_id = "00000000-0000-0000-0000-000000000001"

    return await WatchlistService.get_alert_stats(
        db=db,
        tenant_id=tenant_id,
    )


@router.post("/alerts/{alert_id}/read", summary="Позначити алерт прочитаним")
async def mark_alert_read(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Позначити конкретний алерт як прочитаний."""
    tenant_id = "00000000-0000-0000-0000-000000000001"

    return await WatchlistService.mark_alert_read(
        db=db,
        tenant_id=tenant_id,
        alert_id=alert_id,
    )


@router.post("/alerts/read-all", summary="Позначити всі прочитаними")
async def mark_all_alerts_read(
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Позначити всі алерти тенанта як прочитані."""
    tenant_id = "00000000-0000-0000-0000-000000000001"

    return await WatchlistService.mark_all_read(
        db=db,
        tenant_id=tenant_id,
    )
