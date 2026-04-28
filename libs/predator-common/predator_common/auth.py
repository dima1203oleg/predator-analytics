"""Shared Authentication & Authorization logic — PREDATOR Analytics v55.2.
"""

from fastapi import Request


class User:
    """Уніфікована модель користувача для всіх сервісів."""

    def __init__(self, user_id: str, email: str, role: str, tenant_id: str, permissions: list[str]):
        self.id = user_id
        self.email = email
        self.role = role
        self.tenant_id = tenant_id
        self.permissions = permissions

async def get_current_user(request: Request) -> User:
    """Отримати поточного користувача з JWT токена.
    Ця функція буде спільною для API та Worker-ів.
    """
    # У реальній реалізації тут буде декодування JWT
    # Поки що повертаємо заглушку для сумісності з TZ 31.1
    return User(
        id="system-uuid",
        email="admin@predator.ua",
        role="admin",
        tenant_id="global-tenant",
        permissions=["read:declarations", "write:alerts"]
    )
