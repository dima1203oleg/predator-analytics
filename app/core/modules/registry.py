"""Реєстр модулів PREDATOR Analytics v4.1.

Керує конфігурацією модулів, їх метаданими та доступністю.
Використовується для побудови динамічної навігації sidebar.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.core.modules.types import (
    TIER_ORDER,
    ModuleKey,
    SubscriptionTier,
)


@dataclass(frozen=True)
class ModuleInfo:
    """Метадані одного модуля платформи."""

    key: ModuleKey
    icon: str
    label: str  # Українською
    path: str
    description: str  # Українською
    min_tier: SubscriptionTier


# Канонічний реєстр усіх модулів (порядок = порядок у sidebar)
MODULE_REGISTRY: list[ModuleInfo] = [
    ModuleInfo(
        key=ModuleKey.MARKET,
        icon="📊",
        label="Ринок",
        path="/market",
        description="Аналітика ринку та поточних митних даних",
        min_tier=SubscriptionTier.BASIC,
    ),
    ModuleInfo(
        key=ModuleKey.FORECAST,
        icon="📈",
        label="Прогнози",
        path="/forecast",
        description="Прогнозування даних для прийняття рішень",
        min_tier=SubscriptionTier.PROFESSIONAL,
    ),
    ModuleInfo(
        key=ModuleKey.DILIGENCE,
        icon="🔍",
        label="Due Diligence",
        path="/diligence",
        description="Ризик-аналіз компаній та партнерів",
        min_tier=SubscriptionTier.PROFESSIONAL,
    ),
    ModuleInfo(
        key=ModuleKey.MONITORING,
        icon="📡",
        label="Моніторинг",
        path="/monitoring",
        description="Відстеження змін у реальному часі",
        min_tier=SubscriptionTier.PROFESSIONAL,
    ),
    ModuleInfo(
        key=ModuleKey.SIMULATOR,
        icon="🧪",
        label="Симулятор",
        path="/simulator",
        description='Моделювання сценаріїв «що-якщо»',
        min_tier=SubscriptionTier.ENTERPRISE,
    ),
    ModuleInfo(
        key=ModuleKey.ALERTS,
        icon="🚨",
        label="Алерти",
        path="/alerts",
        description="Налаштування сповіщень та тригерів",
        min_tier=SubscriptionTier.PROFESSIONAL,
    ),
    ModuleInfo(
        key=ModuleKey.REPORTS,
        icon="📑",
        label="Звіти",
        path="/reports",
        description="Генерація та управління звітами",
        min_tier=SubscriptionTier.PROFESSIONAL,
    ),
    ModuleInfo(
        key=ModuleKey.COPILOT,
        icon="🤖",
        label="AI Копілот",
        path="/copilot",
        description="Природномовний інтерфейс для аналізу даних",
        min_tier=SubscriptionTier.PROFESSIONAL,
    ),
    ModuleInfo(
        key=ModuleKey.AGENTS,
        icon="🦾",
        label="AI Агенти",
        path="/agents",
        description="Автономні агенти для складних аналітичних задач",
        min_tier=SubscriptionTier.ENTERPRISE,
    ),
]


def get_available_modules(
    user_tier: SubscriptionTier,
) -> tuple[list[ModuleInfo], list[ModuleInfo]]:
    """Повертає (доступні, заблоковані) модулі для рівня підписки.

    Args:
        user_tier: Рівень підписки користувача.

    Returns:
        Tuple з двох списків: доступні та заблоковані модулі.

    """
    user_level = TIER_ORDER[user_tier]
    available: list[ModuleInfo] = []
    locked: list[ModuleInfo] = []

    for module in MODULE_REGISTRY:
        required_level = TIER_ORDER[module.min_tier]
        if user_level >= required_level:
            available.append(module)
        else:
            locked.append(module)

    return available, locked
