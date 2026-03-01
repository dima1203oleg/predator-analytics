from __future__ import annotations


"""Vault Service - HashiCorp Vault Integration
Secure secrets management.
"""
import logging
from typing import Any

import httpx

from app.core.config import settings


logger = logging.getLogger(__name__)


class VaultService:
    """HashiCorp Vault client for secrets management."""

    def __init__(self):
        self.vault_addr = settings.VAULT_ADDR
        self.vault_token = settings.VAULT_TOKEN
        self.enabled = bool(self.vault_token)
        # Setup in-memory cache
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes

    async def get_secret(self, path: str, key: str | None = None) -> Any | None:
        """Get secret from Vault.

        Args:
            path: Secret path (e.g., "secret/data/llm/openai")
            key: Specific key within the secret
        """
        if not self.enabled:
            logger.warning("Vault not configured, using environment variables")
            return None

        # Check cache
        import time

        cache_key = f"{path}:{key or 'ALL'}"
        if cache_key in self.cache:
            entry = self.cache[cache_key]
            if time.time() - entry["timestamp"] < self.cache_ttl:
                return entry["data"]

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.vault_addr}/v1/{path}",
                    headers={"X-Vault-Token": self.vault_token},
                    timeout=10.0,
                )
                response.raise_for_status()
                data = response.json()

                secret_data = data.get("data", {}).get("data", {})

                result = None
                result = secret_data.get(key) if key else secret_data

                # Update cache
                self.cache[cache_key] = {"data": result, "timestamp": time.time()}

                return result

        except Exception as e:
            logger.exception(f"Vault error: {e}")
            return None

    async def set_secret(self, path: str, data: dict[str, Any]) -> bool:
        """Write secret to Vault."""
        if not self.enabled:
            logger.warning("Vault not configured")
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.vault_addr}/v1/{path}",
                    headers={"X-Vault-Token": self.vault_token},
                    json={"data": data},
                    timeout=10.0,
                )
                response.raise_for_status()
                return True

        except Exception as e:
            logger.exception(f"Vault write error: {e}")
            return False

    async def health_check(self) -> dict[str, Any]:
        """Check Vault health."""
        if not self.enabled:
            return {"status": "disabled", "configured": False}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.vault_addr}/v1/sys/health", timeout=5.0)
                data = response.json()
                return {
                    "status": "healthy" if data.get("initialized") else "unhealthy",
                    "sealed": data.get("sealed", True),
                    "configured": True,
                }
        except Exception as e:
            return {"status": "error", "error": str(e), "configured": True}


# Singleton instance
vault_service = VaultService()
