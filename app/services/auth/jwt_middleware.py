"""
JWT Authentication Middleware (Phase 3 — SM Edition).

HS256 tokens, access 60min, refresh 7d.
Integrates with Keycloak OIDC.
"""
from datetime import datetime, timezone
from typing import Any


class JWTAuthMiddleware:
    """JWT middleware для FastAPI (SM Edition)."""

    def __init__(self) -> None:
        self.config: dict[str, Any] = {
            "algorithm": "HS256",
            "access_token_ttl_minutes": 60,
            "refresh_token_ttl_days": 7,
            "issuer": "predator-keycloak",
            "audience": "predator-api",
        }

    def get_config(self) -> dict[str, Any]:
        """Конфігурація JWT."""
        return {
            **self.config,
            "status": "active",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    def validate_token_structure(self, token: str) -> dict[str, Any]:
        """Перевірка структури токена (mock)."""
        if not token or len(token) < 10:
            return {"valid": False, "error": "Token занадто короткий"}
        return {
            "valid": True,
            "algorithm": self.config["algorithm"],
            "issuer": self.config["issuer"],
        }
