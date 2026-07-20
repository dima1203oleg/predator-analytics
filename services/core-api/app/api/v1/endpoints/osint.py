from typing import Any, Dict
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

router = APIRouter()

class ScanRequest(BaseModel):
    entity_id: str
    entity_type: str
    name: str

@router.get("/search", summary="Пошук OSINT-сутностей")
async def search_entities(q: str):
    """Пошук сутностей (тимчасовий заглушковий метод для UI)."""
    # In a real implementation, this would query Neo4j or Postgres.
    return []

@router.get("/entity/{entity_id}/timeline", summary="Отримати таймлайн сутності")
async def get_entity_timeline(entity_id: str):
    """Повертає історію подій з OSINT-джерел для конкретної сутності."""
    # In a real implementation, this would query ClickHouse or Neo4j.
    return {"timeline": []}

@router.post("/scan/start", summary="Запустити OSINT-сканування")
async def start_scan(req: ScanRequest) -> Dict[str, Any]:
    """Відправляє запит на сканування у Kafka."""
    from app.services.kafka_service import get_kafka_service
    import json
    
    kafka_service = get_kafka_service()
    
    payload = {
        "job_id": f"osint-{req.entity_id}-{req.entity_type}",
        "entity_id": req.entity_id,
        "name": req.name,
        "entity_type": req.entity_type,
        "action": "run_osint_scan"
    }
    
    # We will publish to a generic ingestion raw topic for now, 
    # the worker can route it based on action.
    await kafka_service.produce(
        topic="predator.tenant.default.ingestion.raw",
        value=json.dumps(payload).encode("utf-8"),
        key=req.entity_id.encode("utf-8")
    )
    
    return {"status": "scan_started", "entity_id": req.entity_id, "job_id": payload["job_id"]}
