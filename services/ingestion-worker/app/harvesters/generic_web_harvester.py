import asyncio
import httpx
from typing import Any, Dict
from bs4 import BeautifulSoup
from predator_common.logging import get_logger
from app.core.minio_client import MinioClient
from app.sinks.neo4j_sink import Neo4jSink

logger = get_logger("ingestion.harvesters.web")

class GenericWebHarvester:
    def __init__(self, job_id: str, url: str, config: Dict[str, Any]):
        self.job_id = job_id
        self.url = url
        self.config = config
        self.minio = MinioClient()
        self.neo4j = Neo4jSink()
        self.http = httpx.AsyncClient(timeout=30.0, follow_redirects=True)

    async def run(self) -> None:
        logger.info(f"WebHarvester [{self.job_id}]: Start crawling {self.url}")
        
        try:
            # 1. Update status to running (Validating phase)
            await self.minio.update_job_progress(self.job_id, 10, "running", 0, 0)
            
            # 2. Fetch the webpage
            response = await self.http.get(self.url)
            response.raise_for_status()
            
            # Update status to processing
            await self.minio.update_job_progress(self.job_id, 50, "running", 0, 0)
            
            # 3. Parse with BeautifulSoup
            soup = BeautifulSoup(response.text, "html.parser")
            title = soup.title.string if soup.title else self.url
            text = soup.get_text(separator=" ", strip=True)
            
            # Extract basic metadata
            meta_desc = soup.find("meta", attrs={"name": "description"})
            description = meta_desc["content"] if meta_desc else ""
            
            # 4. Save to Knowledge Graph (Neo4j)
            await self.minio.update_job_progress(self.job_id, 75, "running", 1, 0)
            
            query = """
            MERGE (w:Website {url: $url})
            SET w.title = $title,
                w.description = $description,
                w.last_scraped = datetime(),
                w.content_preview = $content_preview
            """
            
            await self.neo4j.execute_write(
                query,
                url=self.url,
                title=title,
                description=description,
                content_preview=text[:500]
            )
            
            # 5. Mark as completed
            await self.minio.update_job_progress(self.job_id, 100, "completed", 1, 0)
            logger.info(f"WebHarvester [{self.job_id}]: Completed successfully.")
            
        except Exception as e:
            logger.error(f"WebHarvester [{self.job_id}]: Error processing {self.url} - {e}", exc_info=True)
            await self.minio.update_job_progress(self.job_id, 0, "failed", 0, 1)
        finally:
            await self.http.aclose()
            await self.neo4j.close()
