"""Keycloak OIDC Middleware — PREDATOR Analytics v61.0-ELITE Ironclad."""
import logging
from typing import Annotated, Any

import jwt
from fastapi import Request, Response
from jwt import PyJWKClient
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.config import get_settings

logger = logging.getLogger("core-api.auth")

# Кешування ключів (JWKS) з Keycloak
settings = get_settings()
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
    
    # Список префіксів шляхів, які не потребують авторизації
    PUBLIC_PATHS = (
        "/api/v1/health",
        "/health",
        "/ready",
        "/metrics",
        "/api/v1/auth/",
        "/docs",
        "/redoc",
        "/openapi.json"
    )

    async def dispatch(self, request: Request, call_next: Any) -> Response:
        path = request.url.path
        
        if path.startswith(self.PUBLIC_PATHS) or path == "/":
            return await call_next(request)

        # Отримуємо Authorization header або query параметр
        auth_header = request.headers.get("Authorization")
        token = None
        
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        elif request.query_params.get("token"):
            token = request.query_params.get("token")
            
        if not token:
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid Authorization header or token query parameter"}
            )
            

        
        # Fallback for local development / testing
        if settings.ENV in ["development", "testing"] and token == "test-token":
            request.state.user = {"sub": "test-user", "roles": ["admin", "analyst"]}
            return await call_next(request)
            
        if not jwks_client:
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
