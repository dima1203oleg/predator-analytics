import asyncio
import httpx
import json
from typing import Any, Dict
from predator_common.logging import get_logger
from app.core.minio_client import MinioClient
from app.sinks.neo4j_sink import Neo4jSink

logger = get_logger("ingestion.harvesters.api")

class APIHarvester:
    def __init__(self, job_id: str, url: str, config: Dict[str, Any]):
        self.job_id = job_id
        self.url = url
        self.config = config
        self.minio = MinioClient()
        self.neo4j = Neo4jSink()
        self.http = httpx.AsyncClient(timeout=30.0)

    async def run(self) -> None:
        method = self.config.get("method", "GET")
        headers = self.config.get("headers", {})
        
        logger.info(f"APIHarvester [{self.job_id}]: Start fetching {method} {self.url}")
        
        try:
            await self.minio.update_job_progress(self.job_id, 10, "running", 0, 0)
            
            # Fetch the API
            response = await self.http.request(method, self.url, headers=headers)
            response.raise_for_status()
            
            await self.minio.update_job_progress(self.job_id, 50, "running", 0, 0)
            
            data = response.json()
            # For simplicity, convert the root to a string or measure its length as processed records
            records_processed = len(data) if isinstance(data, list) else 1
            
            await self.minio.update_job_progress(self.job_id, 80, "running", records_processed, 0)
            
            query = """
            MERGE (e:APIEndpoint {url: $url})
            SET e.method = $method,
                e.last_scraped = datetime(),
                e.records = $records
            """
            
            await self.neo4j.execute_write(
                query,
                url=self.url,
                method=method,
                records=records_processed
            )
            
            await self.minio.update_job_progress(self.job_id, 100, "completed", records_processed, 0)
            logger.info(f"APIHarvester [{self.job_id}]: Completed successfully.")
            
        except Exception as e:
            logger.error(f"APIHarvester [{self.job_id}]: Error processing {self.url} - {e}", exc_info=True)
            await self.minio.update_job_progress(self.job_id, 0, "failed", 0, 1)
        finally:
            await self.http.aclose()
            await self.neo4j.close()
