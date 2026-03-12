"""Keycloak OIDC Integration — PREDATOR Analytics v55.2-SM.

Handles token verification using Keycloak's JWKS and parses claims (roles, tenant).
"""
import logging
from typing import Any

from fastapi import HTTPException, status
import httpx
from jose import jwk, jwt

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("core_api.keycloak")

class KeycloakAuth:
    """Клієнт для інтеграції з Keycloak OIDC."""

    def __init__(self) -> None:
        self.server_url = settings.KEYCLOAK_URL
        self.realm = settings.KEYCLOAK_REALM
        self.client_id = settings.KEYCLOAK_CLIENT_ID
        self.audience = settings.KEYCLOAK_AUDIENCE
        self.jwks_url = f"{self.server_url}/realms/{self.realm}/protocol/openid-connect/certs"
        self._jwks: dict[str, Any] = {}

    async def fetch_jwks(self):
        """Отримує JWKS (сертифікати) від Keycloak."""
        try:
            async with httpx.AsyncClient(verify=False) as client:  # noqa: S501
                response = await client.get(self.jwks_url, timeout=10.0)
                response.raise_for_status()
                self._jwks = response.json()
                logger.info("Successfully fetched JWKS from Keycloak")
        except Exception as e:
            logger.error(f"Failed to fetch JWKS from Keycloak at {self.jwks_url}: {e}")
            self._jwks = {}

    def get_public_key(self, kid: str) -> dict | None:
        """Отримує публічний ключ для вказаного kid."""
        if not self._jwks:
            return None
        for key in self._jwks.get("keys", []):
            if key.get("kid") == kid:
                return key
        return None

    async def verify_token(self, token: str) -> dict:
        """Перевіряє токен та повертає payload."""
        if not self._jwks:
            await self.fetch_jwks()

        try:
            # Отримуємо header без верифікації
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            if not kid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token header. No kid.",
                )

            key = self.get_public_key(kid)
            if not key:
                # Спробуємо оновити JWKS
                await self.fetch_jwks()
                key = self.get_public_key(kid)
                if not key:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Public key not found in JWKS.",
                    )

            # Конструюємо публічний ключ
            public_key = jwk.construct(key)

            # Отримуємо audience (деякі токени Keycloak містять масив audience)
            # Встановлюємо options, щоб перевірити audience якщо він потрібен,
            # або відключити строгу перевірку aud, якщо ми просто перевіряємо підпис
            options = {
                "verify_aud": bool(self.audience),
                "verify_signature": True,
                "verify_exp": True,
            }

            payload = jwt.decode(
                token,
                public_key.to_pem().decode("utf-8"),
                algorithms=[unverified_header.get("alg", "RS256")],
                audience=self.audience if self.audience else None,
                options=options,
            )
            return payload

        except jwt.ExpiredSignatureError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
            ) from e
        except jwt.JWTClaimsError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid claims: {e}",
            ) from e
        except jwt.JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token signature: {e}",
            ) from e
        except Exception as e:
            logger.warning(f"Token verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            ) from e

keycloak_auth = KeycloakAuth()
