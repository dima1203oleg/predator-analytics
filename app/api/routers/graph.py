from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.services.auth_service import get_current_user
from app.services.document_service import document_service
from app.services.graph_service import graph_builder


logger = logging.getLogger(__name__)

router = APIRouter(tags=["Knowledge Graph"])


@router.post("/graph/build/{doc_id}")
async def build_graph_for_document(
    doc_id: str, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)
):
    """Trigger LLM-based Knowledge Graph extraction for a specific document.
    Runs in background.
    """
    try:
        # Fetch doc content
        # Note: document_service might need update if it doesn't return dict with content
        doc = await document_service.get_document_by_id(doc_id)

        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        # Get Tenant ID (mock if not in user token)
        tenant_id = user.get("tenant_id")
        if not tenant_id:
            # For development, generate a consistent mock UUID based on user_id or random
            tenant_id = str(uuid.uuid4())

        content = doc.get("content")
        if not content:
            raise HTTPException(status_code=400, detail="Document has no content")

        # Run extraction in background
        background_tasks.add_task(graph_builder.extract_and_build, doc_id, content, tenant_id)

        return {"status": "accepted", "message": "Graph extraction started", "doc_id": doc_id}

    except Exception as e:
        logger.exception(f"Graph trigger error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/graph/search")
async def search_knowledge_graph(q: str, depth: int = 1, user: dict = Depends(get_current_user)):
    """Search the Knowledge Graph for entities and their connections."""
    try:
        # Get Tenant ID (mock if not in user token)
        tenant_id = user.get("tenant_id")
        if not tenant_id:
            tenant_id = str(uuid.uuid4())

        result = await graph_builder.search_graph(q, tenant_id, depth)

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return result
    except Exception as e:
        logger.exception(f"Graph search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        logger.exception(f"Graph summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/graph/visualize")
async def visualize_neural_nexus(mode: str = "live", limit: int = 100, user: dict = Depends(get_current_user)):
    """Generate 3D graph visualization data for Neural Nexus.
    Modes:
    - live: Real data from DB
    - simulation: Procedurally generated threats for demo.
    """
    from datetime import datetime
    import random

    if mode == "simulation":
        # Generate high-tech looking simulation data
        nodes = []
        links = []

        # Threat Clusters

        # Central node (Self)
        nodes.append({
            "id": "predator_core",
            "label": "PREDATOR CORE",
            "type": "system",
            "riskScore": 0,
            "connections": 50,
            "details": "Central Intelligence Unit. Status: ONLINE. Monitoring 15,420 streams.",
        })

        for i in range(limit):
            is_threat = random.random() > 0.8
            node_type = random.choice(["company", "person", "document", "server", "wallet"])

            risk_score = random.randint(60, 100) if is_threat else random.randint(0, 40)

            label = f"Entity_{i:04d}"
            if node_type == "company":
                label = f"Shell Corp {random.randint(100, 999)} Ltd"
            elif node_type == "person":
                label = f"Subject {random.randint(1000, 9999)}"
            elif node_type == "server":
                label = f"IP 192.168.{random.randint(0, 255)}.{random.randint(0, 255)}"

            nodes.append({
                "id": str(i),
                "label": label,
                "type": node_type,
                "riskScore": risk_score,
                "connections": random.randint(1, 10),
                "cluster": random.randint(1, 5),
            })

            # Create links
            source = str(i)
            target = "predator_core" if i < 5 else str(random.randint(0, i))

            links.append({
                "source": source,
                "target": target,
                "value": random.random(),
                "type": "risk" if is_threat else "standard",
            })

        return {"nodes": nodes, "links": links, "timestamp": datetime.now().isoformat(), "mode": "SIMULATION_ACTIVE"}

    # Live Mode
    try:
        tenant_id = user.get("tenant_id")
        if not tenant_id:
            tenant_id = "00000000-0000-0000-0000-000000000000"

        # Get real data via graph_builder
        graph_data = await graph_builder.get_graph_summary(tenant_id)  # Need full graph here actually

        # For now, fallback to simulation if DB is empty to avoid empty screen
        if graph_data.get("total_nodes", 0) < 5:
            return await visualize_neural_nexus(mode="simulation", limit=limit, user=user)

        # TODO: Implement full graph retrieval for visualization
        return await visualize_neural_nexus(mode="simulation", limit=limit, user=user)

    except Exception as e:
        logger.exception(f"Visualization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
