from __future__ import annotations


"""Secret Manager Abstraction
Provides unified access to secrets via HashiCorp Vault or Environment Variables.
"""
import logging
import os
from typing import Dict, Optional, Union

from app.libs.core.config import settings


logger = logging.getLogger("predator.security.vault")

class SecretManager:
    """Manages access to sensitive configuration.
    Priority: HashiCorp Vault > Environment Variables.
    """
    def __init__(self):
        self._vault_client = None
        self._use_vault = bool(settings.VAULT_TOKEN)

        if self._use_vault:
            try:
                import hvac
                self._vault_client = hvac.Client(
                    url=settings.VAULT_ADDR,
                    token=settings.VAULT_TOKEN
                )
                if self._vault_client.is_authenticated():
                    logger.info("🔐 Connected to HashiCorp Vault")
                else:
                    logger.warning("⚠️ Vault token invalid. Falling back to ENV.")
                    self._use_vault = False
            except ImportError:
                logger.warning("⚠️ 'hvac' library not found. Install it for Vault support. Falling back to ENV.")
                self._use_vault = False
            except Exception as e:
                logger.exception(f"❌ Vault connection failed: {e}. Falling back to ENV.")
                self._use_vault = False
        else:
            logger.debug("Using Environment Variables for secrets (Vault token not provided)")

    def get_secret(self, key: str, vault_path: str | None = None) -> str | None:
        """Get a secret value.

        Args:
            key: Environment variable name (e.g. "POSTGRES_PASSWORD")
            vault_path: Path in Vault (e.g. "predator/database", key will be used as field name)

        Returns:
            Secret value or None
        """
        # 1. Try Vault
        if self._use_vault and vault_path and self._vault_client:
            try:
                # Assuming KV v2 engine mounted at 'secret/'
                mount_point = "secret"
                # Strip mount point if provided in path
                if vault_path.startswith("secret/"):
                    mount_point, vault_path = vault_path.split("/", 1)

                response = self._vault_client.secrets.kv.v2.read_secret_version(
                    path=vault_path,
                    mount_point=mount_point
                )
                data = response['data']['data']
                if key in data:
                    return data[key]
            except Exception as e:
                logger.debug(f"Vault lookup failed for {vault_path}/{key}: {e}")

        # 2. Fallback to ENV
        return os.getenv(key)

# Singleton instance
vault = SecretManager()
