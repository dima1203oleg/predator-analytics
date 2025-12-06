"""
Monitoring Tasks
Health checks and metrics collection
"""
from celery import shared_task
import asyncio
import logging
from datetime import datetime
import httpx

logger = logging.getLogger("tasks.monitoring")


@shared_task(name="tasks.monitoring.health_check")
def health_check():
    """
    Check health of all system components
    
    Returns:
        Dict with component status
    """
    import os
    
    logger.info("[HEALTH] Running system health check")
    
    async def check_all():
        results = {
            "timestamp": datetime.now().isoformat(),
            "components": {}
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Check PostgreSQL
            try:
                import asyncpg
                db_url = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db")
                conn = await asyncpg.connect(db_url)
                await conn.fetchval("SELECT 1")
                await conn.close()
                results["components"]["postgresql"] = {"status": "healthy", "latency_ms": 0}
            except Exception as e:
                results["components"]["postgresql"] = {"status": "unhealthy", "error": str(e)}
            
            # Check OpenSearch
            try:
                opensearch_url = os.getenv("OPENSEARCH_URL", "http://localhost:9200")
                resp = await client.get(f"{opensearch_url}/_cluster/health")
                data = resp.json()
                results["components"]["opensearch"] = {
                    "status": data.get("status", "unknown"),
                    "nodes": data.get("number_of_nodes", 0)
                }
            except Exception as e:
                results["components"]["opensearch"] = {"status": "unhealthy", "error": str(e)}
            
            # Check Qdrant
            try:
                qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
                resp = await client.get(f"{qdrant_url}/collections")
                data = resp.json()
                results["components"]["qdrant"] = {
                    "status": "healthy",
                    "collections": len(data.get("result", {}).get("collections", []))
                }
            except Exception as e:
                results["components"]["qdrant"] = {"status": "unhealthy", "error": str(e)}
            
            # Check Redis
            try:
                import redis
                redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
                r = redis.from_url(redis_url)
                r.ping()
                results["components"]["redis"] = {"status": "healthy"}
            except Exception as e:
                results["components"]["redis"] = {"status": "unhealthy", "error": str(e)}
            
            # Check MinIO
            try:
                minio_url = os.getenv("MINIO_ENDPOINT", "localhost:9000")
                resp = await client.get(f"http://{minio_url}/minio/health/live")
                results["components"]["minio"] = {"status": "healthy" if resp.status_code == 200 else "degraded"}
            except Exception as e:
                results["components"]["minio"] = {"status": "unhealthy", "error": str(e)}
        
        # Overall status
        all_healthy = all(
            c.get("status") in ["healthy", "green", "yellow"] 
            for c in results["components"].values()
        )
        results["overall"] = "healthy" if all_healthy else "degraded"
        
        logger.info(f"[HEALTH] Check complete: {results['overall']}")
        return results
    
    return asyncio.run(check_all())


@shared_task(name="tasks.monitoring.collect_index_stats")
def collect_index_stats():
    """
    Collect statistics from search indexes
    
    Returns:
        Index stats from OpenSearch and Qdrant
    """
    import os
    
    logger.info("[STATS] Collecting index statistics")
    
    async def collect():
        stats = {
            "timestamp": datetime.now().isoformat(),
            "opensearch": {},
            "qdrant": {}
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            # OpenSearch stats
            try:
                opensearch_url = os.getenv("OPENSEARCH_URL", "http://localhost:9200")
                resp = await client.get(f"{opensearch_url}/_stats")
                data = resp.json()
                
                stats["opensearch"] = {
                    "total_docs": data.get("_all", {}).get("primaries", {}).get("docs", {}).get("count", 0),
                    "size_bytes": data.get("_all", {}).get("primaries", {}).get("store", {}).get("size_in_bytes", 0),
                    "search_total": data.get("_all", {}).get("primaries", {}).get("search", {}).get("query_total", 0)
                }
            except Exception as e:
                stats["opensearch"]["error"] = str(e)
            
            # Qdrant stats
            try:
                qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
                resp = await client.get(f"{qdrant_url}/collections/documents_vectors")
                data = resp.json()
                
                if data.get("status") == "ok":
                    result = data.get("result", {})
                    stats["qdrant"] = {
                        "vectors_count": result.get("vectors_count", 0),
                        "points_count": result.get("points_count", 0),
                        "indexed_vectors_count": result.get("indexed_vectors_count", 0),
                        "status": result.get("status", "unknown")
                    }
            except Exception as e:
                stats["qdrant"]["error"] = str(e)
        
        logger.info(f"[STATS] OpenSearch docs: {stats['opensearch'].get('total_docs', 'N/A')}, "
                   f"Qdrant vectors: {stats['qdrant'].get('vectors_count', 'N/A')}")
        
        return stats
    
    return asyncio.run(collect())


@shared_task(name="tasks.monitoring.collect_etl_metrics")
def collect_etl_metrics():
    """
    Collect ETL pipeline metrics for monitoring
    """
    import asyncpg
    import os
    from datetime import timedelta
    
    logger.info("[METRICS] Collecting ETL metrics")
    
    async def collect():
        db_url = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db")
        conn = await asyncpg.connect(db_url)
        
        try:
            now = datetime.now()
            last_hour = now - timedelta(hours=1)
            last_day = now - timedelta(days=1)
            
            metrics = {
                "timestamp": now.isoformat(),
                "staging": {},
                "gold": {},
                "processing": {}
            }
            
            # Staging metrics
            metrics["staging"]["total"] = await conn.fetchval(
                "SELECT COUNT(*) FROM staging.raw_data"
            )
            metrics["staging"]["unprocessed"] = await conn.fetchval(
                "SELECT COUNT(*) FROM staging.raw_data WHERE processed = FALSE"
            )
            metrics["staging"]["last_hour"] = await conn.fetchval(
                "SELECT COUNT(*) FROM staging.raw_data WHERE fetched_at > $1",
                last_hour
            )
            
            # Gold metrics
            metrics["gold"]["total"] = await conn.fetchval(
                "SELECT COUNT(*) FROM gold.documents"
            )
            metrics["gold"]["last_hour"] = await conn.fetchval(
                "SELECT COUNT(*) FROM gold.documents WHERE created_at > $1",
                last_hour
            )
            metrics["gold"]["last_day"] = await conn.fetchval(
                "SELECT COUNT(*) FROM gold.documents WHERE created_at > $1",
                last_day
            )
            
            # Processing rate
            if metrics["staging"]["total"] > 0:
                processed = metrics["staging"]["total"] - metrics["staging"]["unprocessed"]
                metrics["processing"]["rate_percent"] = round(
                    processed / metrics["staging"]["total"] * 100, 2
                )
            else:
                metrics["processing"]["rate_percent"] = 100.0
            
            logger.info(f"[METRICS] Processing rate: {metrics['processing']['rate_percent']}%")
            
            return metrics
            
        finally:
            await conn.close()
    
    return asyncio.run(collect())
