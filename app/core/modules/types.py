"""Канонічні типи модульної системи PREDATOR Analytics v4.1.

Визначає ролі користувачів, рівні підписки та ключі модулів.
Використовується для побудови динамічної навігації та RBAC.
"""

from __future__ import annotations

from enum import StrEnum


class UserRole(StrEnum):
    """Ролі користувачів системи."""

    BUSINESS = "business"
    GOVERNMENT = "government"
    INTELLIGENCE = "intelligence"
    BANKING = "banking"
    MEDIA = "media"
    ADMIN = "admin"


class SubscriptionTier(StrEnum):
    """Рівні підписки (визначають доступні модулі)."""

    BASIC = "basic"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class ModuleKey(StrEnum):
    """Ключі доступних модулів платформи."""

    MARKET = "market"
    FORECAST = "forecast"
    DILIGENCE = "diligence"
    MONITORING = "monitoring"
    SIMULATOR = "simulator"
    ALERTS = "alerts"
    REPORTS = "reports"
    COPILOT = "copilot"
    AGENTS = "agents"


# Мінімальний рівень підписки для кожного модуля
MODULE_ACCESS: dict[ModuleKey, SubscriptionTier] = {
    ModuleKey.MARKET: SubscriptionTier.BASIC,
    ModuleKey.FORECAST: SubscriptionTier.PROFESSIONAL,
    ModuleKey.DILIGENCE: SubscriptionTier.PROFESSIONAL,
    ModuleKey.MONITORING: SubscriptionTier.PROFESSIONAL,
    ModuleKey.SIMULATOR: SubscriptionTier.ENTERPRISE,
    ModuleKey.ALERTS: SubscriptionTier.PROFESSIONAL,
    ModuleKey.REPORTS: SubscriptionTier.PROFESSIONAL,
    ModuleKey.COPILOT: SubscriptionTier.PROFESSIONAL,
    ModuleKey.AGENTS: SubscriptionTier.ENTERPRISE,
}

# Порядок рівнів підписки (для порівняння)
TIER_ORDER: dict[SubscriptionTier, int] = {
    SubscriptionTier.BASIC: 0,
    SubscriptionTier.PROFESSIONAL: 1,
    SubscriptionTier.ENTERPRISE: 2,
}


def has_access(
    user_tier: SubscriptionTier,
    module: ModuleKey,
) -> bool:
    """Перевіряє чи має користувач доступ до модуля."""
    required = MODULE_ACCESS.get(module, SubscriptionTier.ENTERPRISE)
    return TIER_ORDER[user_tier] >= TIER_ORDER[required]
