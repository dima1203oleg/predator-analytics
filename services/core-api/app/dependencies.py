"""
Dependencies Module — PREDATOR Analytics v55.1 Ironclad.

Common dependencies for FastAPI routes.
"""
from typing import AsyncGenerator, Dict

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.security import get_current_user_payload
from app.core.permissions import Role, ROLE_PERMISSIONS, Permission


async def get_current_active_user(
    payload: Dict = Depends(get_current_user_payload)
) -> Dict:
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
    """
    Клас-залежність для перевірки прав доступу.
    """
    def __init__(self, required_permissions: list[Permission]):
        self.required_permissions = required_permissions

    def __call__(self, payload: Dict = Depends(get_current_user_payload)):
        user_role_str = payload.get("role")
        if not user_role_str:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Відсутня роль у токені"
            )
        try:
            user_role = Role(user_role_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Некоректна роль у токені"
            )

        user_perms = ROLE_PERMISSIONS.get(user_role, [])
        for perm in self.required_permissions:
            if perm not in user_perms:
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Недостатньо прав: {perm.value}"
                )
        return payload
