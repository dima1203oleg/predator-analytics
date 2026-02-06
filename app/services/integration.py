from __future__ import annotations


"""Integration Service - Manages external integrations."""
from datetime import UTC, datetime, timezone
from typing import Any, Dict, List


class IntegrationService:
    """External integrations manager."""

    def __init__(self):
        self.integrations = {}

    def register(self, name: str, config: dict):
        """Register integration."""
        self.integrations[name] = {
            "config": config,
            "status": "ACTIVE",
            "registered_at": datetime.now(UTC)
        }

    def get_status(self, name: str) -> dict[str, Any]:
        """Get integration status."""
        return self.integrations.get(name, {"status": "NOT_FOUND"})

    def list_all(self) -> list[dict]:
        """List all integrations."""
        return [{"name": k, **v} for k, v in self.integrations.items()]


integration_service = IntegrationService()
