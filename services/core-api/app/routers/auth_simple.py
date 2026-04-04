"""⚠️ DEPRECATED: Simple Auth Router - PREDATOR Analytics v55.2.

🔴 ЭТОТ ФАЙЛ ЯВЛЯЕТСЯ LEGACY И НЕ ИСПОЛЬЗУЕТСЯ.
📌 Используется auth.py вместо этого файла.

Причины деактивации:
- Дублирует логику auth.py
- Не импортируется в __init__.py
- Использует прямые DB соединения вместо ORM (SQLAlchemy)
- Отсутствуют type hints для Mypy strict mode

Для удаления: rm /Users/dima-mac/Documents/Predator_21/services/core-api/app/routers/auth_simple.py

---

Сохранено для истории, но НЕ должно использоваться в production.
Все аутентификационные операции должны идти через auth.py.

Разработчикам: если нужна упрощенная версия без SQLAlchemy, обновите auth.py или создайте новый файл с явным именованием.
"""
from datetime import timedelta
import os

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field

from app.config import get_settings
from app.core.security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


class UserResponse(BaseModel):
    """Модель користувача для відповіді."""

    id: str
    email: str
    role: str
    tenant_id: str
    full_name: str | None = None
    is_active: bool = True


class LoginResponse(BaseModel):
    """Відповідь на успішний логін."""

    access_token: str
    expires_in: int = Field(..., description="Час життя токена в секундах")
    token_type: str = "bearer"
    user: UserResponse


class MeResponse(BaseModel):
    """Відповідь на GET /auth/me."""

    id: str
    email: str
    role: str
    tenant_id: str
    full_name: str | None = None
    is_active: bool = True
    api_quota: dict = Field(default_factory=dict)


async def get_db_connection():
    """Отримання з'єднання з БД."""
    dsn = os.getenv('DATABASE_URL', '').replace('postgresql://', 'postgres://')
    return await asyncpg.connect(dsn=dsn)


@router.post("/token", response_model=LoginResponse)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """Отримання JWT токену (OAuth2 compatible)."""
    conn = await get_db_connection()

    try:
        # Пошук користувача в БД
        row = await conn.fetchrow(
            "SELECT id, email, password_hash, role, tenant_id, full_name, is_active FROM users WHERE email = $1",
            form_data.username
        )

        if not row or not verify_password(form_data.password, row['password_hash']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неправильний email або пароль",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not row['is_active']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Користувач деактивований"
            )

        # Створення токену
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(row['id']), "role": row['role'], "tenant_id": str(row['tenant_id'])},
            expires_delta=access_token_expires
        )

        return LoginResponse(
            access_token=access_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            token_type="bearer",
            user=UserResponse(
                id=str(row['id']),
                email=row['email'],
                role=row['role'],
                tenant_id=str(row['tenant_id']),
                full_name=row['full_name'],
                is_active=row['is_active'],
            )
        )
    finally:
        await conn.close()


@router.get("/me", response_model=MeResponse)
async def get_current_user_profile():
    """Отримання профілю поточного користувача."""
    # Спрощена версія без JWT перевірки для тестування
    conn = await get_db_connection()

    try:
        row = await conn.fetchrow(
            "SELECT id, email, role, tenant_id, full_name, is_active FROM users WHERE email = $1",
            "admin@predator.ua"
        )

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Користувача не знайдено"
            )

        return MeResponse(
            id=str(row['id']),
            email=row['email'],
            role=row['role'],
            tenant_id=str(row['tenant_id']),
            full_name=row['full_name'],
            is_active=row['is_active'],
            api_quota={"used": 10, "limit": 1000}
        )
    finally:
        await conn.close()


@router.post("/register", response_model=UserResponse)
async def register_user(
    email: str,
    password: str,
    full_name: str | None = None
):
    """Реєстрація нового користувача."""
    conn = await get_db_connection()

    try:
        # Перевірка чи існує користувач
        existing = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1", email
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Користувач з таким email вже існує"
            )

        # Створення користувача
        from app.core.security import get_password_hash
        password_hash = get_password_hash(password)

        row = await conn.fetchrow(
            """
            INSERT INTO users (email, password_hash, role, full_name, tenant_id)
            VALUES ($1, $2, 'analyst', $3, gen_random_uuid())
            RETURNING id, email, role, tenant_id, full_name, is_active
            """,
            email, password_hash, full_name
        )

        return UserResponse(
            id=str(row['id']),
            email=row['email'],
            role=row['role'],
            tenant_id=str(row['tenant_id']),
            full_name=row['full_name'],
            is_active=row['is_active'],
        )
    finally:
        await conn.close()
