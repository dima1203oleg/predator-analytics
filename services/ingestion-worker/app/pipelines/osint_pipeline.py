import logging
from typing import Any, Dict

from app.pipelines.base import BasePipeline
# Note: we need to import DossierAggregator from core-api, but since they are different services,
# ideally they share a library or we run it. Wait, IngestionWorker doesn't have access to core-api!
# Let's check how other pipelines handle this.

class OSINTPipeline(BasePipeline):
    """Пайплайн для обробки запитів на OSINT-сканування."""
    
    def __init__(self, neo4j_sink, postgres_sink, clickhouse_sink):
        self.neo4j_sink = neo4j_sink
        self.postgres_sink = postgres_sink
        self.clickhouse_sink = clickhouse_sink
        self.logger = logging.getLogger("ingestion_worker.osint_pipeline")
        
        from app.config import get_settings
        import redis.asyncio as redis
        settings = get_settings()
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)

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
                entity_type=EntityType(entity_type.lower()) if entity_type else EntityType.PERSON,
                identifier=entity_id or name or "unknown",
                name=name,
                tenant_id=msg_value.get("tenant_id")
            )
            
            # Позначаємо в Redis статус processing
            if job_id:
                import json
                await self.redis.set(f"osint:job:{job_id}", json.dumps({
                    "status": "compiling",
                    "entity_id": entity_id,
                    "progress": 50
                }), ex=3600)
            
            # 1. Execute the actual collectors
            dossier = await aggregator.build_dossier(query)
            
            # 2. Extract risk score safely (it's inside risk_assessment dictionary in the dossier)
            risk_score = dossier.risk_assessment.get("ml_risk_score", 0.0) if dossier.risk_assessment else 0.0
            
            self.logger.info(
                "osint_pipeline.complete",
                job_id=job_id,
                entity_id=entity_id,
                status="success",
                risk_score=risk_score
            )
            
            # 3. Neo4j Sink: Translate Cytoscape Graph -> OwnershipGraph format
            graph_data = {"nodes": [], "edges": []}
            if dossier.graph:
                cytoscape_nodes = dossier.graph.get("nodes", {})
                cytoscape_edges = dossier.graph.get("edges", [])
                
                for n_id, n_data in cytoscape_nodes.items():
                    data = n_data.get("data", {})
                    # Вказуємо тип вузла для створення (наприклад: Person, Company, Document)
                    node_type = data.get("type", "Entity").capitalize()
                    label = data.get("label", n_id)
                    
                    graph_data["nodes"].append({
                        "node_type": node_type,
                        "node_id": n_id,
                        "label": label,
                        "properties": data
                    })
                
                for edge in cytoscape_edges:
                    e_data = edge.get("data", {})
                    rel_type = e_data.get("label", "RELATED_TO").upper().replace(" ", "_")
                    
                    graph_data["edges"].append({
                        "source_id": e_data.get("source"),
                        "target_id": e_data.get("target"),
                        "relationship": rel_type,
                        "properties": e_data
                    })
                
                # 4. Save to Neo4j
                if self.neo4j_sink and graph_data["nodes"]:
                    await self.neo4j_sink.merge_ownership_graph(graph_data)
                    self.logger.info(
                        "osint_pipeline.neo4j_saved",
                        nodes_count=len(graph_data["nodes"]),
                        edges_count=len(graph_data["edges"])
                    )

            # 5. Save Complete Dossier to ClickHouse for analytics history
            if self.clickhouse_sink:
                dossier_data = {
                    "job_id": job_id,
                    "entity_id": entity_id,
                    "entity_type": entity_type,
                    "name": name,
                    "risk_score": risk_score,
                    "dossier": dossier.model_dump(mode="json")
                }
                await self.clickhouse_sink.insert_osint_dossier(dossier_data)
                self.logger.info("osint_pipeline.clickhouse_saved", job_id=job_id)
            
            # 6. Оновлюємо статус в Redis на completed
            if job_id:
                import json
                await self.redis.set(f"osint:job:{job_id}", json.dumps({
                    "status": "success",
                    "entity_id": entity_id,
                    "progress": 100,
                    "risk_score": risk_score
                }), ex=3600)
                
        except Exception as e:
            self.logger.error(
                "osint_pipeline.error",
                job_id=job_id,
                entity_id=entity_id,
                error=str(e),
                exc_info=True
            )
            if job_id:
                import json
                await self.redis.set(f"osint:job:{job_id}", json.dumps({
                    "status": "error",
                    "entity_id": entity_id,
                    "error": str(e)
                }), ex=3600)

