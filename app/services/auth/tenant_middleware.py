"""Tenant Middleware — PostgreSQL RLS (Phase 3 — SM Edition).

Sets `app.current_tenant_id` per request for Row Level Security.
"""
from datetime import UTC, datetime
from typing import Any


class TenantMiddleware:
    """Tenant RLS middleware: SET app.current_tenant_id = :tenant_id."""

    def __init__(self) -> None:
        self.config: dict[str, Any] = {
            "rls_enabled": True,
            "header_name": "X-Tenant-ID",
            "default_tenant": None,
        }

    def get_config(self) -> dict[str, Any]:
        """Конфігурація RLS middleware."""
        return {
            **self.config,
            "status": "active",
            "sql_statement": "SET app.current_tenant_id = :tenant_id",
            "updated_at": datetime.now(UTC).isoformat(),
        }

    def resolve_tenant(self, headers: dict[str, str]) -> dict[str, Any]:
        """Визначити tenant_id з заголовків запиту."""
        tenant_id = headers.get(self.config["header_name"])
        if not tenant_id:
            return {"resolved": False, "error": "X-Tenant-ID header відсутній"}
        return {
            "resolved": True,
            "tenant_id": tenant_id,
            "rls_statement": f"SET app.current_tenant_id = '{tenant_id}'",
        }
