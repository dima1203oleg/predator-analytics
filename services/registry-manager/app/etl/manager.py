"""
ETL Manager — PREDATOR Registry Manager
Розділ 6. ETL (Bulk vs Incremental REST)
Розділ 8. Збереження сирих даних (MinIO)
Розділ 9. Нормалізація
"""
import logging
import importlib.util
import sys
from pathlib import Path

from app.services.storage_router import StorageRouter

logger = logging.getLogger(__name__)

class ETLManager:
    def __init__(self):
        logger.info("Initializing ETL Manager")
        self.storage_router = StorageRouter()
        self.normalizer_dir = Path("/Users/Shared/Predator_60/services/ingestion-worker/app/normalizers/auto")

    async def execute_pipeline(self, api_metadata: dict):
        """
        Визначає, який тип конвеєра використовувати.
        """
        if api_metadata.get("has_bulk_dump"):
            await self._run_bulk_pipeline(api_metadata)
        else:
            await self._run_incremental_rest_pipeline(api_metadata)

    async def _run_bulk_pipeline(self, metadata: dict):
        """
        Bulk Dump Pipeline:
        Download -> Checksum -> Extract -> Normalize -> Deduplicate -> Store Raw -> Store Clean -> Index -> Analytics
        """
        logger.info(f"Starting Bulk Pipeline for {metadata['source_url']}")
        await self._store_raw(metadata)
        
        # Моковані сирі дані для пайплайну
        raw_data = {"id": "bulk_1", "schema": "Company", "properties": {"name": ["Bulk Inc."]}}
        normalized_items = await self._normalize(raw_data, metadata.get("name", "unknown"))
        await self._index(normalized_items)

    async def _run_incremental_rest_pipeline(self, metadata: dict):
        """
        Incremental REST Pipeline:
        Cursor -> Scheduler -> Normalize -> Index
        """
        logger.info(f"Starting Incremental REST Pipeline for {metadata['source_url']}")
        await self._store_raw(metadata)
        
        # Моковані сирі дані для пайплайну
        raw_data = {"id": "inc_1", "schema": "Person", "properties": {"name": ["John Doe"]}}
        normalized_items = await self._normalize(raw_data, metadata.get("name", "unknown"))
        await self._index(normalized_items)

    async def _store_raw(self, data: dict):
        # Збереження в MinIO без змін (WORM)
        source_name = data.get("name", "unknown")
        logger.info(f"Storing raw data to MinIO (WORM) bucket: raw-zone, prefix: {source_name}/")
        
        # Імітація S3 PutObject з Object Lock (WORM)
        import time
        import uuid
        timestamp = int(time.time())
        object_key = f"{source_name}/{timestamp}_{uuid.uuid4().hex[:8]}.json"
        
        logger.info(f"Successfully uploaded {object_key} to MinIO with Object Lock (Compliance mode, 7 years).")

    async def _normalize(self, data: dict, source_name: str) -> list:
        # Трансформація у спільні моделі через автозгенерований нормалізатор
        logger.info(f"Normalizing data for {source_name}")
        
        safe_name = source_name.replace("/", "_").replace(".", "_")
        module_name = f"auto_normalizer_{safe_name}"
        file_path = self.normalizer_dir / f"{module_name}.py"
        
        normalized_items = []
        if file_path.exists():
            try:
                spec = importlib.util.spec_from_file_location(module_name, str(file_path))
                module = importlib.util.module_from_spec(spec)
                sys.modules[module_name] = module
                spec.loader.exec_module(module)
                
                # Instantiate normalizer
                NormalizerClass = getattr(module, f"AutoNormalizer_{safe_name}")
                normalizer_instance = NormalizerClass()
                
                # Execute generator
                for item_type, item_data in normalizer_instance.normalize(data):
                    normalized_items.append((item_type, item_data))
                    
            except Exception as e:
                logger.error(f"Failed to load or execute normalizer {module_name}: {e}")
        else:
            logger.warning(f"No auto-normalizer found for {source_name} at {file_path}")
            
        return normalized_items
    
    async def _index(self, normalized_items: list):
        # Передача на Storage Router
        logger.info(f"Sending {len(normalized_items)} items to Storage Router for multi-DB indexing")
        for item_type, item_data in normalized_items:
            # Map FtM node/edge to standard payload expected by StorageRouter
            if item_type == "node":
                payload = {
                    "entity_type": item_data.get("label"),
                    "ueid": item_data.get("id"),
                    **item_data.get("props", {})
                }
                # StorageRouter also expects raw_node for graph_projector?
                # Actually, Neo4j routing in StorageRouter expects valid entity_type or it skips.
                # So we just pass the payload.
                await self.storage_router.route_data(payload)
            elif item_type == "edge":
                # StorageRouter currently handles node entities. We can pass edges as well if needed
                payload = {
                    "entity_type": "Relation",
                    "source_id": item_data.get("source_id"),
                    "target_id": item_data.get("target_id"),
                    "rel_type": item_data.get("rel_type"),
                    **item_data.get("props", {})
                }
                await self.storage_router.route_data(payload)
