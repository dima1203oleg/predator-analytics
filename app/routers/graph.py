from __future__ import annotations

from fastapi import APIRouter

from app.services.knowledge_graph import knowledge_graph_service


router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/summary")
async def get_graph_summary():
    """Get overall statistics of the knowledge graph."""
    return await knowledge_graph_service.get_summary()


@router.get("/search")
async def search_graph(query: str, depth: int = 2):
    """Search for entities and their surrounding relationship network."""
    # Simulation for UI v45 Semantic Radar
    return {
        "nodes": [
            {"id": "node-1", "name": query, "label": "ORGANIZATION", "properties": {"revenue": "1.2M"}},
            {"id": "node-2", "name": "Beneficiary X", "label": "PERSON", "properties": {"nationality": "UA"}},
            {"id": "node-3", "name": "Offshore Y", "label": "LOCATION", "properties": {"risk": "High"}},
        ],
        "edges": [
            {"id": "edge-1", "source": "node-1", "target": "node-2", "relation": "OWNED_BY", "weight": 1.0},
            {"id": "edge-2", "source": "node-1", "target": "node-3", "relation": "TRANSFERS_TO", "weight": 0.8},
        ],
    }


@router.post("/extract")
async def extract_knowledge(text: str):
    """Manually trigger knowledge extraction from text snippet."""
    entities = await knowledge_graph_service.extract_entities(text)
    edges = await knowledge_graph_service.build_relationships(entities)
    return {"nodes": entities, "edges": edges}
