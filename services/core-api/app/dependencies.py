"""Dependencies Module — PREDATOR Analytics v61.0-ELITE Ironclad.

Common dependencies for FastAPI routes.
"""

from fastapi import Depends, HTTPException, Request, status

from app.core.mtls import MTLSSecurity, ServiceNodes
from app.core.permissions import ROLE_PERMISSIONS, Permission, Role
from app.core.security import get_current_user_payload


async def get_current_active_user(
    payload: dict = Depends(get_current_user_payload)
) -> dict:
    """Перевірка, чи користувач активний (payload-based)."""
    # У повному продакшені ми б звіряли з БД, але для Ironclad stateless JWT:
    if not payload.get("is_active", True):
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Користувач неактивний"
        )
    return payload


async def get_tenant_id(request: Request) -> str:
    """Отримання tenant_id з контексту запиту (Middleware)."""
    return getattr(request.state, "tenant_id", "global-system")


class PermissionChecker:
    """Клас-залежність для перевірки прав доступу.
    """

    def __init__(self, required_permissions: list[Permission]):
        self.required_permissions = required_permissions

    def __call__(self, payload: dict = Depends(get_current_user_payload)):
        user_role_str = payload.get("role")
        if not user_role_str:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Відсутня роль у токені"
            )
        try:
            user_role = Role(user_role_str)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Некоректна роль у токені"
            ) from e

        user_perms = ROLE_PERMISSIONS.get(user_role, [])
        for perm in self.required_permissions:
            if perm not in user_perms:
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Недостатньо прав: {perm.value}"
                )
        return payload

async def verify_mtls_node(request: Request):
    """Депенденсі для захисту міжсервісних ендпоїнтів."""
    return MTLSSecurity.verify_node(request, [
        ServiceNodes.INGESTION_WORKER,
        ServiceNodes.GRAPH_SERVICE,
        ServiceNodes.GATEWAY
    ])
