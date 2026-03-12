"""CORS Configuration - Production Ready.

Cross-Origin Resource Sharing налаштування для frontend.
"""

from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings

settings = get_settings()


def get_cors_origins() -> list[str]:
    """Отримати список дозволених CORS origins."""
    origins_value = getattr(settings, 'CORS_ORIGINS', None)
    if not origins_value:
        return []

    # Якщо вже список - повертаємо як є
    if isinstance(origins_value, list):
        return [str(o).strip() for o in origins_value if o]

    # Якщо рядок - парсимо
    if isinstance(origins_value, str):
        origins = [origin.strip() for origin in origins_value.split(',')]
        return [origin for origin in origins if origin]

    return []


def add_cors_middleware(app):
    """Додати CORS middleware до FastAPI додатку."""
    origins = get_cors_origins()

    # Default origins для development
    if not origins and settings.ENV == "development":
        origins = [
            "http://localhost:3000",
            "http://localhost:3030",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3030",
        ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=getattr(settings, 'CORS_ALLOW_CREDENTIALS', True),
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
        expose_headers=["X-Process-Time", "X-Request-ID"],
    )

    return origins
