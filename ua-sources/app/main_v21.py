from fastapi import FastAPI, HTTPException, BackgroundTasks
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
from app.api.v1 import integrations as integrations_router
from app.api.v1 import nexus as nexus_router
from app.services.search_fusion import hybrid_search_with_rrf
from app.services.auto_optimizer import get_auto_optimizer

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("predator.api")

app = FastAPI(
    title="Predator Analytics v21.0 API",
    description="AI-Native Multi-Agent Analytics Platform with Semantic Search & Auto-Optimization",
    version="21.0.0"
)

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
supervisor = property(lambda self: get_supervisor())
model_router = property(lambda self: get_model_router())

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
    
    # 2. Start AutoOptimizer background loop
    try:
        optimizer = get_auto_optimizer()
        asyncio.create_task(optimizer.start_optimization_loop(interval_minutes=15))
        logger.info("🤖 AutoOptimizer started - system will self-improve automatically")
        logger.info("📊 Monitoring: quality gates, latency, cost, accuracy")
        logger.info("🔄 Optimization cycle: Every 15 minutes")
    except Exception as e:
        logger.warning(f"⚠️ AutoOptimizer failed to start: {e}")

class AnalyzeRequest(BaseModel):
    query: str
    mode: str = "auto"  # auto, fast, deep
    filters: Optional[Dict[str, Any]] = None

@app.get("/health")
async def health_check():
    """Health check endpoint for K8s liveness/readiness probes."""
    return {"status": "ok", "version": "21.0.0", "service": "predator-analytics"}

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

class SearchRequest(BaseModel):
    q: str  # Query string
    semantic: bool = True  # Enable semantic search
    category: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None

@app.get("/api/v1/search")
async def search_documents(q: str, semantic: bool = True, category: Optional[str] = None, limit: int = 10):
    """
    Hybrid search endpoint (TS-compliant).
    Combines OpenSearch (keywords) + Qdrant (semantic similarity).
    
    Args:
        q: Search query
        semantic: Enable semantic search (default: True)
        category: Filter by category
        limit: Number of results (default: 10)
    
    Returns:
        List of search results with scores
    """
    try:
        all_results = {}  # Use dict to deduplicate by ID
        
        # Step 1: OpenSearch keyword search
        logger.info(f"OpenSearch keyword search: {q}")
        os_results = await opensearch_indexer.search("documents_safe", q, size=limit)
        
        for hit in os_results.get("hits", {}).get("hits", []):
            source = hit["_source"]
            doc_id = hit["_id"]
            
            # Extract highlight if available
            highlight = hit.get("highlight", {})
            snippet = highlight.get("content", [source.get("content", "")[:200]])[0]
            if not snippet.endswith("..."):
                snippet += "..."
            
            all_results[doc_id] = {
                "id": doc_id,
                "title": source.get("title", "Untitled"),
                "snippet": snippet,
                "score": hit["_score"],
                "semanticScore": None,
                "source": source.get("source", "unknown"),
                "category": source.get("category"),
                "searchType": "keyword"
            }
        
        # Step 2: Semantic search (Qdrant)
        if semantic:
            logger.info(f"Qdrant semantic search: {q}")
            try:
                # Generate query embedding asynchronously
                query_embedding = await embedding_service.generate_embedding_async(q)
                
                # Build filter conditions
                filter_conditions = {}
                if category:
                    filter_conditions["category"] = category
                
                # Search in Qdrant
                semantic_results = await qdrant_service.search(
                    query_vector=query_embedding,
                    limit=limit,
                    filter_conditions=filter_conditions if filter_conditions else None
                )
                
                # Merge semantic results
                for result in semantic_results:
                    doc_id = result["id"]
                    metadata = result["metadata"]
                    
                    if doc_id in all_results:
                        # Update existing result with semantic score
                        all_results[doc_id]["semanticScore"] = result["score"]
                        all_results[doc_id]["searchType"] = "hybrid"
                    else:
                        # Add new semantic result
                        all_results[doc_id] = {
                            "id": doc_id,
                            "title": metadata.get("title", "Untitled"),
                            "snippet": metadata.get("snippet", ""),
                            "score": 0,  # No keyword score
                            "semanticScore": result["score"],
                            "source": metadata.get("source", "unknown"),
                            "category": metadata.get("category"),
                            "searchType": "semantic"
                        }
                
                logger.info(f"Found {len(semantic_results)} semantic matches")
                
            except Exception as e:
                logger.warning(f"Semantic search failed (continuing with keyword results): {e}")
        
        # Step 3: Rank and return results
        # Combine scores: keyword_score + (semantic_score * 10) for hybrid ranking
        results_list = list(all_results.values())
        for result in results_list:
            combined_score = result["score"]
            if result["semanticScore"]:
                combined_score += result["semanticScore"] * 10
            result["combinedScore"] = combined_score
        
        # Sort by combined score
        results_list.sort(key=lambda x: x["combinedScore"], reverse=True)
        
        # Limit results
        results_list = results_list[:limit]
        
        # Log search for analytics (non-blocking)
        import asyncpg
        import os
        try:
            search_type = "hybrid" if semantic else "keyword"
            db_url = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db")
            conn = await asyncpg.connect(db_url)
            await conn.execute("""
                INSERT INTO gold.search_logs (query, search_type, results_count, filters)
                VALUES ($1, $2, $3, $4)
            """, q, search_type, len(results_list), {"category": category} if category else None)
            await conn.close()
        except Exception as log_err:
            logger.debug(f"Search logging failed (non-critical): {log_err}")
        
        return {
            "results": results_list,
            "total": len(results_list),
            "searchType": "hybrid" if semantic else "keyword"
        }
        
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
        
        # Check if summary already exists in document
        if document.get("summary"):
            return {
                "summary": document["summary"],
                "cached": True,
                "word_count": len(document["summary"].split())
            }
        
        # Generate new summary using ML service
        try:
            from app.services.ml import get_summarizer
            summarizer = get_summarizer()
            
            content = document.get("content", "")
            if len(content) < 100:
                return {
                    "summary": content,
                    "cached": False,
                    "word_count": len(content.split()),
                    "note": "Content too short for summarization"
                }
            
            summary = summarizer.summarize(content, max_length=max_length)
            
            if summary:
                # TODO: Cache summary in database
                # await document_service.update_summary(doc_id, summary)
                
                return {
                    "summary": summary,
                    "cached": False,
                    "word_count": len(summary.split())
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

# External Integrations endpoint
app.include_router(integrations_router.router, prefix="/api/v1")

# Nexus Hivemind (Chat/Voice)
app.include_router(nexus_router.router, prefix="/api/v1")



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

