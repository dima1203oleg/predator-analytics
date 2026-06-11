import asyncio
import logging
import asyncpg
from typing import Dict, Any

from opensearchpy import AsyncOpenSearch
from qdrant_client import AsyncQdrantClient
from neo4j import AsyncGraphDatabase
import httpx
import redis.asyncio as redis

from ..config import settings

logger = logging.getLogger(__name__)

class Level3DatabasesValidator:
    """
    Рівень 3: Database Validation
    Перевіряє доступність та стан всіх 8 баз даних та шини повідомлень платформи.
    """
    
    async def validate(self) -> Dict[str, Any]:
        result = {
            "level": 3,
            "name": "Database Validation",
            "status": "pass",
            "details": {}
        }
        
        # Запускаємо всі перевірки паралельно
        tasks = [
            self._check_postgres(),
            self._check_neo4j(),
            self._check_clickhouse(),
            self._check_redis(),
            self._check_opensearch(),
            self._check_qdrant(),
            self._check_minio(),
            self._check_redpanda()
        ]
        
        checks_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        keys = ["postgres", "neo4j", "clickhouse", "redis", "opensearch", "qdrant", "minio", "redpanda"]
        all_passed = True
        
        for idx, key in enumerate(keys):
            res = checks_results[idx]
            if isinstance(res, Exception):
                result["details"][key] = {"status": "error", "error": str(res)}
                all_passed = False
            else:
                result["details"][key] = res
                if res.get("status") != "pass":
                    all_passed = False
                    
        if not all_passed:
            result["status"] = "fail"
            
        return result

    async def _check_postgres(self) -> Dict[str, Any]:
        try:
            conn = await asyncpg.connect(settings.postgres_dsn)
            
            # 1. SELECT 1
            await conn.fetchval("SELECT 1")
            
            # 2. Migrations
            version = None
            try:
                version = await conn.fetchval("SELECT version_num FROM alembic_version LIMIT 1")
            except Exception:
                pass
                
            # 3. Tables count
            tables = await conn.fetchval(
                "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"
            )
            
            await conn.close()
            
            return {
                "status": "pass" if tables >= 38 else "warning",
                "version_num": version,
                "tables_count": tables,
                "warning": "Tables count < 38" if tables < 38 else None
            }
        except Exception as e:
            return {"status": "fail", "error": str(e)}

    async def _check_neo4j(self) -> Dict[str, Any]:
        try:
            driver = AsyncGraphDatabase.driver(
                settings.neo4j_uri, 
                auth=(settings.neo4j_user, settings.neo4j_password)
            )
            async with driver.session() as session:
                result = await session.run("MATCH (n) RETURN COUNT(n) AS c")
                record = await result.single()
                count = record["c"] if record else 0
            await driver.close()
            return {"status": "pass", "nodes_count": count}
        except Exception as e:
            return {"status": "fail", "error": str(e)}

    async def _check_clickhouse(self) -> Dict[str, Any]:
        try:
            url = f"http://{settings.clickhouse_host}:{settings.clickhouse_port}/ping"
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    version_res = await client.post(
                        f"http://{settings.clickhouse_host}:{settings.clickhouse_port}",
                        content="SELECT version()"
                    )
                    return {"status": "pass", "version": version_res.text.strip()}
                return {"status": "fail", "error": f"HTTP {res.status_code}"}
        except Exception as e:
            return {"status": "fail", "error": str(e)}

    async def _check_redis(self) -> Dict[str, Any]:
        try:
            client = redis.from_url(settings.redis_url)
            ping_res = await client.ping()
            await client.close()
            if ping_res:
                return {"status": "pass"}
            return {"status": "fail", "error": "PING returned false"}
        except Exception as e:
            return {"status": "fail", "error": str(e)}

    async def _check_opensearch(self) -> Dict[str, Any]:
        try:
            client = AsyncOpenSearch(
                hosts=[settings.opensearch_hosts],
                http_auth=(settings.opensearch_user, settings.opensearch_password),
                verify_certs=False,
                ssl_show_warn=False
            )
            health = await client.cluster.health()
            await client.close()
            return {
                "status": "pass" if health.get("status") in ["green", "yellow"] else "fail",
                "cluster_health": health.get("status"),
                "nodes": health.get("number_of_nodes")
            }
        except Exception as e:
            return {"status": "fail", "error": str(e)}

    async def _check_qdrant(self) -> Dict[str, Any]:
        try:
            client = AsyncQdrantClient(url=settings.qdrant_url)
            collections = await client.get_collections()
            return {
                "status": "pass",
                "collections_count": len(collections.collections)
            }
        except Exception as e:
            return {"status": "fail", "error": str(e)}

    async def _check_minio(self) -> Dict[str, Any]:
        try:
            process = await asyncio.create_subprocess_shell(
                "mc alias set myminio http://predator_minio:9000 minioadmin minioadmin && mc ls myminio",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            if process.returncode == 0:
                return {"status": "pass"}
            else:
                return {"status": "fail", "error": stderr.decode('utf-8').strip()}
        except Exception as e:
            return {"status": "fail", "error": str(e)}

    async def _check_redpanda(self) -> Dict[str, Any]:
        try:
            process = await asyncio.create_subprocess_shell(
                "docker exec predator_redpanda rpk topic list",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            if process.returncode == 0:
                topics = len([t for t in stdout.decode('utf-8').split("\\n") if t.strip()])
                return {"status": "pass", "topics_count": topics}
            else:
                return {"status": "fail", "error": stderr.decode('utf-8').strip()}
        except Exception as e:
            return {"status": "fail", "error": str(e)}
