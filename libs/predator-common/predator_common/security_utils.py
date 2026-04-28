"""Security Utils — PREDATOR Analytics v58.2-WRAITH.

JWT validation, tenant extraction, RBAC helpers.
Канонічний модуль безпеки для всіх сервісів.

Модуль відповідає:
- HR-06: Секрети тільки з ENV
- TZ §4.1: JWT з tenant_id та role
- TZ §4.2: RBAC enforcement
"""
from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum

import jwt  # type: ignore[import-untyped]

from predator_common.logging import get_logger

logger = get_logger("security_utils")


class UserRole(StrEnum):
    """Канонічні ролі PREDATOR Platform."""

    ADMIN = "admin"        # Повний доступ
    ANALYST = "analyst"    # Читання + аналітика + AI Copilot
    OPERATOR = "operator"  # Читання + інгестія
    VIEWER = "viewer"      # Тільки читання


@dataclass
class TokenPayload:
    """Розпарсений JWT payload."""

    sub: str              # user_id
    tenant_id: str        # tenant isolation
    role: UserRole        # RBAC role
    email: str | None = None
    exp: datetime | None = None
    iat: datetime | None = None
    jti: str | None = None  # JWT ID для blacklist


def decode_jwt(
    token: str,
    secret_key: str,
    algorithm: str = "HS256",
    verify_exp: bool = True,
) -> TokenPayload:
    """Декодувати та валідувати JWT токен.

    Args:
        token: JWT рядок
        secret_key: Секретний ключ
        algorithm: Алгоритм підпису
        verify_exp: Чи перевіряти термін дії

    Returns:
        TokenPayload з user/tenant/role

    Raises:
        jwt.ExpiredSignatureError: Термін дії минув
        jwt.InvalidTokenError: Невалідний токен

    """
    payload = jwt.decode(
        token,
        secret_key,
        algorithms=[algorithm],
        options={"verify_exp": verify_exp},
    )

    # Парсинг дат
    exp = None
    if "exp" in payload:
        exp = datetime.fromtimestamp(payload["exp"], tz=UTC)

    iat = None
    if "iat" in payload:
        iat = datetime.fromtimestamp(payload["iat"], tz=UTC)

    return TokenPayload(
        sub=payload.get("sub", ""),
        tenant_id=payload.get("tenant_id", ""),
        role=UserRole(payload.get("role", "viewer")),
        email=payload.get("email"),
        exp=exp,
        iat=iat,
        jti=payload.get("jti"),
    )


def extract_tenant_id(token: str, secret_key: str) -> str:
    """Швидке витягування tenant_id з JWT (без повної валідації).

    Використовується в middleware для RLS context.
    """
    try:
        payload = decode_jwt(token, secret_key, verify_exp=False)
        return payload.tenant_id
    except Exception:
        return ""


def check_permission(
    role: UserRole,
    required_role: UserRole,
) -> bool:
    """Перевірка дозволу на основі ієрархії ролей.

    Ієрархія: admin > analyst > operator > viewer
    """
    hierarchy: dict[UserRole, int] = {
        UserRole.VIEWER: 0,
        UserRole.OPERATOR: 1,
        UserRole.ANALYST: 2,
        UserRole.ADMIN: 3,
    }

    return hierarchy.get(role, 0) >= hierarchy.get(required_role, 0)


def sanitize_input(value: str, max_length: int = 500) -> str:
    """Санітизація вхідних даних від SQL injection та XSS.

    Не використовувати для SQL — завжди параметризовані запити (SQLAlchemy).
    Призначено для логів, повідомлень, UI-текстів.
    """
    # Обрізати довжину
    value = value[:max_length]

    # Видалити потенційно небезпечні символи
    dangerous_chars = ["<script>", "</script>", "javascript:", "onerror=", "onload="]
    for dc in dangerous_chars:
        value = value.replace(dc, "")

    return value.strip()
