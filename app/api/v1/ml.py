from __future__ import annotations

"""ML API Router
Provides endpoints for ML services: reranking, summarization.
"""
import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("api.ml")

router = APIRouter(prefix="/ml", tags=["Machine Learning"])


# ============================================================================
# Request/Response Models
# ============================================================================


class RerankRequest(BaseModel):
    query: str
    documents: list[dict[str, Any]]  # List of {id, title, content, ...}
    top_k: int = 10
    score_field: str = "content"  # 'title', 'content', or 'both'


class RerankResponse(BaseModel):
    results: list[dict[str, Any]]
    reranked: bool = True


class SummarizeRequest(BaseModel):
    text: str
    max_length: int = 130
    min_length: int = 30


class SummarizeResponse(BaseModel):
    summary: str
    model: str
    word_count: int


# ============================================================================
# Endpoints
# ============================================================================


@router.post("/rerank", response_model=RerankResponse)
async def rerank_documents(request: RerankRequest):
    """Rerank search results using Cross-Encoder model.

    Improves search relevance by scoring query-document pairs
    with a more accurate (but slower) transformer model.

    Args:
        query: Search query
        documents: List of documents with id, title, content
        top_k: Number of top results to return
        score_field: Field to use for scoring

    Returns:
        Reranked list of documents with relevance scores

    """
    try:
        from app.services.ml import get_reranker

        reranker = get_reranker()
        ranked = reranker.rerank(
            query=request.query,
            documents=request.documents,
            top_k=request.top_k,
            score_field=request.score_field,
        )

        # Format response
        results = []
        for doc, score in ranked:
            doc_with_score = dict(doc)
            doc_with_score["rerank_score"] = float(score)
            results.append(doc_with_score)

        logger.info(f"Reranked {len(request.documents)} docs -> top {len(results)}")

        return RerankResponse(results=results, reranked=True)

    except ImportError as e:
        logger.exception(f"ML service not available: {e}")
        raise HTTPException(
            status_code=503, detail="Reranker service not available. Install sentence-transformers."
        )
    except Exception as e:
        logger.exception(f"Reranking failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(request: SummarizeRequest):
    """Generate a summary for the provided text.

    Uses a transformer-based summarization model (T5/BART).

    Args:
        text: Full text to summarize
        max_length: Maximum summary length in tokens
        min_length: Minimum summary length in tokens

    Returns:
        Generated summary with metadata

    """
    try:
        from app.services.ml import get_summarizer

        summarizer = get_summarizer()
        summary = summarizer.summarize(
            text=request.text, max_length=request.max_length, min_length=request.min_length
        )

        if not summary:
            raise HTTPException(status_code=400, detail="Text too short or could not be summarized")

        word_count = len(summary.split())

        logger.info(f"Generated summary: {word_count} words")

        return SummarizeResponse(
            summary=summary, model="facebook/bart-large-cnn", word_count=word_count
        )

    except ImportError as e:
        logger.exception(f"Summarizer not available: {e}")
        raise HTTPException(
            status_code=503, detail="Summarizer service not available. Install transformers."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Summarization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def ml_health_check():
    """Check ML services availability."""
    status = {
        "reranker": False,
        "summarizer": False,
        "embedding": False,
        "augmentor": False,
        "xai": False,
    }

    try:
        from app.services.ml import get_reranker

        get_reranker()
        status["reranker"] = True
    except Exception:
        pass

    try:
        from app.services.ml import get_summarizer

        get_summarizer()
        status["summarizer"] = True
    except Exception:
        pass

    try:
        from app.services.embedding_service import EmbeddingService

        EmbeddingService()
        status["embedding"] = True
    except Exception:
        pass

    try:
        from app.services.ml import get_augmentor

        get_augmentor()
        status["augmentor"] = True
    except Exception:
        pass

    try:
        from app.services.ml import get_xai_service

        get_xai_service()
        status["xai"] = True
    except Exception:
        pass

    return {"status": "ok" if all(status.values()) else "partial", "services": status}


# ============================================================================
# Data Augmentation Endpoints (TZ v5.0)
# ============================================================================


class AugmentRequest(BaseModel):
    text: str
    method: str = "synonym"  # synonym, random, shuffle
    num_variations: int = 3


class AugmentResponse(BaseModel):
    original: str
    variations: list[str]
    method: str
    count: int


@router.post("/augment", response_model=AugmentResponse)
async def augment_text(request: AugmentRequest):
    """Generate synthetic variations of input text.

    Useful for expanding training datasets with diverse examples.

    Args:
        text: Original text to augment
        method: Augmentation method (synonym, random, shuffle)
        num_variations: Number of variations to generate

    Returns:
        List of augmented text variations

    """
    try:
        from app.services.ml import get_augmentor

        augmentor = get_augmentor()
        variations = augmentor.augment_text(
            text=request.text, method=request.method, num_variations=request.num_variations
        )

        logger.info(f"Generated {len(variations)} augmentations using '{request.method}'")

        return AugmentResponse(
            original=request.text,
            variations=variations,
            method=request.method,
            count=len(variations),
        )

    except Exception as e:
        logger.exception(f"Augmentation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class DatasetGenerateRequest(BaseModel):
    document_ids: list[str]  # Source document IDs
    method: str = "synonym"
    variations_per_doc: int = 2


@router.post("/datasets/generate")
async def generate_dataset(request: DatasetGenerateRequest):
    """Generate synthetic training dataset from existing documents.

    Creates augmented variations of source documents and stores
    them in augmented_datasets table for ML training.

    Args:
        document_ids: List of source document UUIDs
        method: Augmentation method
        variations_per_doc: Variations per document

    Returns:
        Summary of generated dataset

    """
    try:
        from app.services.document_service import document_service
        from app.services.ml import get_augmentor

        augmentor = get_augmentor()

        # Fetch source documents
        documents = []
        for doc_id in request.document_ids[:50]:  # Limit to 50
            doc = await document_service.get_document_by_id(doc_id)
            if doc:
                documents.append(doc)

        if not documents:
            raise HTTPException(status_code=404, detail="No valid documents found")

        # Generate augmented dataset
        augmented = augmentor.augment_dataset(
            documents=documents,
            tenant_id=documents[0]["tenant_id"],  # Group by tenant of first doc
            method=request.method,
            variations_per_doc=request.variations_per_doc,
        )

        # Store in augmented_datasets table
        import uuid

        from app.database import async_session_maker
        from app.libs.core.models import AugmentedDataset

        async with async_session_maker() as session:
            for item in augmented:
                aug_record = AugmentedDataset(
                    tenant_id=uuid.UUID(item["tenant_id"]),
                    original_id=uuid.UUID(item["original_id"]),
                    content=item["content"],
                    aug_type=item["aug_type"],
                )
                session.add(aug_record)
            await session.commit()

        logger.info(f"Generated dataset: {len(augmented)} variations from {len(documents)} docs")

        return {
            "status": "success",
            "source_documents": len(documents),
            "generated_variations": len(augmented),
            "method": request.method,
            "stored": True,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Dataset generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# XAI (Explainable AI) Endpoints (TZ v5.0)
# ============================================================================


class ExplainRequest(BaseModel):
    query: str
    document_id: str
    score: float = 0.0


@router.post("/explain")
async def explain_result(request: ExplainRequest):
    """Get XAI explanation for a search result.

    Explains why a document was ranked for a query using
    token importance analysis.

    Args:
        query: Search query
        document_id: Document to explain
        score: Relevance score

    Returns:
        Explanation with feature importance

    """
    try:
        from app.services.document_service import document_service
        from app.services.ml import get_xai_service

        xai = get_xai_service()

        # Fetch document content
        document = await document_service.get_document_by_id(request.document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        content = document.get("content", "")

        # Generate explanation
        explanation = xai.explain_rerank_score(
            query=request.query, document=content, score=request.score
        )

        return {
            "document_id": request.document_id,
            "query": request.query,
            "explanation": explanation,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Explanation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/explain/{document_id}")
async def explain_document(document_id: str, query: str):
    """Get XAI explanation for a document (GET variant).

    Args:
        document_id: Document UUID
        query: Search query (query param)

    Returns:
        Explanation with attention heatmap data

    """
    try:
        from app.services.document_service import document_service
        from app.services.ml import get_xai_service

        xai = get_xai_service()

        document = await document_service.get_document_by_id(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        content = document.get("content", "")

        # Get explanation with heatmap
        explanation = xai.explain_rerank_score(query, content, 0.0)
        heatmap = xai.generate_attention_heatmap(query, content)

        return {
            "document_id": document_id,
            "title": document.get("title"),
            "explanation": explanation,
            "attention_heatmap": heatmap,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Explanation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
# ============================================================================
# Training Endpoints (v4.2.0)
# ============================================================================

class TrainForecastRequest(BaseModel):
    product_code: str
    include_market_data: bool = True
    limit: int = 1000

@router.post("/train/forecast")
async def train_forecast(request: TrainForecastRequest):
    """Trigger training for a demand forecast model."""
    try:
        from app.services.ml import get_training_service

        # 1. Fetch data for training (Market/Customs data)
        # In real scenario, this would query the DB.
        # Here we simulate data gathering if DB is sparse.
        training_data = []
        if request.include_market_data:
            # Mocking some trend data for the demonstration
            from datetime import datetime, timedelta
            import random
            now = datetime.now()
            for i in range(24): # 2 years of monthly data
                date = (now - timedelta(days=30 * (24 - i))).strftime("%Y-%m-%d")
                training_data.append({
                    "date": date,
                    "volume": 1000 + (i * 50) + random.randint(-200, 200) # upward trend
                })

        service = get_training_service()
        result = await service.train_forecast_model(request.product_code, training_data)

        if result["status"] == "failed":
            raise HTTPException(status_code=400, detail=result["error"])

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Training failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")
async def list_models():
    """List all available ML models and their statuses."""
    from app.services.ml import get_training_service
    service = get_training_service()
    return {"models": service.model_registry}

@router.get("/train/status/{product_code}")
async def get_train_status(product_code: str):
    """Get training status and metrics for a product model."""
    from app.services.ml import get_training_service
    service = get_training_service()
    status = service.get_model_status(product_code)
    if not status:
        raise HTTPException(status_code=404, detail=f"No model found for {product_code}")
    return status
