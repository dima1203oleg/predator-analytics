"""PREDATOR OSINT Service — головний модуль FastAPI."""
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from app.config import get_settings
from app.routers import (
    domain_router,
    person_router,
    company_router,
    file_router,
    tools_router,
    maritime_router,
    trade_router,
    financial_router,
    ukraine_router,
    documents_router,
    social_router,
    frameworks_router,
    darkweb_router,
    geolocation_router,
    ukraine_registries_router,
    osint_2_0_router,
)

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("osint_service")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifecycle management для FastAPI."""
    settings = get_settings()
    logger.info(f"🚀 Запуск {settings.APP_NAME} v{settings.APP_VERSION}")

    # Перевіряємо доступність інструментів
    from app.tools import get_tool_registry
    registry = get_tool_registry()
    availability = await registry.check_availability()

    available = [k for k, v in availability.items() if v]
    unavailable = [k for k, v in availability.items() if not v]

    logger.info(f"✅ Доступні інструменти: {', '.join(available) or 'немає'}")
    if unavailable:
        logger.warning(f"⚠️ Недоступні інструменти: {', '.join(unavailable)}")

    yield

    logger.info("🛑 Зупинка OSINT Service...")


settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="PREDATOR Analytics OSINT Service — інтеграція з OSINT інструментами",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Роутери — Core OSINT
app.include_router(domain_router, prefix="/api/v1/osint")
app.include_router(person_router, prefix="/api/v1/osint")
app.include_router(company_router, prefix="/api/v1/osint")
app.include_router(file_router, prefix="/api/v1/osint")
app.include_router(tools_router, prefix="/api/v1/osint")

# Роутери — Maritime & Trade Intelligence
app.include_router(maritime_router, prefix="/api/v1/osint")
app.include_router(trade_router, prefix="/api/v1/osint")

# Роутери — Financial Intelligence
app.include_router(financial_router, prefix="/api/v1/osint")

# Роутери — Ukraine Registries
app.include_router(ukraine_router, prefix="/api/v1/osint")

# Роутери — Document Analysis
app.include_router(documents_router, prefix="/api/v1/osint")

# Роутери — Social Media
app.include_router(social_router, prefix="/api/v1/osint")

# Роутери — OSINT Frameworks
app.include_router(frameworks_router, prefix="/api/v1/osint")

# Роутери — Dark Web
app.include_router(darkweb_router, prefix="/api/v1/osint")

# Роутери — Geolocation
app.include_router(geolocation_router, prefix="/api/v1/osint")

# Роутери — Українські державні реєстри (70+)
app.include_router(ukraine_registries_router, prefix="/api/v1/osint")

# Роутери — OSINT 2.0 (People Search, Forensics, Knowledge Graph, International)
app.include_router(osint_2_0_router, prefix="/api/v1/osint")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/ready")
async def readiness_check():
    """Readiness check — перевірка готовності сервісу."""
    from app.tools import get_tool_registry

    registry = get_tool_registry()
    availability = await registry.check_availability()
    available_count = sum(1 for v in availability.values() if v)

    return {
        "ready": available_count > 0,
        "tools_available": available_count,
        "tools_total": len(availability),
    }


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
