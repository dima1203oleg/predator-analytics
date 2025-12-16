from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging

from app.agents.orchestrator.supervisor import NexusSupervisor
from app.services.model_router import ModelRouter
from app.services.avatar_service import AvatarService
from app.services.minio_service import MinIOService
from app.services.etl_ingestion import ETLIngestionService
from app.services.opensearch_indexer import OpenSearchIndexer
from app.services.auth_service import get_current_user, auth_service
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
from app.services.document_service import document_service
from app.api.routers import auth as auth_router
from app.api.routers import stats as stats_router
from app.api.routers import metrics as metrics_router
from app.api.routers import search as search_router
from app.api.v1 import ml as ml_router
from app.api.v1 import optimizer as optimizer_router
from app.api.v1 import testing as testing_router
from app.api.v1 import integrations as integrations_v1_router
from app.api.v1 import nexus as nexus_router
from app.api.v1 import federation as federation_router
from app.api.routers import argocd_webhook as argocd_webhook_router
from src.ingestion import router as ingestion_router
from app.services.search_fusion import hybrid_search_with_rrf
from app.services.auto_optimizer import get_auto_optimizer

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("predator.api")

# Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.middleware import (
    RateLimitMiddleware,
    MetricsMiddleware,
    RequestLoggingMiddleware,
    ErrorHandlerMiddleware
)
from app.api.routers import health as health_router

app = FastAPI(
    title="Predator Analytics v22.0 API",
    description="AI-Native Multi-Agent Analytics Platform with Semantic Search & Auto-Optimization",
    version="22.0.0"
)

# Add Middleware (Order matters!)
app.add_middleware(BaseHTTPMiddleware, dispatch=ErrorHandlerMiddleware(app).dispatch)
app.add_middleware(BaseHTTPMiddleware, dispatch=RequestLoggingMiddleware().dispatch)
app.add_middleware(BaseHTTPMiddleware, dispatch=MetricsMiddleware().dispatch)
# Rate limiting could be conditional or selective, adding globally for now
app.add_middleware(BaseHTTPMiddleware, dispatch=RateLimitMiddleware().dispatch)

# Mount Static Files (Web Interface)
try:
    import os
    if not os.path.exists("app/static"):
        os.makedirs("app/static")
    app.mount("/static", StaticFiles(directory="app/static"), name="static")
except Exception as e:
    logger.warning(f"Could not mount static files: {e}")


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

    logger.info("🚀 Starting Predator Analytics v21.0...")

    # 1. Initialize Qdrant collection (lazy)
    try:
        qdrant = get_qdrant_service()
        await qdrant.create_collection()
        logger.info("✅ Qdrant collection ready")
    except Exception as e:
        logger.warning(f"⚠️ Qdrant initialization failed (will retry on first use): {e}")

    # 2. Preload ML models (optional, prevents OOM on small instances)
    import os
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
        # optimizer = get_auto_optimizer()
        # asyncio.create_task(optimizer.start_optimization_loop(interval_minutes=15))
        # logger.info("🤖 AutoOptimizer started - system will self-improve automatically")
        logger.info("📊 Monitoring: quality gates, latency, cost, accuracy")
        logger.info("🔄 Optimization cycle: Every 15 minutes")
    except Exception as e:
        logger.warning(f"⚠️ AutoOptimizer failed to start: {e}")

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

from fastapi import Depends

@app.get("/api/v1/auth/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """
    Get current user profile.
    Requires authentication (JWT token).
    """
    return {
        "user_id": user["user_id"],
        "username": user["username"],
        "email": user["email"],
        "roles": user["roles"],
        "subscription": "pro" if user["can_view_pii"] else "free"
    }

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

@app.post("/api/v1/data/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    dataset_type: str = "customs",
    background_tasks: BackgroundTasks = None
):
    """
    Upload and process a dataset file.
    Pipeline: Upload → MinIO → ETL → PostgreSQL → OpenSearch
    """
    logger.info(f"Received file upload: {file.filename} [Type: {dataset_type}]")

    # Save to temp file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os_module.path.splitext(file.filename)[1])
    try:
        content = await file.read()
        temp_file.write(content)
        temp_file.close()

        # Lazy load services
        minio_service = get_minio_service()
        etl_service = get_etl_service()
        opensearch_indexer = get_opensearch_indexer()
        embedding_service = get_embedding_service()
        qdrant_service = get_qdrant_service()

        # Step 1: Upload to MinIO (raw-data bucket)
        object_name = f"{dataset_type}/{file.filename}"
        await minio_service.upload_file("raw-data", object_name, temp_file.name, file.content_type)

        # Step 2: ETL Processing
        etl_result = await etl_service.process_file(temp_file.name, dataset_type)

        if etl_result["status"] != "success":
            raise HTTPException(status_code=400, detail=etl_result.get("error", "ETL failed"))

        # Step 3: Index to OpenSearch + Qdrant (Dual Indexing)
        # For now, we'll do it synchronously for simplicity
        # In production, use Celery/background tasks
        index_name = "documents_safe"
        await opensearch_indexer.create_index(index_name)

        documents = etl_result.get("documents", [])
        indexing_result = {}

        if documents:
            indexing_result = await opensearch_indexer.index_documents(
                index_name=index_name,
                documents=documents,
                pii_safe=True,
                embedding_service=embedding_service,
                qdrant_service=qdrant_service
            )
            # Remove documents from response to keep it light
            etl_result.pop("documents", None)

        return {
            "status": "success",
            "file": file.filename,
            "minio_path": f"raw-data/{object_name}",
            "etl": etl_result,
            "indexing": indexing_result,
            "message": "File processed successfully"
        }

    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp file
        if os_module.path.exists(temp_file.name):
            os_module.unlink(temp_file.name)


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

# Data Sources Management
from app.routers import sources as sources_router
app.include_router(sources_router.router, prefix="/api/v1")

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

# Integrations (Slack, Notion, etc.)
from app.routers import integrations as integrations_router
app.include_router(integrations_router.router, prefix="/api/v1")

# Analytics & Stats
from app.routers import analytics as analytics_router
app.include_router(analytics_router.router, prefix="/api/v1")

# Security Infrastructure
from app.routers import security as security_router
app.include_router(security_router.router, prefix="/api/v1")

# Evolution System
from app.routers import evolution as evolution_router
app.include_router(evolution_router.router, prefix="/api/v1")

# V22 Self-Improvement System
from app.api import v22_routes
app.include_router(v22_routes.v22_router, prefix="/api")


# V22 Copilot (Gemini Agent)
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
            source=source
        )
        return result
    except Exception as e:
        logger.error(f"List documents failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to list documents")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
