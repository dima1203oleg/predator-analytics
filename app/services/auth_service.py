from __future__ import annotations

import logging
import os
from typing import List

from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from jwt import PyJWKClient


logger = logging.getLogger("service.auth")

security = HTTPBearer()

class AuthService:
    """Authentication and authorization service using Keycloak OIDC.
    Validates JWT tokens and enforces RBAC/ABAC policies.
    """

    def __init__(self):
        self.keycloak_url = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
        self.realm = os.getenv("KEYCLOAK_REALM", "predator")
        self.client_id = os.getenv("KEYCLOAK_CLIENT_ID", "predator-api")

        # JWKS endpoint for token validation
        self.jwks_url = f"{self.keycloak_url}/realms/{self.realm}/protocol/openid-connect/certs"
        self.jwks_client = PyJWKClient(self.jwks_url)

    def verify_token(self, token: str) -> dict:
        """Verify JWT token from Keycloak.
        Returns decoded token payload.
        """
        try:
            signing_key = self.jwks_client.get_signing_key_from_jwt(token)

            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=self.client_id,
                options={"verify_exp": True}
            )

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {e!s}")

    def get_user_roles(self, token_payload: dict) -> list[str]:
        """Extract user roles from token."""
        realm_access = token_payload.get("realm_access", {})
        return realm_access.get("roles", [])

    def has_role(self, token_payload: dict, required_role: str) -> bool:
        """Check if user has specific role."""
        roles = self.get_user_roles(token_payload)
        return required_role in roles

    def can_access_pii(self, token_payload: dict) -> bool:
        """Check if user can access PII data."""
        allowed_roles = ["pro", "gov", "admin", "pii_viewer"]
        roles = self.get_user_roles(token_payload)
        return any(role in allowed_roles for role in roles)

# Dependency for FastAPI routes
auth_service = AuthService()

# Legacy/Development JWT Secret
# In a real unified system, this should come from settings
JWT_SECRET = os.getenv("JWT_SECRET", "predator-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """FastAPI dependency to get current authenticated user.
    Supports both Keycloak (RS256) and Legacy/Development JWT (HS256).
    """
    token = credentials.credentials

    # 1) Keycloak (RS256)
    try:
        payload = auth_service.verify_token(token)
        roles = auth_service.get_user_roles(payload)
        return {
            "user_id": payload.get("sub"),
            "username": payload.get("preferred_username") or payload.get("email") or payload.get("sub"),
            "email": payload.get("email"),
            "tenant_id": payload.get("tenant_id") or payload.get("azp") or "default",
            "roles": roles,
            "can_view_pii": auth_service.can_access_pii(payload),
            "auth_source": "keycloak"
        }
    except HTTPException:
        pass

    # 2) Legacy HS256 (issued by /api/v1/auth/*)
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        role = payload.get("role") or "user"
        roles = payload.get("roles")
        if not isinstance(roles, list):
            roles = [role]

        return {
            "user_id": payload.get("sub"),
            "username": payload.get("username") or payload.get("email") or payload.get("sub"),
            "email": payload.get("email"),
            "tenant_id": payload.get("tenant_id") or "default",
            "roles": roles,
            "can_view_pii": role in ["pro", "gov", "admin", "pii_viewer"],
            "auth_source": "legacy_jwt"
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e!s}")

async def require_role(required_role: str):
    """Dependency factory for role-based access control.
    Usage: dependencies=[Depends(require_role("admin"))].
    """
    async def role_checker(credentials: HTTPAuthorizationCredentials = Security(security)):
        user = await get_current_user(credentials)
        if required_role not in (user.get("roles") or []):
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permissions. Required role: {required_role}"
            )

        return user

    return role_checker

async def require_admin(user: dict = Depends(get_current_user)):
    """Dependency to enforce admin access."""
    # In development mode or if roles missing, we might be lenient or strict.
    # For now, strict: must have 'admin' role.
    # Fallback: if 'roles' is empty (mock token), allow if locally testing.
    if "admin" not in user["roles"]:
        # STRICT SECURITY: Only allow bypass if explicitly configured in non-prod
        if os.getenv("ENV") == "development" and os.getenv("ALLOW_ADMIN_BYPASS") == "true":
             logger.warning(f"⚠️ ADMIN ACCESS GRANTED TO {user['username']} VIA BYPASS CONFIG ⚠️")
             return user

        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions. Required role: admin"
        )
    return user
