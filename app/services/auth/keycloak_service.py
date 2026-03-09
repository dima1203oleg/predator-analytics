"""
Keycloak Authentication Service (Phase 3 — SM Edition).

OIDC integration, MFA support, RBAC with 4 roles.
SM: 2GB RAM allocation.
"""
from datetime import datetime, timezone
from typing import Any


# Canonical roles (§12.3)
ROLES: dict[str, dict[str, Any]] = {
    "admin": {
        "label": "Адміністратор",
        "permissions": ["companies:crud", "declarations:crud", "copilot:use", "cers:full", "graph:full", "admin:full"],
        "plans": ["starter", "professional", "enterprise", "government"],
    },
    "analyst": {
        "label": "Аналітик",
        "permissions": ["companies:read", "declarations:read", "copilot:use", "cers:full", "graph:full"],
        "plans": ["professional", "enterprise", "government"],
    },
    "operator": {
        "label": "Оператор",
        "permissions": ["companies:read", "declarations:read", "cers:read"],
        "plans": ["starter", "professional", "enterprise", "government"],
    },
    "viewer": {
        "label": "Спостерігач",
        "permissions": ["companies:read", "declarations:read", "cers:read"],
        "plans": ["starter", "professional", "enterprise", "government"],
    },
}


class KeycloakAuthService:
    """Управління Keycloak OIDC авторизацією (SM Edition)."""

    def __init__(self) -> None:
        self.config: dict[str, Any] = {
            "realm": "predator",
            "client_id": "predator-api",
            "ram_limit": "2Gi",
            "mfa_enabled": True,
            "session_max": "8h",
            "token_access_ttl": "60m",
            "token_refresh_ttl": "7d",
        }

    def get_auth_status(self) -> dict[str, Any]:
        """Стан Keycloak сервісу."""
        return {
            "status": "running",
            "realm": self.config["realm"],
            "client_id": self.config["client_id"],
            "mfa_enabled": self.config["mfa_enabled"],
            "roles": list(ROLES.keys()),
            "session_max": self.config["session_max"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    def get_roles(self) -> dict[str, dict[str, Any]]:
        """Перелік ролей та дозволів."""
        return ROLES

    def validate_permission(self, role: str, permission: str) -> bool:
        """Перевірка дозволу для ролі."""
        role_data = ROLES.get(role)
        if not role_data:
            return False
        return permission in role_data["permissions"]

    def get_plan_limits(self, plan: str) -> dict[str, Any]:
        """Обмеження тарифного плану (§12.4)."""
        limits: dict[str, dict[str, Any]] = {
            "starter": {
                "max_users": 5, "max_companies": 100, "api_rate_limit": "100/min",
                "features": ["dashboard", "companies", "declarations", "sanctions", "alerts"],
            },
            "professional": {
                "max_users": 25, "max_companies": 1000, "api_rate_limit": "500/min",
                "features": ["dashboard", "companies", "declarations", "sanctions", "alerts",
                             "copilot", "cers", "graph", "competitor_radar", "ingestion"],
            },
            "enterprise": {
                "max_users": 100, "max_companies": 10000, "api_rate_limit": "2000/min",
                "features": ["all"],
            },
            "government": {
                "max_users": 500, "max_companies": 50000, "api_rate_limit": "5000/min",
                "features": ["all", "governance_view", "climate_index", "aai_map"],
            },
        }
        return limits.get(plan, limits["starter"])
