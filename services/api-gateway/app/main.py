from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import sys
import os
from pathlib import Path

# Add project root to sys.path to ensure 'libs' is importable
# Current: apps/backend/app/main.py -> Root is 4 levels up
# Add project root to sys.path to ensure 'libs' is importable
try:
    # Try finding root relative to this file
    current_path = Path(__file__).resolve()
    # If in Docker /app/app/main.py -> root is /app (parents[1])
    # If local apps/backend/app/main.py -> root is project root (parents[3])

    if Path("/app").exists():
        ROOT_DIR = Path("/app")
    else:
        ROOT_DIR = current_path.parents[3]

    if str(ROOT_DIR) not in sys.path:
        sys.path.append(str(ROOT_DIR))
except Exception as e:
    logging.warning(f"Could not automatically set ROOT_DIR: {e}")

from libs.core.mq import broker
from libs.core.config import settings
from libs.core.logger import setup_logger

logger = setup_logger("predator.backend.main")

from app.agents.orchestrator.supervisor import NexusSupervisor
from app.services.model_router import ModelRouter
from app.services.avatar_service import AvatarService
from app.services.minio_service import MinIOService
from app.services.etl_ingestion import ETLIngestionService
from app.services.opensearch_indexer import OpenSearchIndexer
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
from app.services.document_service import document_service
from app.api.routers import metrics as metrics_router
from app.api.routers import search as search_router, auth as auth_router, stats as stats_router
from app.api.v1 import ml as ml_router
from app.routers import sources as sources_router
from app.api.v1 import optimizer as optimizer_router
from app.api.v1 import testing as testing_router
from app.api.v1 import integrations as integrations_v1_router
from app.api.v1 import nexus as nexus_router
from app.api.v1 import federation as federation_router
from app.api.routers import argocd_webhook as argocd_webhook_router


# Fix path for src imports
if os.path.exists("/app/src"):
    if "/app" not in sys.path:
        sys.path.append("/app")

from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# Security Configuration (v26)
SECURE_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
}

from src.ingestion import router as ingestion_router

# Logging setup
from libs.core.structured_logger import get_logger, log_business_event
from libs.core.cache import get_cache

logger = get_logger("predator.api.main")

# Database
from app.database import init_db

# Middleware
from app.middleware import (
    RateLimitMiddleware,
    MetricsMiddleware,
    RequestLoggingMiddleware,
    ErrorHandlerMiddleware
)
from app.api.routers import health as health_router

app = FastAPI(
    title="Predator Analytics v25.0 API",
    description="AI-Native Multi-Agent Analytics Platform with Semantic Search & Auto-Optimization",
    version="22.0.0"
)

# Add Middleware (Order matters - last added is first run)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimitMiddleware, requests_per_minute=100)
app.add_middleware(MetricsMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(ErrorHandlerMiddleware)

# Mount Static Files (Web Interface)
try:
    if not os.path.exists("app/static"):
        os.makedirs("app/static")
    app.mount("/static", StaticFiles(directory="app/static"), name="static")
except Exception as e:
    logger.warning(f"Could not mount static files: {e}")


# ============================================================================
# MIDDLEWARE SETUP (v26 Security)
# ============================================================================

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "194.177.1.240", "predator.ua"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://194.177.1.240", "http://localhost"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    for key, value in SECURE_HEADERS.items():
        response.headers[key] = value
    return response

# ============================================================================
# CORE SERVICES (Lazy Initialization for Fast Startup)
# ============================================================================

# Service singletons - initialized on first use
_services = {}

def get_supervisor():
    if 'supervisor' not in _services:
        _services['supervisor'] = NexusSupervisor()
    return _services['supervisor']

def get_model_router():
    if 'model_router' not in _services:
        _services['model_router'] = ModelRouter()
    return _services['model_router']

def get_avatar_service():
    if 'avatar_service' not in _services:
        _services['avatar_service'] = AvatarService()
    return _services['avatar_service']

def get_minio_service():
    if 'minio_service' not in _services:
        _services['minio_service'] = MinIOService()
    return _services['minio_service']

def get_etl_service():
    if 'etl_service' not in _services:
        _services['etl_service'] = ETLIngestionService()
    return _services['etl_service']

def get_opensearch_indexer():
    if 'opensearch_indexer' not in _services:
        _services['opensearch_indexer'] = OpenSearchIndexer()
    return _services['opensearch_indexer']

def get_embedding_service():
    if 'embedding_service' not in _services:
        _services['embedding_service'] = EmbeddingService()
    return _services['embedding_service']

def get_qdrant_service():
    if 'qdrant_service' not in _services:
        _services['qdrant_service'] = QdrantService()
    return _services['qdrant_service']

# Backward compatibility aliases
class _LazyServiceProxy:
    def __init__(self, getter):
        self._getter = getter

    def __getattr__(self, name):
        return getattr(self._getter(), name)

supervisor = _LazyServiceProxy(get_supervisor)
model_router = _LazyServiceProxy(get_model_router)
avatar_service = _LazyServiceProxy(get_avatar_service)

# ============================================================================
# STARTUP: Initialize Services & AutoOptimizer
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """
    Initialize all services on application startup:
    1. Qdrant collection initialization
    2. AutoOptimizer background loop (self-improvement cycle)
    """
    import asyncio

    logger.info("🚀 Starting Predator Analytics v25.0...")

    # 0. Initialize Database & Guardian (Non-fatal)
    try:
        await asyncio.wait_for(init_db(), timeout=5.0)
        from libs.core.guardian import guardian
        # Initial fix
        recovery = await guardian.run_auto_recovery()
        logger.info(f"✅ Database initialized. Guardian Fixes: {recovery.get('fixed_issues', [])}")

        # Start background loop
        asyncio.create_task(guardian.start())
        logger.info("🛡️ Guardian Self-Healing loop ACTIVATED in background.")
    except Exception as e:
        logger.warning(f"⚠️ Database/Guardian initialization failed: {e}. Backend will continue.")

    # 0.5 Initialize Cache Service
    try:
        cache = get_cache()
        await cache.connect()
        logger.info("✅ Redis Cache Service connected")
    except Exception as e:
        logger.warning(f"⚠️ Redis Cache failed to connect: {e}")

    # 1. Initialize Qdrant collection (lazy)
    try:
        qdrant = get_qdrant_service()
        await qdrant.create_collection()
        logger.info("✅ Qdrant collection ready")
    except Exception as e:
        logger.warning(f"⚠️ Qdrant initialization failed (will retry on first use): {e}")

    # 2. Preload ML models (optional, prevents OOM on small instances)
    if os.getenv("PRELOAD_MODELS", "false").lower() == "true":
        try:
            logger.info("📦 Preloading ML models into memory...")
            from app.services.ml import get_reranker, get_summarizer

            # Force model loading at startup
            _ = get_reranker()
            logger.info("✅ Reranker model preloaded (CrossEncoder)")

            _ = get_summarizer()
            logger.info("✅ Summarizer model preloaded")

            # Preload embedding service
            embedder = get_embedding_service()
            await embedder.generate_embedding_async("warmup")
            logger.info("✅ Embedding model preloaded (MiniLM)")

            logger.info("🎯 All ML models cached - hybrid search will be fast!")
        except Exception as e:
            logger.warning(f"⚠️ ML model preloading failed (will load on first use): {e}")
    else:
        logger.info("⏩ Skipping ML model preloading (Lazy Loading enabled). Models will load on first request.")

    # 3. Start AutoOptimizer background loop
    try:
        from app.services.autonomous_optimizer import autonomous_optimizer
        await autonomous_optimizer.start()
        logger.info("🧠 Autonomous Optimizer STARTED - detecting data drift every 10 mins")
        logger.info("📊 Monitoring: quality gates, latency, cost, accuracy")
        logger.info("🔄 Optimization cycle: Every 15 minutes")
    except Exception as e:
        logger.warning(f"⚠️ AutoOptimizer failed to start: {e}")

    # 4. Connect to Event Bus (Non-fatal)
    try:
        await asyncio.wait_for(broker.connect(), timeout=5.0)
    except Exception as e:
        logger.warning(f"⚠️ Event Bus connection failed: {e}")

    # 5. Start Global Guardian (v26 Self-Healing)
    try:
        from libs.core.guardian import guardian
        asyncio.create_task(guardian.start())  # Run in background
        app.state.guardian = guardian
        logger.info("🛡️ Guardian System initialized (v26.0)")
    except Exception as e:
        logger.error(f"❌ Guardian init failed: {e}")

@app.get("/system/health/v26")
async def system_health_v26():
    """Return v26 Self-Healing Status"""
    g = getattr(app.state, "guardian", None)
    if not g:
        return {"status": "guardian_inactive"}

    last_check = g.health_history[-1] if g.health_history else {}
    return {
        "status": "active",
        "guardian_mode": "unbreakable",
        "last_check": last_check
    }

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources on shutdown"""
    logger.info("🛑 Shutting down Predator Analytics...")
    await broker.close()

    # Stop Guardian (handled internally if needed, or we explicitly stop guardian if exposing stop method)
    # Since we don't have guardian imported here, let's skip explicit stop or add guardian stop.
    # Actually, guardian is a global singleton, but let's leave it daemon-like or stop effectively.
    # For now, just removing the explicit etl_arbiter.stop as it's not even started here anymore.

    # Close cache connection
    try:
        cache = get_cache()
        await cache.close()
    except Exception as e:
        logger.warning(f"Error closing cache: {e}")

class AnalyzeRequest(BaseModel):
    query: str
    mode: str = "auto"  # auto, fast, deep
    filters: Optional[Dict[str, Any]] = None



@app.post("/api/v1/analyze")
async def analyze(request: AnalyzeRequest):
    """
    Main entry point for analytical queries.
    Delegates to NEXUS SUPERVISOR.
    """
    try:
        result = await supervisor.handle_request(request.query, mode=request.mode)
        return result
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SEMANTIC SEARCH PLATFORM API (TS-Compliant)
# ============================================================================

# Endpoint moved to app/api/routers/search.py
# @app.get("/api/v1/search")
# ... (removed duplicate endpoint to fix conflict with search_router)

@app.get("/api/v1/documents/{doc_id}")
async def get_document(doc_id: str):
    """
    Get full document details by ID.

    Args:
        doc_id: Document identifier

    Returns:
        Complete document with all fields
    """
    try:
        # Fetch from PostgreSQL gold schema using DocumentService
        document = await document_service.get_document_by_id(doc_id)

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        return document

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document fetch failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch document")


@app.delete("/api/v1/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete document by ID."""
    try:
        existing = await document_service.get_document_by_id(doc_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Document not found")

        ok = await document_service.delete_document(doc_id)
        if not ok:
            raise HTTPException(status_code=500, detail="Failed to delete document")

        return {"success": True, "id": doc_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document delete failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete document")


@app.get("/api/v1/documents/{doc_id}/summary")
async def get_document_summary(doc_id: str, max_length: int = 130):
    """
    Get or generate summary for a document.

    Uses ML summarization model (BART/T5) to generate concise summaries.
    Results are cached in database for future requests.

    Args:
        doc_id: Document identifier
        max_length: Maximum summary length in tokens

    Returns:
        {summary: str, cached: bool, word_count: int}
    """
    try:
        # First, check if document exists and get content
        document = await document_service.get_document_by_id(doc_id)

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        # Check if summary already exists in database (cache hit)
        cached_summary = await document_service.get_summary(doc_id)
        if cached_summary:
            return {
                "summary": cached_summary["summary"],
                "cached": True,
                "word_count": cached_summary["word_count"] or len(cached_summary["summary"].split()),
                "model": cached_summary["model_name"]
            }

        # Generate new summary using ML service
        try:
            from app.services.ml import get_summarizer
            summarizer = get_summarizer()

            content = document.get("content", "")
            if len(content) < 100:
                short_summary = content
                # Cache short content as summary too to avoid re-checking
                await document_service.save_summary(
                    doc_id, short_summary, model_name="no-op", word_count=len(short_summary.split())
                )
                return {
                    "summary": short_summary,
                    "cached": False,
                    "word_count": len(short_summary.split()),
                    "note": "Content too short for summarization"
                }

            summary = summarizer.summarize(content, max_length=max_length)

            if summary:
                # Cache summary in database
                word_count = len(summary.split())
                await document_service.save_summary(
                    doc_id, summary, model_name="bart-large-cnn", word_count=word_count
                )

                return {
                    "summary": summary,
                    "cached": False,
                    "word_count": word_count,
                    "model": "bart-large-cnn"
                }
            else:
                raise HTTPException(status_code=500, detail="Summarization failed")

        except ImportError:
            raise HTTPException(
                status_code=503,
                detail="Summarizer service not available"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Summary generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate summary")

# ============================================================================
# AUTH ENDPOINTS (TS-Compliant)
# ============================================================================


# Duplicate profile route removed in favor of auth_router

@app.post("/api/v1/llm/chat")
async def chat_llm(model: str, messages: List[Dict[str, str]]):
    """
    Direct access to ModelRouter for chat interfaces.
    """
    try:
        response = await model_router.chat_completion(model, messages)
        return {"content": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AvatarRequest(BaseModel):
    text: str
    emotion: str = "neutral"

@app.post("/api/v1/avatar/interact")
async def avatar_interact(request: AvatarRequest):
    """
    Endpoint for talking avatar interaction.
    """
    try:
        return await avatar_service.interact(request.text, "user", request.emotion)
    except Exception as e:
        logger.error(f"Avatar error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import UploadFile, File
import tempfile
import os as os_module



async def process_pipeline_background(
    temp_file_path: str,
    dataset_type: str,
    original_filename: str,
    minio_object_name: str
):
    """
    Background Task: Executes the full ETL -> Indexing -> Gold Layer pipeline.
    """
    logger.info(f"Background pipeline started for: {original_filename}")
    try:
        # Lazy load services
        etl_service = get_etl_service()
        opensearch_indexer = get_opensearch_indexer()
        embedding_service = get_embedding_service()
        qdrant_service = get_qdrant_service()

        # Step 2: ETL Processing
        etl_result = await etl_service.process_file(temp_file_path, dataset_type)

        if etl_result["status"] != "success":
            logger.error(f"ETL Background failed: {etl_result.get('error')}")
            return

        # Step 3: Index to OpenSearch + Qdrant (Dual Indexing)
        index_name = "documents_safe"
        await opensearch_indexer.create_index(index_name)

        documents = etl_result.get("documents", [])

        if documents:
            await opensearch_indexer.index_documents(
                index_name=index_name,
                documents=documents,
                pii_safe=True,
                embedding_service=embedding_service,
                qdrant_service=qdrant_service
            )

            # Step 4: Populate Gold Layer (PostgreSQL documents table)
            import uuid
            import pandas as pd
            from datetime import datetime
            from app.models import Document
            from app.core.db import async_session_maker

            async with async_session_maker() as session:
                for doc_data in documents:
                    # Clean the doc_data for JSON serialization
                    clean_meta = {}
                    for k, v in doc_data.items():
                        if isinstance(v, (pd.Timestamp, datetime, uuid.UUID)):
                            clean_meta[k] = str(v)
                        else:
                            clean_meta[k] = v

                    # Create document record
                    doc = Document(
                        id=uuid.uuid4(),
                        tenant_id=uuid.UUID("00000000-0000-0000-0000-000000000000"), # Default tenant
                        title=f"{dataset_type.capitalize()} Entry: {doc_data.get('decl_number', 'Unknown')}",
                        content=doc_data.get('description', str(doc_data)),
                        source_type=dataset_type,
                        meta=clean_meta
                    )
                    session.add(doc)
                await session.commit()
                logger.info(f"✅ Promoted {len(documents)} docs to Gold Layer (PostgreSQL)")

        logger.info(f"Pipeline completed successfully for {original_filename}")

    except Exception as e:
        logger.error(f"Background Pipeline Fatal Error: {e}")
    finally:
        # Cleanup temp file
        if os_module.path.exists(temp_file_path):
            os_module.unlink(temp_file_path)

@app.post("/api/v1/data/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    dataset_type: str = "customs",
    background_tasks: BackgroundTasks = None
):
    """
    Upload and process a dataset file.
    Pipeline: Upload → MinIO → [Background: ETL → PostgreSQL → OpenSearch]
    Response: Immediate "queued" status.
    """
    logger.info(f"Received file upload: {file.filename} [Type: {dataset_type}]")

    # Save to temp file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os_module.path.splitext(file.filename)[1])
    try:
        # Stream file to disk in chunks to avoid OOM
        CHUNK_SIZE = 1024 * 1024 * 10  # 10MB chunks
        with open(temp_file.name, "wb") as buffer:
            while content := await file.read(CHUNK_SIZE):
                buffer.write(content)
        temp_file.close()

        # Step 1: Upload to MinIO (raw-data bucket)
        minio_service = get_minio_service()
        object_name = f"{dataset_type}/{file.filename}"
        await minio_service.upload_file("raw-data", object_name, temp_file.name, file.content_type)

        # Trigger Background Processing (if tasks available)
        if background_tasks:
            background_tasks.add_task(
                process_pipeline_background,
                temp_file.name,
                dataset_type,
                file.filename,
                object_name
            )
        else:
            # Fallback for sync execution (should not happen in FastAPI)
            await process_pipeline_background(temp_file.name, dataset_type, file.filename, object_name)

        return {
            "status": "queued",
            "file": file.filename,
            "minio_path": f"raw-data/{object_name}",
            "message": "File uploaded and processing queued in background"
        }

    except Exception as e:
        logger.error(f"Upload failed: {e}")
        # Cleanup if we failed before queuing
        if os_module.path.exists(temp_file.name):
            os_module.unlink(temp_file.name)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# INCLUDE TS-COMPLIANT ROUTERS
# ============================================================================

# Auth endpoints (register, login, profile)
app.include_router(auth_router.router, prefix="/api/v1")

# Stats/Analytics endpoints
app.include_router(stats_router.router, prefix="/api/v1")

# Search endpoints
app.include_router(search_router.router, prefix="/api/v1")

# Prometheus Metrics endpoint
app.include_router(metrics_router.router)

# ML Services endpoints (rerank, summarize, augment, explain)
app.include_router(ml_router.router, prefix="/api/v1")

# AutoOptimizer endpoints (status, trigger, metrics)
app.include_router(optimizer_router.router, prefix="/api/v1")

# QA Lab Testing endpoints
app.include_router(testing_router.router, prefix="/api/v1")

# External Integrations endpoint (v1 API - Nexus)
app.include_router(integrations_v1_router.router, prefix="/api/v1")

# Nexus Hivemind (Chat/Voice)
app.include_router(nexus_router.router, prefix="/api/v1")

# Federation Protocol (Edge Nodes)
app.include_router(federation_router.router, prefix="/api/v1")

# System Infrastructure & Health
from app.routers import system as system_router
app.include_router(system_router.router, prefix="/api/v1")

# Diagnostics & Health Check (New)
from app.api.routers import diagnostics_api
app.include_router(diagnostics_api.router, prefix="/api/v1")

# Full System Health Router
app.include_router(health_router.router)
# Fix for UI compatibility (expects /api/v1/health)
app.include_router(health_router.router, prefix="/api/v1")

# v25 Premium Features (Consolidated in app/api/v25_routes.py)
# from app.routers import v25 as v25_router
# app.include_router(v25_router.router, prefix="/api/v25")

# Data Sources Management
app.include_router(sources_router.router, prefix="/api/v1")

# Data Hub (v25 - Canonical Entities)
from app.api.v1 import data_hub as data_hub_router
app.include_router(data_hub_router.router, prefix="/api/v1")

# Ingestion System (New)
app.include_router(ingestion_router.router, prefix="/api/v1")

# Database Management
from app.routers import databases as databases_router
app.include_router(databases_router.router, prefix="/api/v1")

# Neural Council (AI Brain)
from app.api.routers import council as council_router
app.include_router(council_router.router, prefix="/api/v1")

# Opponent / Red Team
from app.api.routers import opponent as opponent_router
app.include_router(opponent_router.router, prefix="/api/v1")

# LLM Management
from app.api.routers import llm_management as llm_mgmt_router
app.include_router(llm_mgmt_router.router, prefix="/api/v1")

# Triple Agent (Trinity Core v25)
from app.api.v1 import trinity as trinity_router
app.include_router(trinity_router.router, prefix="/api/v1/trinity", tags=["Trinity"])

# Integrations (Slack, Notion, etc.)
from app.routers import integrations as integrations_router
app.include_router(integrations_router.router, prefix="/api/v1")

# Analytics & Stats
from app.routers import analytics as analytics_router
app.include_router(analytics_router.router, prefix="/api/v1")

# Security Infrastructure
from app.routers import security as security_router
app.include_router(security_router.router, prefix="/api/v1")

# Knowledge Graph (GraphRAG)
from app.api.routers import graph as graph_router
app.include_router(graph_router.router, prefix="/api/v1")

# Cases Management (Центральна цінність PREDATOR)
from app.api.routers import cases as cases_router
app.include_router(cases_router.router, prefix="/api/v1")

# Mission Planner (AI Agent Coordination)
from app.api.routers import missions as missions_router
app.include_router(missions_router.router)

# Evolution System
from app.routers import evolution as evolution_router
app.include_router(evolution_router.router, prefix="/api/v1")

# V25 Premium System (System Monitoring, ML Jobs, Arbitration, Trinity)
from app.api import v25_routes
app.include_router(v25_routes.v25_router, prefix="/api")


# V25 Copilot (Gemini Agent)
from app.api.routers import copilot as copilot_router
app.include_router(copilot_router.router, prefix="/api/v1/copilot", tags=["Copilot"])

# Alertmanager Webhook Handler
from app.api import webhook_routes
app.include_router(webhook_routes.webhook_router, prefix="/api")

# ArgoCD webhook handler (receives ArgoCD webhooks and notifies / triggers rollback)
app.include_router(argocd_webhook_router.router, prefix="/api")


# ============================================================================
# DOCUMENTS LIST ENDPOINT
# ============================================================================

@app.get("/api/v1/documents")
async def list_documents(
    limit: int = 20,
    offset: int = 0,
    category: str = None,
    source: str = None
):
    """
    List documents with pagination and filters.

    Args:
        limit: Max number of results (default 20)
        offset: Pagination offset
        category: Filter by category
        source: Filter by source

    Returns:
        {documents: [...], total: int, limit: int, offset: int}
    """
    try:
        result = await document_service.list_documents(
            limit=limit,
            offset=offset,
            category=category,
            source_type=source
        )
        return result
    except Exception as e:
        logger.error(f"List documents failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to list documents")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
