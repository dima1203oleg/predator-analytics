"""
Auth Router - TS-Compliant Authentication Endpoints
Handles user registration, login, and profile management
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
import asyncpg
import hashlib
import secrets
import jwt
from datetime import datetime, timedelta
import logging

logger = logging.getLogger("router.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ============================================================================
# MODELS
# ============================================================================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    
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
    name: Optional[str]
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

DB_URL = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db")


def hash_password(password: str) -> str:
    """Hash password with salt using SHA256"""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}:{hashed}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored hash"""
    try:
        salt, hashed = stored_hash.split(":")
        test_hash = hashlib.sha256((salt + password).encode()).hexdigest()
        return test_hash == hashed
    except (ValueError, AttributeError):
        return False


def create_access_token(user_id: int, email: str, role: str) -> tuple:
    """Create JWT access token"""
    expires = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": expires,
        "iat": datetime.utcnow()
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, int(JWT_EXPIRATION_HOURS * 3600)


async def get_db_connection():
    """Get database connection"""
    return await asyncpg.connect(DB_URL)


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """
    Register a new user.
    
    - Creates user in gold.users table
    - Returns JWT token for immediate use
    - Default subscription level: 'free'
    """
    conn = await get_db_connection()
    
    try:
        # Check if email already exists
        existing = await conn.fetchrow(
            "SELECT id FROM gold.users WHERE email = $1",
            user_data.email
        )
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        password_hash = hash_password(user_data.password)
        
        # Create user
        user_id = await conn.fetchval("""
            INSERT INTO gold.users (email, password_hash, username, role, subscription_level, can_view_pii, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id
        """, user_data.email, password_hash, user_data.name or user_data.email.split("@")[0], "user", "free", False)
        
        # Generate token
        token, expires_in = create_access_token(user_id, user_data.email, "user")
        
        logger.info(f"User registered: {user_data.email} (ID: {user_id})")
        
        return TokenResponse(
            access_token=token,
            expires_in=expires_in,
            user_id=user_id,
            email=user_data.email,
            role="user"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )
    finally:
        await conn.close()


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """
    Authenticate user and return JWT token.
    
    - Validates email/password against gold.users
    - Updates last_login timestamp
    - Returns JWT token
    """
    conn = await get_db_connection()
    
    try:
        # Find user by email
        user = await conn.fetchrow("""
            SELECT id, email, password_hash, role, subscription_level
            FROM gold.users 
            WHERE email = $1
        """, credentials.email)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Update last_login
        await conn.execute(
            "UPDATE gold.users SET last_login = NOW() WHERE id = $1",
            user["id"]
        )
        
        # Generate token
        token, expires_in = create_access_token(user["id"], user["email"], user["role"])
        
        logger.info(f"User logged in: {credentials.email}")
        
        return TokenResponse(
            access_token=token,
            expires_in=expires_in,
            user_id=user["id"],
            email=user["email"],
            role=user["role"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )
    finally:
        await conn.close()


@router.get("/profile", response_model=UserProfile)
async def get_profile(authorization: str = None):
    """
    Get current user profile.
    
    Requires Bearer token in Authorization header.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Decode token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    conn = await get_db_connection()
    
    try:
        user = await conn.fetchrow("""
            SELECT id, email, username, role, subscription_level, can_view_pii, created_at
            FROM gold.users 
            WHERE id = $1
        """, user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserProfile(
            user_id=user["id"],
            email=user["email"],
            name=user["username"],
            role=user["role"],
            subscription_level=user["subscription_level"],
            can_view_pii=user["can_view_pii"],
            created_at=user["created_at"].isoformat()
        )
        
    finally:
        await conn.close()


@router.post("/logout")
async def logout():
    """
    Logout endpoint.
    
    For JWT-based auth, logout is typically handled client-side
    by removing the token. This endpoint is provided for completeness.
    """
    return {"message": "Logged out successfully", "action": "remove_token_client_side"}
