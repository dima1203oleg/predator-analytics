"""
Auth Router — PREDATOR Analytics v55.1 Ironclad.

Handles authentication and token generation.
"""
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import create_access_token, verify_password, get_password_hash
from app.database import get_db
from app.models.orm import User
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Отримання JWT токену (OAuth2 compatible)."""
    # 1. Пошук користувача в БД
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
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
        data={"sub": user.id, "role": user.role, "tenant_id": user.tenant_id},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    email: str,
    password: str,
    role: str = "guest",
    db: AsyncSession = Depends(get_db)
):
    """
    Реєстрація нового користувача (залишено для зручності розгортання).
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
        hashed_password=get_password_hash(password),
        role=role,
        is_active=True,
        tenant_id="global-system" # Default tenant
    )
    
    db.add(new_user)
    await db.commit()
    return {"message": "Користувач створений успішно"}
