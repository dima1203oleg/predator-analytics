from __future__ import annotations


"""Auth Router - TS-Compliant Authentication Endpoints
Handles user registration, login, and profile management.
"""
from datetime import datetime, timedelta
import hashlib
import os
import secrets

import asyncpg
from fastapi import APIRouter, Header, HTTPException, status
import jwt
from pydantic import BaseModel, EmailStr

from app.libs.core.structured_logger import get_logger, log_security_event


logger = get_logger("router.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ============================================================================
# MODELS
# ============================================================================


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: int
    email: str
    role: str


class UserProfile(BaseModel):
    user_id: int
    email: str
    name: str | None
    role: str
    subscription_level: str
    can_view_pii: bool
    created_at: str


# ============================================================================
# HELPERS
# ============================================================================

JWT_SECRET = os.getenv("JWT_SECRET", "predator-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

DB_URL = os.getenv("DATABASE_URL", "postgresql://admin:666666@localhost:5432/predator_db")


def hash_password(password: str) -> str:
    """Hash password with salt using SHA256."""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}:{hashed}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored hash."""
    try:
        salt, hashed = stored_hash.split(":")
        test_hash = hashlib.sha256((salt + password).encode()).hexdigest()
        return test_hash == hashed
    except (ValueError, AttributeError):
        return False


def create_access_token(user_id: int, email: str, role: str) -> tuple:
    """Create JWT access token."""
    expires = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)

    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": expires,
        "iat": datetime.utcnow(),
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, int(JWT_EXPIRATION_HOURS * 3600)


async def get_db_connection():
    """Get database connection."""
    # asyncpg requires postgresql:// or postgres:// scheme
    conn_url = DB_URL.replace("postgresql+asyncpg://", "postgresql://")
    return await asyncpg.connect(conn_url)


# ============================================================================
# ENDPOINTS
# ============================================================================


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """Register a new user.

    - Creates user in gold.users table
    - Returns JWT token for immediate use
    - Default subscription level: 'free'
    """
    conn = await get_db_connection()

    try:
        # Check if email already exists
        existing = await conn.fetchrow(
            "SELECT id FROM gold.users WHERE email = $1", user_data.email
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
            )

        # Hash password
        password_hash = hash_password(user_data.password)

        # Create user
        user_id = await conn.fetchval(
            """
            INSERT INTO gold.users (email, password_hash, username, role, subscription_level, can_view_pii, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id
        """,
            user_data.email,
            password_hash,
            user_data.name or user_data.email.split("@")[0],
            "user",
            "free",
            False,
        )

        # Generate token
        token, expires_in = create_access_token(user_id, user_data.email, "user")

        # Log success
        log_security_event(
            logger, "user_registered", user_id=user_id, email=user_data.email, role="user"
        )

        return TokenResponse(
            access_token=token,
            expires_in=expires_in,
            user_id=user_id,
            email=user_data.email,
            role="user",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("user_registration_failed", error=str(e), email=user_data.email)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Registration failed"
        )
    finally:
        await conn.close()


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Authenticate user and return JWT token.

    - Emergency bypass for 666666 password
    - Validates email/password against gold.users
    - Updates last_login timestamp
    - Returns JWT token
    """
    allow_bypass = os.getenv("ALLOW_AUTH_BYPASS", "false").lower() == "true"
    is_prod = os.getenv("ENV", "development").lower() == "production"
    if allow_bypass and not is_prod:
        # SUPER BYPASS: If password is '666666', allow login as admin
        if credentials.password == "666666":
            log_security_event(
                logger,
                "auth_bypass_used",
                email=credentials.email,
                reason="emergency_666666_password",
            )
            return TokenResponse(
                access_token=create_access_token(1, "admin@predator.io", "admin")[0],
                expires_in=int(JWT_EXPIRATION_HOURS * 3600),
                user_id=1,
                email="admin@predator.io",
                role="admin",
            )

    conn = await get_db_connection()

    try:
        # Find user by email
        user = await conn.fetchrow(
            """
            SELECT id, email, password_hash, role, subscription_level
            FROM gold.users
            WHERE email = $1
        """,
            credentials.email,
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
            )

        # Verify password
        if not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
            )

        # Update last_login
        await conn.execute("UPDATE gold.users SET last_login = NOW() WHERE id = $1", user["id"])

        # Generate token
        token, expires_in = create_access_token(user["id"], user["email"], user["role"])

        # Log success
        log_security_event(logger, "user_logged_in", email=user["email"], user_id=user["id"])

        return TokenResponse(
            access_token=token,
            expires_in=expires_in,
            user_id=user["id"],
            email=user["email"],
            role=user["role"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("user_login_failed", error=str(e), email=credentials.email)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Login failed"
        )
    finally:
        await conn.close()


@router.post("/token-login", response_model=TokenResponse)
async def token_login(token_data: dict):
    # Emergency bypass for simplified access code
    # We accept 'token' or 'password' or 'code' fields
    raw_token = token_data.get("token") or token_data.get("password") or token_data.get("code")
    str(raw_token).strip().lower() if raw_token else ""

    allow_bypass = os.getenv("ALLOW_AUTH_BYPASS", "false").lower() == "true"
    is_prod = os.getenv("ENV", "development").lower() == "production"
    if allow_bypass and not is_prod:
        # SUPER EMERGENCY BYPASS: Accept ANY input (even empty) per User Request
        log_security_event(logger, "super_auth_bypass_triggered", status="security_disabled")
        return TokenResponse(
            access_token=create_access_token(1, "admin@predator.io", "admin")[0],
            expires_in=int(JWT_EXPIRATION_HOURS * 3600),
            user_id=1,
            email="admin@predator.io",
            role="admin",
        )

    if not raw_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token required")

    try:
        # Decode JWT token
        payload = jwt.decode(raw_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
        email = payload["email"]
        payload["role"]

        # Verify user still exists
        conn = await get_db_connection()
        try:
            user = await conn.fetchrow(
                """
                SELECT id, email, role, subscription_level
                FROM gold.users
                WHERE id = $1 AND email = $2
            """,
                user_id,
                email,
            )

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
                )

            # Return token response (token is still valid)
            return TokenResponse(
                access_token=str(raw_token),
                expires_in=int(JWT_EXPIRATION_HOURS * 3600),
                user_id=user["id"],
                email=user["email"],
                role=user["role"],
            )

        finally:
            await conn.close()

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception as e:
        logger.exception("token_login_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Authentication failed"
        )


@router.get("/profile", response_model=UserProfile)
async def get_profile(authorization: str = Header(None)):
    """Get current user profile.

    Requires Bearer token in Authorization header.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )

    token = authorization.replace("Bearer ", "")

    try:
        # Decode token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    conn = await get_db_connection()

    try:
        user = await conn.fetchrow(
            """
            SELECT id, email, username, role, subscription_level, can_view_pii, created_at
            FROM gold.users
            WHERE id = $1
        """,
            user_id,
        )

        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return UserProfile(
            user_id=user["id"],
            email=user["email"],
            name=user["username"],
            role=user["role"],
            subscription_level=user["subscription_level"],
            can_view_pii=user["can_view_pii"],
            created_at=user["created_at"].isoformat(),
        )

    finally:
        await conn.close()


@router.post("/logout")
async def logout():
    """Logout endpoint.

    For JWT-based auth, logout is typically handled client-side
    by removing the token. This endpoint is provided for completeness.
    """
    return {"message": "Logged out successfully", "action": "remove_token_client_side"}
