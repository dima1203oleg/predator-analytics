from __future__ import annotations


"""FastAPI Security Dependencies
Integrates RBAC with FastAPI routing.
"""
import os

from fastapi import Depends, HTTPException, Request, status

from app.libs.core.security.rbac import Permission, Role, verify_permission
from app.libs.core.structured_logger import get_logger, log_security_event


logger = get_logger("predator.security")

# JWT Logic Placeholder (to be expanded)
# In a real app, this would use libs.core.security.jwt to decode header


async def get_current_user_roles(request: Request) -> list[str]:
    """Extract user roles from key data.
    Currently supports:
    1. X-Role header (Internal/Dev only)
    2. JWT Token (Future)
    3. Default to VIEWER if public.
    """
    # 1. Internal/Dev Override
    if os.getenv("ENVIRONMENT") == "development":
        # Allow header override in dev
        role_header = request.headers.get("X-Role")
        if role_header:
            return [role_header]
        return [Role.ADMIN]  # Default to Admin in Dev for convenience (Change for Prod!)

    # 2. Production: Decode JWT
    auth_header = request.headers.get("Authorization")
    if auth_header:
        try:
            # Handle Bearer token
            token = auth_header.split(" ")[1] if auth_header.startswith("Bearer ") else auth_header

            from app.libs.core.security.jwt_handler import decode_access_token

            payload = decode_access_token(token)

            if payload:
                # Log successful auth
                log_security_event(
                    logger, "auth_success", severity="low", sub=payload.get("sub"), roles=payload.get("roles", [])
                )
                return payload.get("roles", [Role.VIEWER])
        except Exception as e:
            logger.warning(f"JWT Decode Failed: {e}")

    # Default
    return [Role.VIEWER]


class RequirePermission:
    """Dependency for checking permissions.
    Usage: @app.get("/", dependencies=[Depends(RequirePermission(Permission.READ_DATA))]).
    """

    def __init__(self, permission: Permission):
        self.permission = permission

    async def __call__(self, request: Request, roles: list[str] = Depends(get_current_user_roles)):
        if not verify_permission(roles, self.permission):
            log_security_event(
                logger,
                "access_denied",
                severity="medium",
                required_permission=self.permission,
                user_roles=roles,
                path=request.url.path,
            )
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Missing permission: {self.permission}")


class RequireRole:
    """Dependency for checking roles.
    Usage: @app.get("/", dependencies=[Depends(RequireRole(Role.ADMIN))]).
    """

    def __init__(self, role: Role):
        self.role = role

    async def __call__(self, request: Request, roles: list[str] = Depends(get_current_user_roles)):
        # Simple check
        if self.role not in roles and Role.ADMIN not in roles and Role.SYSTEM not in roles:
            log_security_event(
                logger,
                "access_denied",
                severity="medium",
                required_role=self.role,
                user_roles=roles,
                path=request.url.path,
            )
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Missing role: {self.role}")
