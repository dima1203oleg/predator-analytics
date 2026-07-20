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

@router.get("/entity/{entity_id}/graph", summary="Отримати граф OSINT-досьє")
async def get_entity_graph(entity_id: str):
    """Отримує граф (вузли та зв'язки) з Neo4j для Cytoscape.js."""
    from app.services.cache_service import cache_service
    
    cache_key = f"osint:graph:{entity_id}"
    cached_graph = await cache_service.get(cache_key)
    if cached_graph:
        return cached_graph
        
    from app.services.neo4j_service import Neo4jService
    neo4j = Neo4jService()
    
    # Query Neo4j for the ego network of the entity (depth 2)
    cypher = """
    MATCH (n {id: $entity_id})-[r*1..2]-(m)
    WITH collect(distinct n) + collect(distinct m) as all_nodes, collect(distinct r) as all_rels
    UNWIND all_nodes as node
    WITH collect(distinct node) as unique_nodes, all_rels
    
    // Format nodes for Cytoscape
    WITH [n IN unique_nodes | {
        data: {
            id: n.id,
            label: n.name,
            type: labels(n)[0],
            risk: n.risk_score,
            is_root: n.id = $entity_id
        }
    }] AS cytoscape_nodes, all_rels
    
    // Format edges
    UNWIND all_rels as path_rels
    UNWIND path_rels as rel
    WITH cytoscape_nodes, collect(distinct rel) as unique_rels
    WITH cytoscape_nodes, [r IN unique_rels | {
        data: {
            id: toString(id(r)),
            source: startNode(r).id,
            target: endNode(r).id,
            relation: type(r),
            risk: r.risk
        }
    }] AS cytoscape_edges
    
    RETURN cytoscape_nodes as nodes, cytoscape_edges as edges
    """
    
    async with await neo4j._get_session() as session:
        result = await session.run(cypher, entity_id=entity_id)
        record = await result.single()
        
        response_data = {"nodes": [], "edges": []}
        if record:
            response_data = {
                "nodes": record["nodes"],
                "edges": record["edges"]
            }
            
        await cache_service.set(cache_key, response_data, ttl=900) # Cache for 15 mins
        return response_data

@router.get("/entity/{entity_id}/timeline", summary="Отримати таймлайн сутності")
async def get_entity_timeline(entity_id: str):
    """Повертає історію подій з OSINT-джерел для конкретної сутності."""
    # In a real implementation, this would query ClickHouse or Neo4j.
    return {"timeline": []}

@router.post("/scan/start", summary="Запустити OSINT-сканування")
async def start_scan(req: ScanRequest) -> Dict[str, Any]:
    """Відправляє запит на сканування у Kafka."""
    from app.services.kafka_service import get_kafka_service
    from app.services.cache_service import cache_service
    import json
    
    cache_key = f"osint:scan:lock:{req.entity_id}"
    cached_job = await cache_service.get(cache_key)
    if cached_job:
        return {"status": "scan_already_in_progress", "entity_id": req.entity_id, "job_id": cached_job}
    
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
    
    # Prevent duplicate scans within 1 hour
    await cache_service.set(cache_key, payload["job_id"], ttl=3600)
    
    return {"status": "scan_started", "entity_id": req.entity_id, "job_id": payload["job_id"]}
