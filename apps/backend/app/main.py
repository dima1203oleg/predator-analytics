import os
import sys
import asyncio
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Add project root to sys.path to ensure 'libs' is importable
current_file = Path(__file__).resolve()
# Check if we are in Docker (/app/app/main.py) or local development
if current_file.parts[-4] == "apps":
    # Local: repo-root/apps/backend/app/main.py
    ROOT_DIR = current_file.parents[3]
else:
    # Docker or other: /app/app/main.py
    ROOT_DIR = current_file.parents[1]

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from libs.core.config import settings
from libs.core.logger import setup_logger
from libs.core.database import init_db, close_db
from libs.core.mq import broker

# Initialize logger
logger = setup_logger("predator.api", level=settings.LOG_LEVEL)

app = FastAPI(
    title="Predator Analytics v25.0 API",
    description="AI-Native Multi-Agent Analytics Platform (Clean V25 Core)",
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Startup events: DB and MQ initialization"""
    logger.info("🚀 Запуск Predator Analytics v25.0...")
    
    # 1. Initialize Database
    try:
        await init_db()
        logger.info("✅ Базу даних ініціалізовано")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}", exc_info=True)

    # 2. Connect to RabbitMQ
    try:
        await broker.connect()
        logger.info("✅ Шину подій підключено")
    except Exception as e:
        logger.warning(f"⚠️ Event Bus unavailable: {e}")

    # 3. Start Guardian loop
    try:
        from libs.core.guardian import guardian
        asyncio.create_task(guardian.start())
        logger.info("🛡️ Цикл самовідновлення Guardian АКТИВОВАНО.")
    except Exception as e:
        logger.warning(f"⚠️ Guardian start failed: {e}")

    # 4. Start Nerve Monitor (V25 Market Intelligence)
    try:
        from libs.core.nerve_monitor import nerve_monitor
        asyncio.create_task(nerve_monitor.start())
        logger.info("🧠 Моніторинг Нервової Системи запущено.")
    except Exception as e:
        logger.warning(f"⚠️ Nerve Monitor start failed: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown events: cleanup connections"""
    logger.info("🛑 Бекенд завершує роботу...")
    await close_db()
    await broker.close()

# ============================================================================
# INCLUDE ROUTERS (RELIABLE ONLY)
# ============================================================================

# V25 Canonical Routes (Primary UI Support)
from app.api.v25_routes import v25_router
app.include_router(v25_router, prefix="/api/v1")

# Ingestion System (V25 implementation)
from app.api.ingestion import router as ingestion_router
app.include_router(ingestion_router, prefix="/api/v1")

# Health & Diagnostics
from app.api.routers import health, graph
app.include_router(health.router, prefix="/api/v1")
app.include_router(graph.router, prefix="/api/v1")

# Market Nerve System
from app.api.nerve_routes import nerve_router
app.include_router(nerve_router, prefix="/api/v1")

# Health check for Docker/K8s probes
@app.get("/health")
async def health_proxy():
    """Satisfy internal container health checks"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# Root endpoint
@app.get("/")
async def root():
    return {
        "app": "Predator Analytics",
        "version": "v25.0",
        "status": "online",
        "documentation": "/api/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
