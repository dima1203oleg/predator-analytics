"""Sources Router - Ukrainian Data Sources with REAL API connections"""
from fastapi import APIRouter, Body, HTTPException
from datetime import datetime, timezone
from typing import Dict, Any, List
import httpx
import logging
import asyncio

router = APIRouter(prefix="/sources", tags=["Sources"])
logger = logging.getLogger(__name__)


# Ukrainian Data Sources Configuration
UA_SOURCES = {
    "prozorro": {
        "name": "Prozorro (Тендери)",
        "type": "API",
        "url": "https://api.prozorro.gov.ua",
        "test_endpoint": "https://api.prozorro.gov.ua/api/2.5/tenders?limit=1",
        "description": "Публічні закупівлі України",
        "records_estimate": 12500000
    },
    "edr": {
        "name": "ЄДР (Єдиний держреєстр)",
        "type": "API",
        "url": "https://data.gov.ua",
        "test_endpoint": "https://data.gov.ua/api/3/action/package_list?limit=1",
        "description": "Реєстр юридичних осіб",
        "records_estimate": 5200000
    },
    "customs": {
        "name": "Митні декларації",
        "type": "API",
        "url": "https://data.gov.ua",
        "test_endpoint": "https://data.gov.ua/api/3/action/package_search?q=customs",
        "description": "Імпорт/експорт статистика",
        "records_estimate": 8900000
    },
    "court": {
        "name": "Судовий реєстр",
        "type": "API",
        "url": "https://reyestr.court.gov.ua",
        "test_endpoint": "https://reyestr.court.gov.ua/",
        "description": "Реєстр судових рішень",
        "records_estimate": 42000000
    },
    "sanctions": {
        "name": "Санкційні списки",
        "type": "API",
        "url": "https://nazk.gov.ua",
        "test_endpoint": "https://corruptinfo.nazk.gov.ua/",
        "description": "НАЗК санкції та корупційні записи",
        "records_estimate": 15000
    },
    "nbu": {
        "name": "НБУ курси валют",
        "type": "API",
        "url": "https://bank.gov.ua",
        "test_endpoint": "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json",
        "description": "Офіційні курси валют",
        "records_estimate": 50000
    },
    "opendatabot": {
        "name": "OpenDataBot",
        "type": "API",
        "url": "https://opendatabot.ua",
        "test_endpoint": "https://opendatabot.ua/api/",
        "description": "Агрегатор відкритих даних",
        "records_estimate": 10000000
    }
}


async def test_source_connection(source_id: str) -> Dict[str, Any]:
    """Test connection to a data source"""
    source = UA_SOURCES.get(source_id)
    if not source:
        return {"status": "UNKNOWN", "error": f"Unknown source: {source_id}"}
    
    try:
        start = datetime.now(timezone.utc)
        async with httpx.AsyncClient() as client:
            resp = await client.get(source["test_endpoint"], timeout=10, follow_redirects=True)
            latency = (datetime.now(timezone.utc) - start).total_seconds() * 1000
            
            return {
                "status": "ACTIVE" if resp.status_code < 400 else "DEGRADED",
                "latency_ms": round(latency, 2),
                "http_code": resp.status_code,
                "message": "Connection successful" if resp.status_code < 400 else f"HTTP {resp.status_code}"
            }
    except httpx.TimeoutException:
        return {"status": "TIMEOUT", "error": "Connection timeout (10s)"}
    except Exception as e:
        return {"status": "ERROR", "error": str(e)}


@router.get("/")
async def list_sources():
    """List all Ukrainian data sources with real-time status"""
    sources = []
    
    # Check all sources in parallel
    tasks = []
    for source_id, config in UA_SOURCES.items():
        tasks.append(test_source_connection(source_id))
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    for (source_id, config), result in zip(UA_SOURCES.items(), results):
        status = "ERROR"
        if isinstance(result, dict):
            status = result.get("status", "ERROR")
        
        sources.append({
            "id": source_id,
            "name": config["name"],
            "type": config["type"],
            "status": status,
            "url": config["url"],
            "description": config["description"],
            "records_estimate": config["records_estimate"],
            "last_check": datetime.now(timezone.utc).isoformat()
        })
    
    return sources


@router.get("/connectors")
async def list_connectors():
    """List connectors (alias for sources)"""
    return await list_sources()


@router.get("/list")
async def list_sources_by_type(type: str = None):
    """List sources filtered by type"""
    all_sources = await list_sources()
    
    if type:
        return [s for s in all_sources if s["type"].upper() == type.upper()]
    
    return all_sources


@router.get("/{source_id}")
async def get_source(source_id: str):
    """Get source details"""
    config = UA_SOURCES.get(source_id)
    if not config:
        raise HTTPException(status_code=404, detail=f"Source not found: {source_id}")
    
    status = await test_source_connection(source_id)
    
    return {
        "id": source_id,
        "name": config["name"],
        "type": config["type"],
        "url": config["url"],
        "description": config["description"],
        "records_estimate": config["records_estimate"],
        "status": status.get("status", "UNKNOWN"),
        "latency_ms": status.get("latency_ms", 0),
        "last_sync": datetime.now(timezone.utc).isoformat()
    }


@router.post("/{source_id}/test")
@router.post("/connectors/{source_id}/test")
async def test_source(source_id: str):
    """Test source connection"""
    result = await test_source_connection(source_id)
    return {
        "source_id": source_id,
        **result
    }


@router.post("/{source_id}/sync")
@router.post("/connectors/{source_id}/sync")
async def sync_source(source_id: str):
    """Trigger source sync (starts background job)"""
    config = UA_SOURCES.get(source_id)
    if not config:
        raise HTTPException(status_code=404, detail=f"Source not found: {source_id}")
    
    try:
        # Import task here to avoid circular dependencies
        from app.tasks.ua_sources import sync_source_task
        
        # Trigger Celery Task
        task = sync_source_task.delay(source_id)
        
        logger.info(f"Started sync job {task.id} for {source_id}")
        
        return {
            "source_id": source_id,
            "sync_id": task.id,
            "status": "STARTED",
            "message": f"Sync task queued for {config['name']}",
            "estimated_records": config["records_estimate"]
        }
    except Exception as e:
        logger.error(f"Failed to queue sync task: {e}")
        raise HTTPException(status_code=503, detail="Task queue unavailable")


@router.get("/{source_id}/health")
async def check_source_health(source_id: str):
    """Check source health"""
    result = await test_source_connection(source_id)
    return {
        "source_id": source_id,
        "healthy": result.get("status") == "ACTIVE",
        "latency_ms": result.get("latency_ms", 0),
        "last_check": datetime.now(timezone.utc).isoformat(),
        **result
    }
