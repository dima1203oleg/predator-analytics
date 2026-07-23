import asyncio
import logging
from typing import Optional

from app.harvesters.open_sanctions_harvester import OpenSanctionsHarvester
from app.normalizers.opensanctions_normalizer import OpenSanctionsNormalizer
from app.core.graph_projector import GraphProjector

logger = logging.getLogger("ingestion.pipelines.opensanctions")

class OpenSanctionsPipeline:
    """End-to-End Pipeline для OpenSanctions.
    
    Запускає Harvester (читання з потоку), передає дані в Normalizer,
    а потім завантажує нормалізовані вузли та зв'язки в Neo4j через GraphProjector.
    """

    def __init__(self, harvester: OpenSanctionsHarvester | None = None, normalizer: OpenSanctionsNormalizer | None = None, projector: GraphProjector | None = None):
        self.harvester = harvester or OpenSanctionsHarvester()
        self.normalizer = normalizer or OpenSanctionsNormalizer()
        self.projector = projector or GraphProjector()

    async def run(self, limit: Optional[int] = None) -> None:
        """Запуск пайплайну."""
        logger.info("Починаємо OpenSanctions Pipeline...")
        processed_entities = 0
        nodes_created = 0
        edges_created = 0

        try:
            async for raw_entity in self.harvester.stream_entities(limit=limit):
                processed_entities += 1
                
                # Нормалізація (перетворення на формат вузлів та зв'язків)
                for item_type, item_data in self.normalizer.normalize(raw_entity):
                    if item_type == "node":
                        # Запис вузла в Neo4j
                        await self.projector.project_raw_node(item_data)
                        nodes_created += 1
                    elif item_type == "edge":
                        # Запис зв'язку в Neo4j
                        await self.projector.project_raw_edge(item_data)
                        edges_created += 1
                        
                if processed_entities % 1000 == 0:
                    logger.info(f"[Pipeline] Оброблено {processed_entities} сутностей (Вузлів: {nodes_created}, Зв'язків: {edges_created})")

        except Exception as e:
            logger.error(f"Помилка під час виконання OpenSanctions Pipeline: {e}")
            raise
        finally:
            await self.harvester.close()
            logger.info(f"OpenSanctions Pipeline завершено. Оброблено: {processed_entities}. Згенеровано вузлів: {nodes_created}, зв'язків: {edges_created}.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    pipeline = OpenSanctionsPipeline()
    # Запускаємо з лімітом для тестування
    asyncio.run(pipeline.run(limit=100))
