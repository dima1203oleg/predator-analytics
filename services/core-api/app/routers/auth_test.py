"""Simple Auth Test - тимчасове вирішення проблем з auth."""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import asyncio
import asyncpg
import os

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class MeResponse(BaseModel):
    id: str
    email: str
    role: str
    tenant_id: str
    full_name: str | None = None
    is_active: bool = True
    api_quota: dict = {"used": 10, "limit": 1000}

@router.post("/token", response_model=LoginResponse)
async def login(username: str, password: str):
    """Простий login для тестування."""
    if username == "admin@predator.ua" and password == "admin123":
        return LoginResponse(
            access_token="test-token-12345",
            token_type="bearer",
            user={
                "id": "admin-id",
                "email": "admin@predator.ua",
                "role": "admin",
                "tenant_id": "default-tenant",
                "full_name": "Адміністратор Системи",
                "is_active": True
            }
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неправильний email або пароль"
        )

@router.get("/me", response_model=MeResponse)
async def get_me():
    """Простий profile endpoint."""
    return MeResponse(
        id="admin-id",
        email="admin@predator.ua",
        role="admin",
        tenant_id="default-tenant",
        full_name="Адміністратор Системи",
        is_active=True,
        api_quota={"used": 10, "limit": 1000}
    )

@router.post("/register")
async def register():
    """Тестовий endpoint."""
    return {"message": "Registration endpoint - TODO"}
