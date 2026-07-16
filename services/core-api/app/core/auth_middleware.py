"""Keycloak OIDC Middleware — PREDATOR Analytics v61.0-ELITE Ironclad."""
import logging
from typing import Annotated, Any

import jwt
from fastapi import Request, Response
from jwt import PyJWKClient
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.config import settings

logger = logging.getLogger("core-api.auth")

# Кешування ключів (JWKS) з Keycloak
jwks_url = f"{settings.KEYCLOAK_URL.rstrip('/')}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/certs"
try:
    jwks_client = PyJWKClient(jwks_url, cache_keys=True)
except Exception as e:
    logger.warning(f"Could not initialize JWK client, probably running offline: {e}")
    jwks_client = None

class KeycloakAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware для валідації JWT токенів від Keycloak.
    Перевіряє підпис (через JWKS), аудиторію та expiration.
    """
    
    # Список шляхів, які не потребують авторизації
    PUBLIC_PATHS = {
        "/api/v1/health",
        "/api/v1/ready",
        "/api/v1/metrics",
        "/docs",
        "/redoc",
        "/openapi.json"
    }

    async def dispatch(self, request: Request, call_next: Any) -> Response:
        path = request.url.path
        
        if path in self.PUBLIC_PATHS:
            return await call_next(request)

        # Отримуємо Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid Authorization header"}
            )
            
        token = auth_header.split(" ")[1]
        
        if not jwks_client:
            # Fallback for local development / testing without Keycloak
            if settings.ENV in ["development", "testing"] and token == "test-token":
                request.state.user = {"sub": "test-user", "roles": ["admin", "analyst"]}
                return await call_next(request)
            return JSONResponse(status_code=503, content={"detail": "Auth provider unavailable"})

        try:
            # Отримуємо підписний ключ для даного токена
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            
            # Декодуємо та валідуємо токен
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=settings.KEYCLOAK_AUDIENCE,
                options={"verify_exp": True}
            )
            
            # Зберігаємо дані користувача в Request State
            request.state.user = payload
            return await call_next(request)
            
        except jwt.ExpiredSignatureError:
            return JSONResponse(status_code=401, content={"detail": "Token has expired"})
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid token: {e}")
            return JSONResponse(status_code=401, content={"detail": "Invalid token"})
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return JSONResponse(status_code=500, content={"detail": "Internal server error during authentication"})
