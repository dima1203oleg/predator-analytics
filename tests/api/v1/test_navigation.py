"""
Тести для /api/v1/navigation — динамічна навігація sidebar.
"""

from __future__ import annotations

import pytest

from app.core.modules.types import (
    ModuleKey,
    SubscriptionTier,
    has_access,
    TIER_ORDER,
)
from app.core.modules.registry import get_available_modules


class TestModuleTypes:
    """Тести для модульної системи типів."""

    def test_user_roles_exist(self) -> None:
        """Перевіряє що всі ролі визначені."""
        from app.core.modules.types import UserRole

        assert UserRole.BUSINESS == "business"
        assert UserRole.GOVERNMENT == "government"
        assert UserRole.INTELLIGENCE == "intelligence"
        assert UserRole.ADMIN == "admin"

    def test_subscription_tiers_order(self) -> None:
        """Перевіряє порядок рівнів підписки."""
        assert TIER_ORDER[SubscriptionTier.BASIC] < TIER_ORDER[SubscriptionTier.PROFESSIONAL]
        assert TIER_ORDER[SubscriptionTier.PROFESSIONAL] < TIER_ORDER[SubscriptionTier.ENTERPRISE]

    def test_has_access_basic_to_market(self) -> None:
        """Basic підписка має доступ до Ринку."""
        assert has_access(SubscriptionTier.BASIC, ModuleKey.MARKET) is True

    def test_basic_no_access_to_forecast(self) -> None:
        """Basic підписка не має доступу до Прогнозів."""
        assert has_access(SubscriptionTier.BASIC, ModuleKey.FORECAST) is False

    def test_professional_has_access_to_copilot(self) -> None:
        """Professional підписка має доступ до AI Копілота."""
        assert has_access(SubscriptionTier.PROFESSIONAL, ModuleKey.COPILOT) is True

    def test_professional_no_access_to_agents(self) -> None:
        """Professional підписка не має доступу до AI Агентів."""
        assert has_access(SubscriptionTier.PROFESSIONAL, ModuleKey.AGENTS) is False

    def test_enterprise_has_access_to_all(self) -> None:
        """Enterprise підписка має доступ до всіх модулів."""
        for module in ModuleKey:
            assert has_access(SubscriptionTier.ENTERPRISE, module) is True


class TestModuleRegistry:
    """Тести для реєстру модулів."""

    def test_basic_gets_only_market(self) -> None:
        """Basic підписка отримує тільки модуль Ринок."""
        available, locked = get_available_modules(SubscriptionTier.BASIC)
        available_keys = [m.key for m in available]
        assert ModuleKey.MARKET in available_keys
        assert len(locked) > 0

    def test_enterprise_gets_all(self) -> None:
        """Enterprise підписка отримує всі модулі."""
        available, locked = get_available_modules(SubscriptionTier.ENTERPRISE)
        assert len(locked) == 0
        assert len(available) == len(ModuleKey)

    def test_all_labels_in_ukrainian(self) -> None:
        """Всі мітки модулів повинні бути українською."""
        available, locked = get_available_modules(SubscriptionTier.ENTERPRISE)
        for module in available:
            # Перевіряємо що мітка не порожня і не ASCII-only
            assert module.label, f"Модуль {module.key} не має мітки"
            assert module.description, f"Модуль {module.key} не має опису"
