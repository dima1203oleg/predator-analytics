"""Auth Router — PREDATOR Analytics v55.2-SM-EXTENDED.

Handles authentication, token generation, and user profile.
Реалізація згідно TZ §2.2.1.
"""
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models.orm import User

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


# ======================== МОДЕЛІ ВІДПОВІДІ ========================

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
    refresh_token: str | None = None
    expires_in: int = Field(..., description="Час життя токена в секундах")
    token_type: str = "bearer"  # noqa: S105
    user: UserResponse


class MeResponse(BaseModel):
    """Відповідь на GET /auth/me."""

    id: str
    email: str
    role: str
    tenant_id: str
    subscription_tier: str = "professional"
    api_quota: dict = Field(default_factory=dict)


@router.post("/token", response_model=LoginResponse)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Отримання JWT токену (OAuth2 compatible). Згідно TZ §2.2.1."""
    # 1. Пошук користувача в БД
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неправильний email або пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Користувач деактивований"
        )

    # 2. Створення токену
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "tenant_id": str(user.tenant_id)},
        expires_delta=access_token_expires
    )

    return LoginResponse(
        access_token=access_token,
        refresh_token=None,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        token_type="bearer",  # noqa: S106
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            role=user.role,
            tenant_id=str(user.tenant_id),
            full_name=user.full_name if hasattr(user, "full_name") else None,
            is_active=user.is_active,
        )
    )


@router.get("/me", response_model=MeResponse)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Отримання профілю поточного користувача. Згідно TZ §2.2.1."""
    user_id = current_user.get("sub")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Користувача не знайдено"
        )

    # Розрахунок API quota (спрощена версія)
    today = datetime.now(UTC).date()
    tomorrow = today + timedelta(days=1)

    return MeResponse(
        id=str(user.id),
        email=user.email,
        role=user.role,
        tenant_id=str(user.tenant_id),
        subscription_tier="professional",
        api_quota={
            "daily_limit": 10000,
            "used_today": 0,
            "reset_at": f"{tomorrow}T00:00:00Z",
        }
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    email: str,
    password: str,
    role: str = "guest",
    db: AsyncSession = Depends(get_db)
):
    """Реєстрація нового користувача (залишено для зручності розгортання).
    В продакшені зазвичай закривається адміністративними правами.
    """
    # Перевірка на існування
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email вже зареєстрований"
        )

    import uuid
    new_user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=get_password_hash(password),
        role=role,
        is_active=True,
        tenant_id="global-system" # Default tenant
    )

    db.add(new_user)
    await db.commit()
    return {"message": "Користувач створений успішно"}
