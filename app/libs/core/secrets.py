from __future__ import annotations

"""Predator Analytics v45 - Centralized Identity & Secret Manager
Enforces secure handling of API keys and credentials.
"""
import base64
import logging
import os

from cryptography.fernet import Fernet

from app.libs.core.config import settings

logger = logging.getLogger("predator.secrets")


class SecretManager:
    def __init__(self):
        # In a real v45 system, this would connect to Vault or AWS Secrets Manager
        # Here we use a Master Encryption Key from env if available, or a default for R&D
        self.master_key = os.getenv(
            "PREDATOR_MASTER_KEY", base64.urlsafe_b64encode(b"predator_v45_master_secret_key_!")
        )
        try:
            self.fernet = Fernet(self.master_key)
        except Exception as e:
            logger.exception(f"Failed to initialize SecretManager: {e}")
            self.fernet = None

    def get_secret(self, key: str, default: str | None = None) -> str | None:
        """Retrieve a secret.
        Tries:
        1. Decrypting env var if prefixed with 'ENC:'
        2. Direct env var
        3. Settings object.
        """
        val = os.getenv(key) or getattr(settings, key, None)

        if not val:
            return default

        if isinstance(val, str) and val.startswith("ENC:") and self.fernet:
            try:
                return self.fernet.decrypt(val[4:].encode()).decode()
            except Exception as e:
                logger.exception(f"Failed to decrypt secret {key}: {e}")
                return val  # Fallback to raw if decryption fails

        return val

    def encrypt_secret(self, plain_text: str) -> str:
        """Helper to prepare encrypted env vars."""
        if not self.fernet:
            return plain_text
        return f"ENC:{self.fernet.encrypt(plain_text.encode()).decode()}"


secret_manager = SecretManager()
