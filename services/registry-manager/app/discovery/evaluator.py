"""
Source Evaluator — PREDATOR Analytics
Оцінює знайдені джерела, розраховує Priority Score та інтегрує з Neo4j Meta-Graph.
"""
import logging
from typing import Dict, Any

from neo4j import AsyncGraphDatabase

from app.config import get_settings

logger = logging.getLogger(__name__)

class SourceEvaluator:
    """Оцінювач якості та пріоритету знайдених джерел."""

    def __init__(self, neo4j_uri: str, neo4j_user: str, neo4j_password: str):
        self.driver = AsyncGraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))

    async def close(self):
        await self.driver.close()

    def evaluate_priority(self, source_metadata: Dict[str, Any]) -> int:
        """
        Розраховує пріоритет від 0 до 100.
        Критерії: 
        - Наявність OpenAPI/Swagger (+30)
        - Кількість ресурсів/формати (JSON/CSV +20)
        - Оновленість (+20 якщо оновлено за останній місяць)
        - Авторитетність джерела (урядові домени .gov +30)
        """
        score = 0
        
        # 1. Авторитетність
        url = source_metadata.get("url", "")
        if ".gov" in url or "data.gov" in url:
            score += 30
        elif ".org" in url:
            score += 15

        # 2. Формати (OpenAPI або зручні дані)
        source_type = source_metadata.get("source_type")
        if source_type == "openapi":
            score += 30
        elif source_type == "ckan_dataset":
            resources = source_metadata.get("resources", [])
            has_json_or_csv = any(r.get("format", "").lower() in ["json", "csv"] for r in resources)
            if has_json_or_csv:
                score += 20
                
        # 3. OSINT джерела та санкційні списки (Critical Priority)
        if source_type == "osint_dataset":
            name = source_metadata.get("name", "").lower()
            title = source_metadata.get("title", "").lower()
            if "sanctions" in name or "sanctions" in title or "kev" in name or "nazk" in name or "ofac" in name:
                score += 80
            else:
                score += 50

        # 3. Базові бали
        score += 10
        
        return min(score, 100)

    async def save_to_metagraph(self, source_metadata: Dict[str, Any], priority_score: int) -> None:
        """Зберігає знайдене джерело в Neo4j."""
        query = """
        MERGE (s:DataSource {url: $url})
        SET s.name = $name,
            s.title = $title,
            s.source_type = $source_type,
            s.priority_score = $priority,
            s.status = 'DISCOVERED',
            s.last_seen = datetime()
        
        // Якщо є організація
        WITH s
        WHERE $organization IS NOT NULL
        MERGE (o:Organization {name: $organization})
        MERGE (s)-[:OWNED_BY]->(o)
        """
        
        try:
            async with self.driver.session() as session:
                await session.run(
                    query, 
                    url=source_metadata.get("url"),
                    name=source_metadata.get("name"),
                    title=source_metadata.get("title"),
                    source_type=source_metadata.get("source_type"),
                    priority=priority_score,
                    organization=source_metadata.get("organization")
                )
            logger.info(f"Saved {source_metadata.get('name')} to Meta-Graph with score {priority_score}")
        except Exception as e:
            logger.error(f"Failed to save {source_metadata.get('url')} to Meta-Graph: {e}")

