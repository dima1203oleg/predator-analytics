"""RAG Router - Retrieval Augmented Generation"""
from fastapi import APIRouter

router = APIRouter(prefix="/rag", tags=["RAG"])


@router.post("/query")
async def rag_query(query: str, top_k: int = 5):
    """RAG query"""
    return {"query": query, "answer": "", "sources": []}


@router.post("/index")
async def index_documents(documents: list):
    """Index documents"""
    return {"indexed": len(documents)}
