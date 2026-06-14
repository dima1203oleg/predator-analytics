"""
ADV-DVS FastAPI application v61.0-ELITE.
Autonomous Deployment Validation & DOM Verification System.
"""
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator, Dict, Any

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .orchestrator import AdvDvsOrchestrator

logger = logging.getLogger("adv_dvs")

# ─── Lifespan ────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Життєвий цикл додатку"""
    logger.info("ADV-DVS v61.0-ELITE запущено")
    yield
    logger.info("ADV-DVS зупинено")

# ─── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ADV-DVS — Autonomous Deployment Validation System",
    description=(
        "Повна автономна перевірка системи за 17 рівнями: Infra, Backend, Frontend, "
        "Sync, Databases, ETL, Parsers, Integrations, Datasets, AutoML, LLM, "
        "AI Pipelines, DataFlow, Performance, Security, Backup, E2E."
    ),
    version="61.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

orchestrator = AdvDvsOrchestrator()
latest_run_result = None

# ─── Ендпоїнти ───────────────────────────────────────────────────────────────

@app.get("/health", summary="Статус сервісу ADV-DVS")
async def health() -> dict[str, str]:
    return {"status": "ok", "version": "61.0.0"}

@app.post("/api/v1/validate/all", summary="Запустити повну перевірку (12 рівнів)")
async def validate_all(chaos_mode: bool = False) -> Dict[str, Any]:
    """Запускає повну перевірку та формує звіт і DRI."""
    global latest_run_result
    result = await orchestrator.run_all(chaos_mode=chaos_mode)
    latest_run_result = result
    return result

@app.get("/api/v1/validate/level/{level_id}", summary="Запустити перевірку конкретного рівня")
async def validate_level(level_id: int) -> Dict[str, Any]:
    return await orchestrator.run_level(level_id)

@app.get("/api/v1/reports/latest", summary="Отримати останній звіт")
async def get_latest_report() -> Dict[str, Any]:
    return latest_run_result or {"status": "no_data", "message": "No validation run yet"}

@app.get("/api/v1/reports/download/{format}", summary="Завантажити звіт")
async def download_report(format: str):
    """Формати: json, html, pdf, xlsx"""
    file_path = f"/app/reports/deployment_audit.{format}"
    return FileResponse(file_path, filename=f"deployment_audit.{format}")
