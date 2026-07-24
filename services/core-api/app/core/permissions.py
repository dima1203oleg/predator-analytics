"""RBAC (Role-Based Access Control) — Матриця прав доступу PREDATOR Analytics v61.0.

Нові ролі згідно з ТЗ RBAC v61.0:
- promo (Рівень 1: STANDARD / PROMO - рекламно-заохочувальний)
- pro (Рівень 2: PRO CLIENT - комерційний доступ)
- vip (Рівень 3: VIP CLIENT / ELITE SIGINT - повний VIP доступ)
- admin (Рівень 4: SYSTEM ADMIN - технічне управління)

Легасі-аліаси для зворотної сумісності:
- analyst -> pro
- business -> promo
- guest -> promo
"""
from enum import StrEnum

from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user_payload


class Role(StrEnum):
    """Типи ролей у системі."""

    # Нові ролі RBAC v61.0
    PROMO = "promo"           # Рівень 1: STANDARD / PROMO
    PRO = "pro"               # Рівень 2: PRO CLIENT
    VIP = "vip"               # Рівень 3: VIP CLIENT / ELITE SIGINT
    ADMIN = "admin"           # Рівень 4: SYSTEM ADMIN

    # Легасі-аліаси для зворотної сумісності
    ANALYST = "analyst"
    BUSINESS = "business"
    GUEST = "guest"
    BANK = "bank"
    GOV = "gov"
    JOURNALIST = "journalist"


class Permission(StrEnum):
    """Можливі дії (прав доступу) в системі."""

    # Базовий доступ до даних
    READ_CORP_DATA = "read:corp_data"
    READ_COMPANIES = "read:companies"
    READ_CUSTOMS = "read:customs"
    READ_INTEL = "read:intel"

    # Аналітичні інструменти
    RUN_ANALYTICS = "run:analytics"
    RUN_GRAPH = "run:graph"

    # Спеціальні права
    VIEW_WARROOM = "view:warroom"
    EDIT_TENANT = "edit:tenant"

    # Управління чутливими даними
    READ_SENSITIVE_DATA = "read:sensitive_data"
    READ_RAW_DATA = "read:raw_data"

    # Системне управління
    MANAGE_USERS = "manage:users"
    MANAGE_INFRASTRUCTURE = "manage:infrastructure"
    VIEW_LOGS = "view:logs"


# Матриця дозвілів: Роль -> Список прав
ROLE_PERMISSIONS: dict[Role, list[Permission]] = {
    # РІВЕНЬ 1: PROMO (рекламно-заохочувальний)
    Role.PROMO: [
        Permission.READ_CORP_DATA,           # Базовий доступ до корпоративних даних (з маскуванням)
        Permission.RUN_ANALYTICS,           # Базова аналітика
    ],

    # РІВЕНЬ 2: PRO (комерційний доступ)
    Role.PRO: [
        Permission.READ_CORP_DATA,           # Корпоративні дані (з маскуванням на рівні API)
        Permission.READ_COMPANIES,           # Дані про компанії
        Permission.READ_CUSTOMS,             # Митні декларації
        Permission.READ_INTEL,               # Розвідка
        Permission.RUN_ANALYTICS,           # Повна аналітика
        Permission.RUN_GRAPH,                # Графова аналітика
        Permission.VIEW_WARROOM,             # Ситуаційна кімната
    ],

    # РІВЕНЬ 3: VIP (повний доступ)
    Role.VIP: [
        Permission.READ_CORP_DATA,           # Корпоративні дані
        Permission.READ_COMPANIES,           # Дані про компанії
        Permission.READ_CUSTOMS,             # Митні декларації
        Permission.READ_INTEL,               # Розвідка
        Permission.RUN_ANALYTICS,           # Повна аналітика
        Permission.RUN_GRAPH,                # Графова аналітика
        Permission.VIEW_WARROOM,             # Ситуаційна кімната
        Permission.READ_SENSITIVE_DATA,      # Чутливі дані (з можливістю перемикання)
        Permission.READ_RAW_DATA,            # Сирі дані (деанонімізація)
    ],

    # РІВЕНЬ 4: ADMIN (технічне управління)
    Role.ADMIN: [
        Permission.MANAGE_USERS,             # Управління користувачами
        Permission.MANAGE_INFRASTRUCTURE,    # Управління інфраструктурою
        Permission.VIEW_LOGS,                # Перегляд логів
        Permission.READ_CORP_DATA,           # Додано для можливості завантаження файлів при тестуванні
    ],

    # Легасі-аліаси для зворотної сумісності
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
        Permission.RUN_ANALYTICS,
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
