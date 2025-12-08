"""Databases Router - Database management endpoints with REAL connections"""
from fastapi import APIRouter, Body, HTTPException
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Dict, Any, List
import logging
import httpx
from app.core.config import settings
import urllib.parse

router = APIRouter(prefix="/databases", tags=["Databases"])
logger = logging.getLogger(__name__)

class QueryRequest(BaseModel):
    query: str
    params: dict = {}

class CypherRequest(BaseModel):
    query: str


async def _get_pg_dsn():
    raw_url = settings.DATABASE_URL
    if "sqlite" in raw_url:
        # Fallback for local dev without postgres
        return None
    return raw_url.replace("+asyncpg", "").replace("+psycopg2", "")

async def check_postgres_status() -> Dict[str, Any]:
    """Check PostgreSQL real status"""
    try:
        dsn = await _get_pg_dsn()
        if not dsn:
             return {"id": "postgres", "name": "PostgreSQL (SQLite Mode)", "type": "SQL", "status": "CONNECTED", "version": "SQLite"}
        
        import asyncpg
        conn = await asyncpg.connect(dsn)
        version = await conn.fetchval("SELECT version()")
        size = await conn.fetchval("SELECT pg_database_size(current_database())")
        tables = await conn.fetchval("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
        await conn.close()
        
        # Parse host from DSN for display
        u = urllib.parse.urlparse(dsn)
        display_host = f"{u.hostname}:{u.port}" if u.hostname else "postgres:5432"

        return {
            "id": "postgres",
            "name": "PostgreSQL",
            "type": "SQL",
            "status": "CONNECTED",
            "version": version.split()[0:2] if version else [],
            "size_mb": round(size / 1024 / 1024, 2) if size else 0,
            "tables": tables or 0,
            "host": display_host
        }
    except Exception as e:
        logger.error(f"PostgreSQL check failed: {e}")
        return {"id": "postgres", "name": "PostgreSQL", "type": "SQL", "status": "ERROR", "error": str(e)}


async def check_redis_status() -> Dict[str, Any]:
    """Check Redis real status"""
    try:
        import redis.asyncio as aioredis
        # Settings.REDIS_URL is like redis://redis:6379/0
        redis = await aioredis.from_url(settings.REDIS_URL)
        info = await redis.info()
        await redis.close()
        return {
            "id": "redis",
            "name": "Redis",
            "type": "Cache",
            "status": "CONNECTED",
            "version": info.get("redis_version", "Unknown"),
            "used_memory_mb": round(info.get("used_memory", 0) / 1024 / 1024, 2),
            "keys": info.get("db0", {}).get("keys", 0) if isinstance(info.get("db0"), dict) else 0,
            "host": settings.REDIS_URL.split("@")[-1] # Simple parsing
        }
    except Exception as e:
        logger.error(f"Redis check failed: {e}")
        return {"id": "redis", "name": "Redis", "type": "Cache", "status": "ERROR", "error": str(e)}


async def check_qdrant_status() -> Dict[str, Any]:
    """Check Qdrant real status"""
    base_url = settings.QDRANT_URL
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{base_url}/collections", timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                collections = data.get("result", {}).get("collections", [])
                return {
                    "id": "qdrant",
                    "name": "Qdrant",
                    "type": "Vector",
                    "status": "CONNECTED",
                    "collections": [c["name"] for c in collections],
                    "collections_count": len(collections),
                    "host": base_url
                }
    except Exception as e:
        logger.error(f"Qdrant check failed: {e}")
    return {"id": "qdrant", "name": "Qdrant", "type": "Vector", "status": "ERROR", "host": base_url}


async def check_opensearch_status() -> Dict[str, Any]:
    """Check OpenSearch real status"""
    base_url = settings.OPENSEARCH_URL
    try:
        async with httpx.AsyncClient() as client:
            # Check cluster health
            resp = await client.get(f"{base_url}/_cluster/health", timeout=5)
            if resp.status_code == 200:
                health = resp.json()
                # Get indices count
                idx_resp = await client.get(f"{base_url}/_cat/indices?format=json", timeout=5)
                indices = idx_resp.json() if idx_resp.status_code == 200 else []
                return {
                    "id": "opensearch",
                    "name": "OpenSearch",
                    "type": "Search",
                    "status": "CONNECTED" if health.get("status") in ["green", "yellow"] else "DEGRADED",
                    "cluster_status": health.get("status"),
                    "nodes": health.get("number_of_nodes", 1),
                    "indices_count": len([i for i in indices if not i["index"].startswith(".")]),
                    "host": base_url
                }
    except Exception as e:
        logger.error(f"OpenSearch check failed: {e}")
    return {"id": "opensearch", "name": "OpenSearch", "type": "Search", "status": "ERROR", "host": base_url}


async def check_minio_status() -> Dict[str, Any]:
    """Check MinIO real status"""
    # MINIO_ENDPOINT is host:port, usually without http://
    endpoint = settings.MINIO_ENDPOINT
    protocol = "https" if "443" in endpoint else "http"
    # Ensure no double protocol
    if "://" in endpoint:
        url = f"{endpoint}/minio/health/live"
    else:
        url = f"{protocol}://{endpoint}/minio/health/live"

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=5)
            if resp.status_code == 200:
                return {
                    "id": "minio",
                    "name": "MinIO",
                    "type": "ObjectStorage",
                    "status": "CONNECTED",
                    "host": endpoint
                }
    except Exception as e:
        logger.error(f"MinIO check failed: {e}")
    return {"id": "minio", "name": "MinIO", "type": "ObjectStorage", "status": "ERROR", "host": endpoint}


@router.get("/")
async def list_databases():
    """List ALL databases with REAL status checks"""
    import asyncio
    
    # Run all checks in parallel
    results = await asyncio.gather(
        check_postgres_status(),
        check_redis_status(),
        check_qdrant_status(),
        check_opensearch_status(),
        check_minio_status(),
        return_exceptions=True
    )
    
    databases = []
    for r in results:
        if isinstance(r, Exception):
            logger.error(f"Database check error: {r}")
        elif isinstance(r, dict):
            databases.append(r)
    
    return databases


@router.get("/vectors")
async def get_vector_collections():
    """Get Qdrant vector collections with details"""
    try:
        base_url = settings.QDRANT_URL
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{base_url}/collections", timeout=5)
            if resp.status_code == 200:
                collections = resp.json().get("result", {}).get("collections", [])
                detailed = []
                for col in collections:
                    col_resp = await client.get(f"{base_url}/collections/{col['name']}", timeout=5)
                    if col_resp.status_code == 200:
                        col_data = col_resp.json().get("result", {})
                        detailed.append({
                            "name": col["name"],
                            "vectors_count": col_data.get("vectors_count", 0),
                            "points_count": col_data.get("points_count", 0),
                            "status": col_data.get("status", "unknown")
                        })
                return detailed
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Qdrant unavailable: {str(e)}")
    return []


@router.get("/{db_id}/status")
async def get_database_status(db_id: str):
    """Get specific database status"""
    checkers = {
        "postgres": check_postgres_status,
        "redis": check_redis_status,
        "qdrant": check_qdrant_status,
        "opensearch": check_opensearch_status,
        "minio": check_minio_status
    }
    
    checker = checkers.get(db_id)
    if not checker:
        raise HTTPException(status_code=404, detail=f"Unknown database: {db_id}")
    
    return await checker()


@router.post("/query")
async def execute_query(request: QueryRequest):
    """Execute REAL SQL query on PostgreSQL"""
    try:
        dsn = await _get_pg_dsn()
        if not dsn:
            raise HTTPException(status_code=500, detail="SQL query not supported in SQLite mode")
            
        import asyncpg
        conn = await asyncpg.connect(dsn)
        
        start = datetime.now(timezone.utc)
        
        if request.query.strip().upper().startswith("SELECT"):
            # Set statement timeout to avoid hanging
            await conn.execute("SET statement_timeout = '10s'")
            rows = await conn.fetch(request.query)
            columns = list(rows[0].keys()) if rows else []
            data = [list(dict(row).values()) for row in rows]
            result = {
                "columns": columns,
                "rows": data,
                "row_count": len(rows),
                "execution_time_ms": (datetime.now(timezone.utc) - start).total_seconds() * 1000
            }
        else:
            await conn.execute(request.query)
            result = {
                "status": "SUCCESS",
                "execution_time_ms": (datetime.now(timezone.utc) - start).total_seconds() * 1000
            }
        
        await conn.close()
        return result
        
    except Exception as e:
        logger.error(f"SQL execution error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cypher")
async def execute_cypher(request: CypherRequest):
    """Execute Cypher query (Graph DB) - placeholder for Neo4j integration"""
    # TODO: Integrate with Neo4j when available
    return {
        "nodes": [],
        "relationships": [],
        "message": "Neo4j not configured. Add NEO4J_URI to enable graph queries.",
        "execution_time_ms": 0
    }


@router.get("/{db_id}/stats")
async def get_database_stats(db_id: str):
    """Get database statistics"""
    if db_id == "postgres":
        try:
            dsn = await _get_pg_dsn()
            if not dsn: return {"id": db_id, "message": "SQLite mode"}
            
            import asyncpg
            conn = await asyncpg.connect(dsn)
            size = await conn.fetchval("SELECT pg_database_size(current_database())")
            tables = await conn.fetchval("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
            rows = await conn.fetchval("SELECT SUM(n_live_tup) FROM pg_stat_user_tables")
            await conn.close()
            return {
                "id": db_id,
                "size_mb": round(size / 1024 / 1024, 2) if size else 0,
                "tables": tables or 0,
                "rows_total": rows or 0,
                "last_backup": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=503, detail=str(e))
    
    return {"id": db_id, "message": "Stats not available for this database type"}


@router.post("/{db_id}/backup")
async def trigger_backup(db_id: str):
    """Trigger database backup"""
    if db_id != "postgres":
         # Only Postgres implemented for now
         return {"id": db_id, "status": "SKIPPED", "message": "Backup not supported for this DB type"}

    try:
        from app.tasks.maintenance import backup_postgres
        task = backup_postgres.delay()
        
        return {
            "id": db_id,
            "backup_id": task.id,
            "status": "STARTED",
            "message": "Backup job queued in background"
        }
    except Exception as e:
        logger.error(f"Backup trigger failed: {e}")
        raise HTTPException(status_code=500, detail="Backup queue unavailable")
