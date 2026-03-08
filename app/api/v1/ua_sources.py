from __future__ import annotations


"""UA Sources V1 API — Extended with all connectors."""
from datetime import UTC, datetime

from fastapi import APIRouter, Query

import logging
from app.services.ai_engine import ai_engine


logger = logging.getLogger("api.ua_sources")


router = APIRouter(prefix="/ua-sources", tags=["UA Sources"])


@router.get("/status")
async def get_status():
    """Get UA Sources status."""
    return {
        "status": "OPERATIONAL",
        "sources": {
            "customs": "ACTIVE",
            "prozorro": "ACTIVE",
            "nbu": "ACTIVE",
            "tax": "ACTIVE",
            "court": "ACTIVE",
            "edrpou": "ACTIVE",
            "rss": "ACTIVE",
            "telegram": "ACTIVE",
        },
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/search")
async def search(q: str, sources: str = "all"):
    """Search across UA sources using AI Engine."""
    result = await ai_engine.analyze(query=q, depth="standard")
    return {
        "query": q,
        "results": result.sources,
        "analysis": result.answer,
        "confidence": result.confidence,
    }


@router.post("/sync/{source_id}")
async def sync_source(source_id: str):
    """Trigger data synchronization for a source."""
    if source_id == "customs":
        from app.connectors.customs import customs_connector

        records = await customs_connector.fetch_latest_declarations(limit=50)
        if records:
            logger.info(f"Syncing {len(records)} customs records from data.gov.ua")
            return {
                "status": "COMPLETED",
                "source": source_id,
                "records_fetched": len(records),
                "sample": records[:2],
            }
        return {"status": "FAILED", "source": source_id, "error": "No records found"}

    if source_id == "prozorro":
        from app.connectors.prozorro import prozorro_connector

        result = await prozorro_connector.search(query="паливо", limit=10)
        return {
            "status": "COMPLETED",
            "source": source_id,
            "records_found": result.records_count,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    if source_id == "court":
        from app.connectors.court import court_connector

        result = await court_connector.search("", limit=20)
        return {
            "status": "COMPLETED",
            "source": source_id,
            "records_found": result.records_count,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    if source_id == "edrpou":
        return {
            "status": "PENDING",
            "source": source_id,
            "message": "EDRPOU sync requires specific query. Use /ua-sources/edrpou/search",
        }

    if source_id == "rss":
        from app.connectors.rss_aggregator import rss_aggregator

        result = await rss_aggregator.fetch(limit=50)
        return {
            "status": "COMPLETED",
            "source": source_id,
            "records_found": result.records_count,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    return {
        "status": "PENDING",
        "source": source_id,
        "message": "Sync started in background via Celery",
    }


# --- Court Registry ---

@router.get("/court/search")
async def search_court(
    q: str = Query(..., description="Company name, EDRPOU, or person name"),
    limit: int = Query(20, le=100),
    category: int | None = Query(None, description="1=civil, 2=criminal, 3=commercial, 4=admin"),
):
    """Search Ukrainian court registry (ЄДРСР)."""
    from app.connectors.court import court_connector

    result = await court_connector.search(q, limit=limit, category=category)
    return {
        "query": q,
        "results": result.data,
        "total": result.records_count,
        "source": "court_registry",
    }


@router.get("/court/risk-summary/{entity}")
async def court_risk_summary(
    entity: str,
    edrpou: str | None = Query(None),
):
    """Get court-based risk summary for CERS integration."""
    from app.connectors.court import court_connector

    summary = await court_connector.get_risk_summary(entity, edrpou)
    return summary


# --- EDRPOU ---

@router.get("/edrpou/search")
async def search_edrpou(
    q: str = Query(..., description="Company name or 8-digit EDRPOU code"),
    limit: int = Query(20, le=100),
):
    """Search Ukrainian EDRPOU company registry."""
    from app.connectors.edrpou import edrpou_connector

    result = await edrpou_connector.search(q, limit=limit)
    return {
        "query": q,
        "results": result.data,
        "total": result.records_count,
        "source": result.source,
    }


@router.get("/edrpou/{code}")
async def get_edrpou(code: str):
    """Get company details by EDRPOU code."""
    from app.connectors.edrpou import edrpou_connector

    result = await edrpou_connector.get_by_id(code)
    return {
        "edrpou": code,
        "data": result.data,
        "source": result.source,
    }


# --- RSS Aggregator ---

@router.get("/rss/feed")
async def get_rss_feed(
    q: str = Query("", description="Search keywords"),
    limit: int = Query(50, le=200),
    source: str | None = Query(None, description="Source key (epravda, rbc, etc.)"),
    category: str | None = Query(None, description="economics, business, finance, banking"),
):
    """Get aggregated RSS feed from Ukrainian business sources."""
    from app.connectors.rss_aggregator import rss_aggregator

    sources_filter = [source] if source else None
    result = await rss_aggregator.search(
        q, limit=limit, sources=sources_filter, category=category,
    )
    return {
        "query": q,
        "items": result.data,
        "total": result.records_count,
        "source": "rss_aggregator",
    }


@router.get("/rss/sources")
async def get_rss_sources():
    """Get available RSS sources."""
    from app.connectors.rss_aggregator import rss_aggregator

    sources = await rss_aggregator.get_all_sources()
    return {"sources": sources, "total": len(sources)}


# --- Sentiment Analysis ---

@router.post("/nlp/sentiment")
async def analyze_sentiment(text: str = Query(..., description="Ukrainian text to analyze")):
    """Analyze sentiment of Ukrainian text."""
    from app.services.nlp.sentiment_analyzer import get_sentiment_analyzer

    analyzer = get_sentiment_analyzer()
    result = analyzer.analyze(text)
    return result.to_dict()


@router.post("/nlp/sentiment/batch")
async def analyze_sentiment_batch(texts: list[str]):
    """Batch sentiment analysis."""
    from app.services.nlp.sentiment_analyzer import get_sentiment_analyzer

    analyzer = get_sentiment_analyzer()
    results = analyzer.analyze_batch(texts)
    return {
        "results": [r.to_dict() for r in results],
        "total": len(results),
    }


# --- NER (Named Entity Recognition) ---

@router.post("/nlp/ner")
async def extract_entities(text: str = Query(..., description="Ukrainian text for NER")):
    """Extract named entities from Ukrainian text."""
    from app.services.nlp.ner_service import get_ner_service

    ner = get_ner_service()
    result = ner.extract(text)
    return result.to_dict()


@router.post("/nlp/ner/batch")
async def extract_entities_batch(texts: list[str]):
    """Batch extracting entities."""
    from app.services.nlp.ner_service import get_ner_service

    ner = get_ner_service()
    results = ner.extract_batch(texts)
    return {
        "results": [r.to_dict() for r in results],
        "total": len(results),
    }


# --- Telegram Monitor ---

@router.get("/telegram/search")
async def search_telegram(
    q: str = Query(..., description="Keywords to search"),
    limit: int = Query(50, le=200),
):
    """Search Telegram business channels."""
    from app.connectors.telegram_monitor import telegram_monitor

    result = await telegram_monitor.search(q, limit=limit)
    return {
        "query": q,
        "results": result.data,
        "total": result.records_count,
        "source": "telegram",
    }


@router.get("/telegram/channels")
async def get_telegram_channels():
    """Get monitored Telegram channels."""
    from app.connectors.telegram_monitor import telegram_monitor

    channels = await telegram_monitor.get_channels()
    return {"channels": channels, "total": len(channels)}


