import asyncio
from typing import Any, Dict
from predator_common.logging import get_logger
from app.core.minio_client import MinioClient
from app.sinks.neo4j_sink import Neo4jSink

logger = get_logger("ingestion.harvesters.social")

class SocialHarvester:
    def __init__(self, job_id: str, url: str, config: Dict[str, Any]):
        self.job_id = job_id
        self.url = url
        self.config = config
        self.minio = MinioClient()
        self.neo4j = Neo4jSink()

    async def run(self) -> None:
        network = self.config.get("network", "unknown")
        logger.info(f"SocialHarvester [{self.job_id}]: Start parsing {self.url} on {network}")
        
        try:
            await self.minio.update_job_progress(self.job_id, 10, "running", 0, 0)
            await asyncio.sleep(1.5)
            await self.minio.update_job_progress(self.job_id, 50, "running", 0, 0)
            
            # Mock extraction
            profile_name = self.url.split("/")[-1] if "/" in self.url else self.url
            
            await self.minio.update_job_progress(self.job_id, 80, "running", 1, 0)
            
            query = """
            MERGE (p:SocialProfile {url: $url})
            SET p.network = $network,
                p.username = $username,
                p.last_scraped = datetime()
            """
            
            await self.neo4j.execute_write(
                query,
                url=self.url,
                network=network,
                username=profile_name
            )
            
            await self.minio.update_job_progress(self.job_id, 100, "completed", 1, 0)
            logger.info(f"SocialHarvester [{self.job_id}]: Completed successfully.")
            
        except Exception as e:
            logger.error(f"SocialHarvester [{self.job_id}]: Error processing {self.url} - {e}", exc_info=True)
            await self.minio.update_job_progress(self.job_id, 0, "failed", 0, 1)
        finally:
            await self.neo4j.close()
