from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.services.graph_service import graph_builder
from app.services.auth_service import get_current_user
from app.services.document_service import document_service
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Knowledge Graph"])

@router.post("/graph/build/{doc_id}")
async def build_graph_for_document(
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """
    Trigger LLM-based Knowledge Graph extraction for a specific document.
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
        background_tasks.add_task(
            graph_builder.extract_and_build,
            doc_id,
            content,
            tenant_id
        )


        return {
            "status": "accepted",
            "message": "Graph extraction started",
            "doc_id": doc_id
        }

    except Exception as e:
        logger.error(f"Graph trigger error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/graph/search")
async def search_knowledge_graph(
    q: str,
    depth: int = 1,
    user: dict = Depends(get_current_user)
):
    """
    Search the Knowledge Graph for entities and their connections.
    """
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
        logger.error(f"Graph search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
