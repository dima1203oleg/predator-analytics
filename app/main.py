from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timezone
import logging
import os
from pathlib import Path
import sys
from typing import Any, Dict, List, Optional
import uuid

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.libs.core.cache import get_cache
from app.libs.core.config import settings
from app.libs.core.mq import broker
from app.libs.core.otel import setup_otel
from app.libs.core.structured_logger import get_logger, log_business_event, setup_structured_logging


# 🦁 PREDATOR SUPER-APP CORE INITIALIZED
logger = get_logger("predator.api.main")

# Autonomous AI Orchestration
from libs.core.autonomy.orchestrator import orchestrator
from libs.core.autonomy.pulse_agent import SystemPulseAgent

app = FastAPI(
    title="Predator Analytics v55.0 API",
    description="Економічний радар: система раннього попередження, аналізу ризиків та інформаційної переваги",
    version="55.0.0"
)

# Initialize OpenTelemetry
setup_otel(app, "predator_backend")

# Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🆕 Import v45 Routers
from app.api.routers import auth as auth_router
from app.api.routers import council as council_router
from app.api.routers import customs as customs_router
from app.api.routers import e2e as testing_router
from app.api.routers import health as health_router
from app.api.routers import opponent as opponent_router
from app.api.routers import search as search_router
from app.api.routers import som as som_router
from app.api.routers import stats as stats_router
from app.routers.datasets import router as datasets_router
from app.routers.graph import router as graph_router
from app.routers.ingest import router as ingestion_router
from app.routers.insights import router as insights_router
from app.routers.newspaper import router as newspaper_router
from app.routers.pipelines import router as pipelines_router


# ============================================================================
# API ROUTER INCLUSION
# ============================================================================

# v45 Feature Set
app.include_router(ingestion_router, prefix="/api/v1")
app.include_router(datasets_router, prefix="/api/v1")
app.include_router(pipelines_router, prefix="/api/v1")
app.include_router(insights_router, prefix="/api/v1")
app.include_router(graph_router, prefix="/api/v1")
app.include_router(newspaper_router, prefix="/api/v1")

# Core Modules
app.include_router(auth_router.router, prefix="/api/v1")
app.include_router(stats_router.router, prefix="/api/v1")
app.include_router(search_router.router, prefix="/api/v1")
app.include_router(health_router.router, prefix="/api/v45")
app.include_router(council_router.router, prefix="/api/v1")
app.include_router(opponent_router.router, prefix="/api/v1")
app.include_router(testing_router.router, prefix="/api/v1")
app.include_router(customs_router.router, prefix="/api/v1")
app.include_router(som_router.router, prefix="/api/v1")

# v32 Autonomous Response
try:
    from app.routers import azr as azr_router
    app.include_router(azr_router.router, prefix="/api/v1")
except ImportError:
    logger.warning("AZR Router not found")

# ============================================================================
# v55 API v2 (Strangler Fig: parallel to v1)
# ============================================================================
try:
    from app.api.v2.router import v2_router
    app.include_router(v2_router)
    logger.info("v2 API routers mounted at /api/v2")
except ImportError as e:
    logger.warning("v2 routers not available: %s", e)

# ============================================================================
# STARTUP & UTILS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    logger.info("PREDATOR_V55_BOOT_START", mode="SOVEREIGN")

    # Connect to Message Broker
    try:
        await asyncio.wait_for(broker.connect(), timeout=5.0)
        logger.info("✅ Event Bus connected")
    except Exception as e:
        logger.warning(f"Event Bus connection failed: {e}")

    # Start Autonomous Response Engine if available
    try:
        from app.services.azr_engine_v32 import azr_engine_v32
        await azr_engine_v32.start()
        app.state.azr = azr_engine_v32
        logger.info("✅ AZR v32 Engine STARTED")
    except Exception as e:
        logger.warning(f"AZR Engine failed to start: {e}")

    # Initialize and Start Sovereign Agents (v45)
    try:
        pulse_agent = SystemPulseAgent(api_base_url="http://localhost:8000")
        orchestrator.register_agent(pulse_agent)
        await orchestrator.start()
        app.state.agents = orchestrator
        logger.info("✅ Sovereign Agents (v45) INITIALIZED")
    except Exception as e:
        logger.error(f"Sovereign Agents failed to start: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    await orchestrator.stop()
    await broker.disconnect()
    logger.info("PREDATOR_SHUTDOWN_COMPLETE")

@app.get("/")
async def root():
    return {
        "system": "PREDATOR",
        "version": "55.0.0",
        "status": "OPERATIONAL",
        "autonomy_level": "SOVEREIGN",
        "timestamp": datetime.now(UTC).isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
