import os
import logging
from typing import Optional, List
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient
from datetime import datetime

logger = logging.getLogger("service.auth")

security = HTTPBearer()

class AuthService:
    """
    Authentication and authorization service using Keycloak OIDC.
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
        """
        Verify JWT token from Keycloak.
        Returns decoded token payload.
        """
        try:
            signing_key = self.jwks_client.get_signing_key_from_jwt(token)
            
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=self.client_id,
                options={"verify_exp": True}
            )
            
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    
    def get_user_roles(self, token_payload: dict) -> List[str]:
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

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """
    FastAPI dependency to get current authenticated user.
    Usage: user = Depends(get_current_user)
    """
    token = credentials.credentials
    payload = auth_service.verify_token(token)
    
    return {
        "user_id": payload.get("sub"),
        "username": payload.get("preferred_username"),
        "email": payload.get("email"),
        "tenant_id": payload.get("tenant_id", "default"),
        "roles": auth_service.get_user_roles(payload),
        "can_view_pii": auth_service.can_access_pii(payload)
    }

async def require_role(required_role: str):
    """
    Dependency factory for role-based access control.
    Usage: dependencies=[Depends(require_role("admin"))]
    """
    async def role_checker(credentials: HTTPAuthorizationCredentials = Security(security)):
        token = credentials.credentials
        payload = auth_service.verify_token(token)
        
        if not auth_service.has_role(payload, required_role):
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permissions. Required role: {required_role}"
            )
        
        return payload
    
    return role_checker

async def require_admin(user: dict = Depends(get_current_user)):
    """
    Dependency to enforce admin access.
    """
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
