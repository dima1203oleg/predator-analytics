import logging
from typing import Any, Dict

from app.pipelines.base import BasePipeline
# Note: we need to import DossierAggregator from core-api, but since they are different services,
# ideally they share a library or we run it. Wait, IngestionWorker doesn't have access to core-api!
# Let's check how other pipelines handle this.

class OSINTPipeline(BasePipeline):
    """Пайплайн для обробки запитів на OSINT-сканування."""
    
    def __init__(self, neo4j_sink, postgres_sink):
        self.neo4j_sink = neo4j_sink
        self.postgres_sink = postgres_sink
        self.logger = logging.getLogger("ingestion_worker.osint_pipeline")

    async def process(self, msg_value: Dict[str, Any]) -> None:
        """Обробляє вхідний OSINT-запит."""
        job_id = msg_value.get("job_id")
        entity_id = msg_value.get("entity_id")
        name = msg_value.get("name")
        entity_type = msg_value.get("entity_type")
        
        self.logger.info(
            "osint_pipeline.start",
            job_id=job_id,
            entity_id=entity_id,
            name=name
        )
        
        try:
            from app.osint.dossier_aggregator import DossierAggregator
            from app.osint.collectors.base import DossierQuery, EntityType
            
            aggregator = DossierAggregator()
            
            query = DossierQuery(
                query_id=job_id or entity_id,
                entity_type=EntityType(entity_type.upper()) if entity_type else EntityType.PERSON,
                name=name,
                identifier=entity_id
            )
            
            # Execute the actual collectors
            dossier = await aggregator.build_dossier(query)
            
            self.logger.info(
                "osint_pipeline.complete",
                job_id=job_id,
                entity_id=entity_id,
                status="success",
                risk_score=dossier.risk_score
            )
            
            # Future Phase: Sink the dossier to Neo4j/Postgres
            
        except Exception as e:
            self.logger.error(
                "osint_pipeline.error",
                job_id=job_id,
                entity_id=entity_id,
                error=str(e)
            )
