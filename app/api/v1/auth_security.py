"""Auth & Security API Router (Phase 3 — SM Edition).

Endpoints for Keycloak, JWT, tenant middleware, rate limiter, and Vault.
"""
from typing import Any

from fastapi import APIRouter

from app.services.auth.jwt_middleware import JWTAuthMiddleware
from app.services.auth.keycloak_service import KeycloakAuthService
from app.services.auth.rate_limiter import RedisRateLimiter
from app.services.auth.tenant_middleware import TenantMiddleware
from app.services.auth.vault_secrets import VaultSecretsService

router = APIRouter(prefix="/auth", tags=["Auth & Security"])

_keycloak = KeycloakAuthService()
_jwt = JWTAuthMiddleware()
_tenant = TenantMiddleware()
_rate_limiter = RedisRateLimiter()
_vault = VaultSecretsService()


# --- Keycloak ---

@router.get("/status")
async def get_auth_status() -> dict[str, Any]:
    """Стан Keycloak авторизації."""
    return _keycloak.get_auth_status()


@router.get("/roles")
async def get_roles() -> dict[str, Any]:
    """Перелік ролей та дозволів (§12.3)."""
    return _keycloak.get_roles()


@router.get("/plans/{plan}")
async def get_plan_limits(plan: str) -> dict[str, Any]:
    """Обмеження тарифного плану (§12.4)."""
    return _keycloak.get_plan_limits(plan)


# --- JWT ---

@router.get("/jwt/config")
async def get_jwt_config() -> dict[str, Any]:
    """Конфігурація JWT middleware."""
    return _jwt.get_config()


# --- Tenant Middleware ---

@router.get("/tenant/config")
async def get_tenant_config() -> dict[str, Any]:
    """Конфігурація RLS tenant middleware (§18)."""
    return _tenant.get_config()


# --- Rate Limiter ---

@router.get("/rate-limiter/config")
async def get_rate_limiter_config() -> dict[str, Any]:
    """Конфігурація rate limiter (§13.2)."""
    return _rate_limiter.get_config()


# --- Vault ---

@router.get("/vault/status")
async def get_vault_status() -> dict[str, Any]:
    """Стан HashiCorp Vault."""
    return _vault.get_vault_status()


@router.get("/vault/engines")
async def get_vault_engines() -> list[dict[str, str]]:
    """Перелік Vault secret engines."""
    return _vault.get_secret_engines()
