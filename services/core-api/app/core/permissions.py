"""
RBAC (Role-Based Access Control) — Матриця прав доступу PREDATOR Analytics.

Ролі (COMP-301..COMP-420):
- admin
- analyst
- guest
- business (SMB/Enterprise)
- bank (compliance)
- gov (law enforcement / regulations)
- journalist (OSINT)
"""
from enum import Enum
from typing import List
from fastapi import Depends, HTTPException, status
from app.core.security import get_current_user_payload


class Role(str, Enum):
    """Типи ролей у системі."""
    ADMIN = "admin"
    ANALYST = "analyst"
    GUEST = "guest"
    BUSINESS = "business"
    BANK = "bank"
    GOV = "gov"
    JOURNALIST = "journalist"


class Permission(str, Enum):
    """Можливі дії (прав доступу) в системі."""
    READ_CORP_DATA = "read:corp_data"
    WRITE_CORP_DATA = "write:corp_data"
    READ_CUSTOMS = "read:customs"
    RUN_GRAPH = "run:graph"
    VIEW_WARROOM = "view:warroom"
    EDIT_TENANT = "edit:tenant"
    MANAGE_USERS = "manage:users"


# Матриця дозвілів: Роль -> Список прав
ROLE_PERMISSIONS: dict[Role, List[Permission]] = {
    Role.ADMIN: [p for p in Permission],  # Всі права
    Role.ANALYST: [
        Permission.READ_CORP_DATA,
        Permission.READ_CUSTOMS,
        Permission.RUN_GRAPH,
        Permission.VIEW_WARROOM,
    ],
    Role.BUSINESS: [
        Permission.READ_CORP_DATA,
        Permission.RUN_GRAPH,
    ],
    Role.BANK: [
        Permission.READ_CORP_DATA,
        Permission.READ_CUSTOMS,
        Permission.RUN_GRAPH,
    ],
    Role.GOV: [
        Permission.READ_CORP_DATA,
        Permission.READ_CUSTOMS,
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


def require_permissions(required_permissions: List[Permission]):
    """
    Dependency, що перевіряє наявність усіх необхідних прав у токені користувача.
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
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Некоректна роль у токені"
            )
            
        user_perms = ROLE_PERMISSIONS.get(user_role, [])
        
        for required in required_permissions:
            if required not in user_perms:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Недостатньо прав. Потрібно: {required.value}"
                )
                
        return payload
        
    return permission_checker
