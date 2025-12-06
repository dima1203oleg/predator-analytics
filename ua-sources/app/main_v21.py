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

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("predator.api")

app = FastAPI(
    title="Predator Analytics v21.0 API",
    description="AI-Native Multi-Agent Analytics Platform with Semantic Search",
    version="21.0.0"
)

# Initialize Core Services
supervisor = NexusSupervisor()
model_router = ModelRouter()
avatar_service = AvatarService()
minio_service = MinIOService()
etl_service = ETLIngestionService()
opensearch_indexer = OpenSearchIndexer()
embedding_service = EmbeddingService()
qdrant_service = QdrantService()

# Startup event: Initialize Qdrant collection
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Starting Predator Analytics v21.0...")
    
    try:
        # Create Qdrant collection if not exists
        await qdrant_service.create_collection()
        logger.info("Qdrant collection ready")
    except Exception as e:
        logger.warning(f"Qdrant initialization failed (will retry on first use): {e}")

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
        # Fetch from PostgreSQL gold schema
        # For now, return mock data
        # TODO: Implement actual database query
        
        return {
            "id": doc_id,
            "title": "Sample Document",
            "content": "Full document content would be here...",
            "author": "System",
            "published_date": "2025-12-05T00:00:00Z",
            "category": "general",
            "source": "predator"
        }
        
    except Exception as e:
        logger.error(f"Document fetch failed: {e}")
        raise HTTPException(status_code=404, detail="Document not found")

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
        index_name = f"{dataset_type}_safe"
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



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
