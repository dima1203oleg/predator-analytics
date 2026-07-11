from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.rag_service import rag_service

router = APIRouter(prefix="/rag", tags=["RAG Pipeline"])

class IndexRequest(BaseModel):
    documents: List[Dict[str, Any]]
    tenant_id: str = "default_tenant"

class QueryRequest(BaseModel):
    query: str
    tenant_id: str = "default_tenant"
    limit: int = 5

@router.post("/index")
async def index_documents(request: IndexRequest, background_tasks: BackgroundTasks):
    """
    Індексує нові документи у векторну базу даних (Qdrant).
    """
    try:
        # Можемо запускати індексацію у фоні, оскільки вона може зайняти час
        background_tasks.add_task(rag_service.index_documents, request.documents, request.tenant_id)
        return {"status": "accepted", "message": "Документи додані у чергу на індексацію."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def query_knowledge_base(request: QueryRequest):
    """
    Виконує RAG-запит (пошук релевантного контексту + генерація відповіді).
    """
    try:
        response = await rag_service.query(request.query, request.tenant_id, request.limit)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
