"""Security Module — PREDATOR Analytics v55.2 Production Ready.

JWT Authentication, Password Hashing, Security Validation
"""
from datetime import UTC, datetime, timedelta
import secrets
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import PyJWTError
import bcrypt as _bcrypt

from app.config import get_settings
from app.core.keycloak import keycloak_auth
from predator_common.logging import get_logger

logger = get_logger("core_api.security")

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Перевірка паролю через bcrypt напряму (без passlib)."""
    try:
        return _bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception as e:  # type: ignore[broad-except]
        logger.warning("Помилка перевірки паролю", error=str(e))
        return False


def get_password_hash(password: str) -> str:
    """Хешування паролю через bcrypt напряму."""
    return _bcrypt.hashpw(
        password.encode("utf-8"),
        _bcrypt.gensalt(prefix=b"2a"),
    ).decode("utf-8")


def validate_secret_key() -> bool:
    """Перевіряє чи SECRET_KEY не є default значенням."""
    secret = settings.SECRET_KEY

    # Перевірка на default/слабі значення
    weak_keys = [
        "secret",
        "SECRET",
        "test",
        "TEST",
        "default",
        "DEFAULT",
        "REQUIRED_IN_PRODUCTION",
        "predator",
        "123456",
        "password",
        "admin",
    ]

    if not secret or len(secret) < 32:
        return False

    return not any(weak_key in secret.lower() for weak_key in weak_keys)


def generate_secure_secret_key(length: int = 64) -> str:
    """Генерує безпечний SECRET_KEY."""
    return secrets.token_urlsafe(length)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Створює JWT access token."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    try:
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logger.error(f"Failed to create JWT token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create access token"
        ) from e


def verify_token(token: str) -> dict[str, Any]:
    """Перевіряє JWT token."""
    try:
        payload: dict[str, Any] = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except PyJWTError as e:
        logger.warning("JWT verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    """Перевіряє силу паролю."""
    errors = []

    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")

    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")

    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")

    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one digit")

    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        errors.append("Password must contain at least one special character")

    return len(errors) == 0, errors


def check_security_configuration() -> dict:
    """Перевіряє конфігурацію безпеки."""
    issues = []
    warnings = []

    # Перевірка SECRET_KEY
    if not validate_secret_key():
        issues.append("SECRET_KEY is not secure or not set")

    # Перевірка DEBUG режиму
    if settings.DEBUG and settings.ENV == "production":
        issues.append("DEBUG mode is enabled in production")

    # Перевірка JWT алгоритму
    if settings.JWT_ALGORITHM not in ["HS256", "RS256"]:
        warnings.append(f"JWT algorithm {settings.JWT_ALGORITHM} may not be secure")

    # Перевірка терміну дії токена
    if settings.ACCESS_TOKEN_EXPIRE_MINUTES > 120:
        warnings.append("Access token expiry time is very long (>2 hours)")

    return {
        "secure": len(issues) == 0,
        "issues": issues,
        "warnings": warnings,
        "environment": settings.ENV,
    }


# Security middleware для перевірки конфігурації
def validate_security_on_startup():
    """Перевіряє безпеку при старті додатку."""
    security_check = check_security_configuration()

    if not security_check["secure"]:
        for issue in security_check["issues"]:
            logger.error(f"SECURITY ISSUE: {issue}")

        if settings.ENV == "production":
            logger.error(
                "Critical security issues detected in production. "
                "Please fix the following: " + ", ".join(security_check["issues"])
            )

    for warning in security_check["warnings"]:
        logger.warning(f"SECURITY WARNING: {warning}")

    logger.info("Security validation completed", extra=security_check)

    return security_check


async def get_current_user_payload(token: str = Depends(oauth2_scheme)) -> dict:
    """Dependency для отримання payload з токену.

    Emergency Mode: якщо Keycloak недоступний (NVIDIA офлайн),
    автоматично переключається на локальну JWT-валідацію.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не вдалося перевірити облікові дані",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:

        if settings.AUTH_PROVIDER == "keycloak":
            try:
                payload = await keycloak_auth.verify_token(token)
            except (HTTPException, Exception) as keycloak_err:
                # Emergency Fallback: Keycloak недоступний —
                # спробуємо валідувати як локальний JWT (SECRET_KEY)
                logger.warning(
                    "Keycloak недоступний, перехід на локальну JWT-валідацію: %s",
                    keycloak_err,
                )
                try:
                    payload = jwt.decode(
                        token,
                        settings.SECRET_KEY,
                        algorithms=[settings.JWT_ALGORITHM],
                    )
                except PyJWTError:
                    raise credentials_exception from keycloak_err

            # Keycloak mapping (працює і для локальних токенів)
            user_id: str = payload.get("sub")

            # role from realm_access
            realm_access = payload.get("realm_access", {})
            roles = realm_access.get("roles", [])

            # Fallback to attributes or custom claims
            user_role = payload.get("role")
            if not user_role and roles:
                # Зіставлення Keycloak ролей з системою PREDATOR
                predator_roles = ["admin", "analyst", "guest", "business", "bank", "gov", "journalist"]
                for r in roles:
                    if r in predator_roles:
                        user_role = r
                        break

            # Зберігаємо роль і tenant_id в payload
            payload["role"] = user_role or "guest"
            payload["tenant_id"] = payload.get("tenant_id", settings.ROOT_TENANT_ID)

        else:
            if settings.ENV in ["development", "testing"] and token == "test-token":
                payload = {
                    "sub": "b0000000-0000-0000-0000-000000000001",
                    "role": "admin",
                    "tenant_id": settings.ROOT_TENANT_ID,
                    "roles": ["admin", "analyst"]
                }
            else:
                payload = jwt.decode(
                    token,
                    settings.SECRET_KEY,
                    algorithms=[settings.JWT_ALGORITHM]
                )
            user_id: str = payload.get("sub")

        if user_id is None:
            raise credentials_exception
        return payload
    except PyJWTError as e:
        raise credentials_exception from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing token payload: {e}")
        raise credentials_exception from e
