import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from neo4j import AsyncGraphDatabase
import orjson
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("graph-service")

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "predator_secret")

class ORJSONResponse(JSONResponse):
    media_type = "application/json"
    def render(self, content: any) -> bytes:
        return orjson.dumps(content)

# Neo4j Driver setup
driver = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global driver
    try:
        driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        # Test connection
        async with driver.session() as session:
            await session.run("RETURN 1")
        logger.info("Successfully connected to Neo4j Knowledge Graph.")
    except Exception as e:
        logger.error(f"Failed to connect to Neo4j: {e}")
    yield
    if driver:
        await driver.close()
        logger.info("Neo4j driver closed.")

app = FastAPI(title="Predator Graph Service (Neo4j)", lifespan=lifespan, default_response_class=ORJSONResponse)

@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "service": "graph-service", "db": "neo4j"}

@app.get("/api/v1/graph/nodes")
async def get_nodes(limit: int = 100):
    """Отримати вузли графу OSINT."""
    if not driver:
        return {"nodes": [{"id": "TARGET-01", "type": "person", "risk_score": 0.9, "label": "V. Oligarch"}]}
    
    query = """
    MATCH (n)
    RETURN n.id AS id, labels(n)[0] AS type, n.risk_score AS risk_score, n.name AS label
    LIMIT $limit
    """
    
    try:
        async with driver.session() as session:
            result = await session.run(query, limit=limit)
            nodes = [record.data() for record in await result.fetch(limit)]
            return {"nodes": nodes}
    except Exception as e:
        logger.error(f"Neo4j Query Error: {e}")
        raise HTTPException(status_code=500, detail="Помилка доступу до графу знань")

from async_lru import alru_cache

@alru_cache(maxsize=1024)
async def fetch_shortest_path(source_id: str, target_id: str) -> dict:
    if not driver:
        raise HTTPException(status_code=503, detail="Neo4j Service Unavailable")
        
    query = """
    MATCH p = shortestPath((source {id: $source_id})-[*..6]-(target {id: $target_id}))
    RETURN [node in nodes(p) | node.id] AS path, length(p) AS distance
    """
    try:
        async with driver.session() as session:
            result = await session.run(query, source_id=source_id, target_id=target_id)
            record = await result.single()
            if not record:
                return {"path": [], "distance": -1, "message": "Зв'язків не виявлено"}
            return {"path": record["path"], "distance": record["distance"]}
    except Exception as e:
        logger.error(f"Pathfinding Error: {e}")
        raise HTTPException(status_code=500, detail="Помилка алгоритму пошуку")

@app.get("/api/v1/graph/shortest_path")
async def shortest_path(source_id: str, target_id: str):
    """Знайти найкоротший шлях (OSINT зв'язок) між двома суб'єктами (з кешуванням)."""
    return await fetch_shortest_path(source_id, target_id)

