"""🧭 Навігація — /api/v1/navigation

Динамічна побудова sidebar на основі ролі та рівня підписки.
Повертає доступні та заблоковані модулі.
"""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.core.modules.registry import get_available_modules
from app.core.modules.types import SubscriptionTier

router = APIRouter(prefix="/navigation")


@router.get("/sidebar")
async def get_sidebar(
    role: str = Query(default="business", description="Роль користувача"),
    subscription_tier: str = Query(
        default="professional",
        description="Рівень підписки",
    ),
) -> dict:
    """Побудова sidebar навігації для поточного користувача.

    Повертає список доступних та заблокованих модулів
    відповідно до рівня підписки.
    """
    try:
        tier = SubscriptionTier(subscription_tier)
    except ValueError:
        tier = SubscriptionTier.BASIC

    available, locked = get_available_modules(tier)

    return {
        "available": [
            {
                "key": m.key.value,
                "icon": m.icon,
                "label": m.label,
                "path": m.path,
                "description": m.description,
            }
            for m in available
        ],
        "locked": [
            {
                "key": m.key.value,
                "icon": m.icon,
                "label": m.label,
                "path": m.path,
                "description": m.description,
                "locked": True,
                "required_tier": m.min_tier.value,
            }
            for m in locked
        ],
    }
