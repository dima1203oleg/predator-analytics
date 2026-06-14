"""Entry point для Federation Search Service."""

from contextlib import asynccontextmanager
import logging
import os
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.federation_search import FederationSearch

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

search_service: FederationSearch | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global search_service
    postgres_url = os.getenv("POSTGRES_URL", "postgresql://predator:predator@localhost:5432/predator")
    clickhouse_url = os.getenv("CLICKHOUSE_URL", "http://localhost:8123")
    opensearch_url = os.getenv("OPENSEARCH_URL", "http://localhost:9200")
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    neo4j_url = os.getenv("NEO4J_URL", "bolt://localhost:7687")

    search_service = FederationSearch(
        postgres_url=postgres_url,
        clickhouse_url=clickhouse_url,
        opensearch_url=opensearch_url,
        qdrant_url=qdrant_url,
        neo4j_url=neo4j_url,
    )
    logger.info("✅ Federation Search Service ініціалізовано")
    yield
    if search_service:
        await search_service.close()
    logger.info("🛑 Federation Search Service зупинено")

app = FastAPI(
    title="PREDATOR Federation Search API",
    version="61.0.0-ELITE",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "federation-search"}

@app.get("/api/v1/search")
async def perform_search(
    query: str = Query(..., min_length=1),
    sources: list[str] = Query(default=["postgresql", "clickhouse", "opensearch", "qdrant", "neo4j"]),
    limit: int = Query(default=10, le=100)
) -> dict[str, Any]:
    """Виконує федеративний пошук по всіх підключених БД."""
    if not search_service:
        raise HTTPException(status_code=503, detail="Search Service is not initialized")

    try:
        results = await search_service.federated_search(
            query=query,
            sources=sources,
            limit=limit,
        )
        return results
    except Exception as e:
        logger.error(f"Search failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) from e

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)  # noqa: S104

