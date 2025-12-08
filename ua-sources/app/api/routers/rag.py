"""RAG Router - Retrieval Augmented Generation"""
from fastapi import APIRouter
from typing import List, Dict, Any
from ...services.rag import rag_service
from ...services.ai_engine import ai_engine

router = APIRouter(prefix="/rag", tags=["RAG"])


@router.post("/query")
async def rag_query(query: str, top_k: int = 5):
    """RAG query - search documents and generate answer"""
    # Search for relevant documents
    docs = await rag_service.search(query, top_k=top_k)
    
    # If no docs, use AI engine directly
    if not docs:
        result = await ai_engine.analyze(query=query)
        return {
            "query": query,
            "answer": result.answer,
            "sources": result.sources
        }
    
    # Generate answer with context
    answer = await rag_service.generate(query, docs)
    return {
        "query": query,
        "answer": answer,
        "sources": [{"content": d.get("content", "")[:200], "score": d.get("score", 0)} for d in docs]
    }


@router.post("/index")
async def index_documents(documents: List[Dict[str, Any]]):
    """Index documents into RAG system"""
    count = await rag_service.index(documents)
    return {"indexed": count, "status": "success"}
