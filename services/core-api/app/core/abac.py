"""Attribute-Based Access Control (ABAC) — PREDATOR Analytics (T2.2).

Реалізація ABAC політик розширеної безпеки згідно TZ §3.3.
Використовується для розмежування доступу до data_sensitivity, owner_tenant_id та source_classification.
"""
from typing import Any

from fastapi import HTTPException

# Ієрархія чутливості даних
SENSITIVITY_LEVELS = {
    "public": 1,
    "internal": 2,
    "restricted": 3,
    "top_secret": 4
}

# Максимальний рівень чутливості заснований на ролі RBAC
ROLE_MAX_SENSITIVITY = {
    "viewer": "public",
    "operator": "internal",
    "analyst": "restricted",
    "tenant_admin": "top_secret",
    "admin": "top_secret"
}

class ABACEnforcer:
    """Оцінник політик доступу."""

    @staticmethod
    def enforce_data_access(user_role: str, user_tenant_id: str, resource_tenant_id: str, data_sensitivity: str) -> bool:
        """Перевіряє, чи має користувач доступ до конкретного запису даних.

        Args:
            user_role: Роль в системі (analyst, viewer...)
            user_tenant_id: ID тенанта користувача
            resource_tenant_id: ID тенанта власника ресурсу
            data_sensitivity: Рівень чутливості (public, internal, restricted, top_secret)

        Returns:
            bool: True якщо доступ дозволено, False - якщо заборонено.

        """
        # 1. Admin має доступ до всього
        if user_role == "admin":
            return True

        # 2. Strict Tenant Isolation (Tenant Level)
        # Ніхто крім admin не може бачити дані чужого tenant
        if user_tenant_id != resource_tenant_id:
            return False

        # 3. Перевірка ABAC (Attribute-Based): Sensitivity Clearance
        allowed_sensitivity = ROLE_MAX_SENSITIVITY.get(user_role, "public")

        allowed_level = SENSITIVITY_LEVELS.get(allowed_sensitivity, 1)
        resource_level = SENSITIVITY_LEVELS.get(data_sensitivity, 4) # За замовчуванням найвища безпека

        return allowed_level >= resource_level

def require_abac_clearance(user: dict[str, Any], resource: dict[str, Any]):
    """Інтеграція ABAC перевірок. Викидає 403 у разі відмови."""
    user_role = user.get("role", "viewer")
    user_tenant = user.get("tenant_id")

    res_tenant = resource.get("tenant_id")
    res_sensitivity = resource.get("sensitivity", "internal")

    if not ABACEnforcer.enforce_data_access(user_role, user_tenant, res_tenant, res_sensitivity):
        raise HTTPException(
            status_code=403,
            detail=f"ABAC Deny: Ваш рівень кліренсу ({user_role}) недостатній для доступу до {res_sensitivity} даних."
        )
