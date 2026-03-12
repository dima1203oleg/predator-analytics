"""RBAC (Role-Based Access Control) — Матриця прав доступу PREDATOR Analytics.

Ролі (COMP-301..COMP-420):
- admin
- analyst
- guest
- business (SMB/Enterprise)
- bank (compliance)
- gov (law enforcement / regulations)
- journalist (OSINT)
"""
from enum import StrEnum

from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user_payload


class Role(StrEnum):
    """Типи ролей у системі."""

    ADMIN = "admin"
    ANALYST = "analyst"
    GUEST = "guest"
    BUSINESS = "business"
    BANK = "bank"
    GOV = "gov"
    JOURNALIST = "journalist"


class Permission(StrEnum):
    """Можливі дії (прав доступу) в системі."""

    READ_CORP_DATA = "read:corp_data"
    WRITE_CORP_DATA = "write:corp_data"
    READ_COMPANIES = "read:companies"
    READ_CUSTOMS = "read:customs"
    READ_INTEL = "read:intel"
    RUN_ANALYTICS = "run:analytics"
    RUN_GRAPH = "run:graph"
    VIEW_WARROOM = "view:warroom"
    EDIT_TENANT = "edit:tenant"
    MANAGE_USERS = "manage:users"


# Матриця дозвілів: Роль -> Список прав
ROLE_PERMISSIONS: dict[Role, list[Permission]] = {
    Role.ADMIN: list(Permission),  # Всі права
    Role.ANALYST: [
        Permission.READ_CORP_DATA,
        Permission.READ_COMPANIES,
        Permission.READ_CUSTOMS,
        Permission.READ_INTEL,
        Permission.RUN_ANALYTICS,
        Permission.RUN_GRAPH,
        Permission.VIEW_WARROOM,
    ],
    Role.BUSINESS: [
        Permission.READ_CORP_DATA,
        Permission.RUN_ANALYTICS,
        Permission.RUN_GRAPH,
    ],
    Role.BANK: [
        Permission.READ_CORP_DATA,
        Permission.READ_COMPANIES,
        Permission.READ_CUSTOMS,
        Permission.RUN_ANALYTICS,
        Permission.RUN_GRAPH,
    ],
    Role.GOV: [
        Permission.READ_CORP_DATA,
        Permission.READ_COMPANIES,
        Permission.READ_CUSTOMS,
        Permission.RUN_ANALYTICS,
        Permission.RUN_GRAPH,
        Permission.VIEW_WARROOM,
    ],
    Role.JOURNALIST: [
        Permission.READ_CORP_DATA,
        Permission.RUN_GRAPH,
    ],
    Role.GUEST: [
        Permission.READ_CORP_DATA,
    ],
}


def require_permissions(required_permissions: list[Permission]):
    """Dependency, що перевіряє наявність усіх необхідних прав у токені користувача.
    """
    def permission_checker(payload: dict = Depends(get_current_user_payload)) -> dict:
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

        for required in required_permissions:
            if required not in user_perms:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Недостатньо прав. Потрібно: {required.value}"
                )

        return payload

    return permission_checker
