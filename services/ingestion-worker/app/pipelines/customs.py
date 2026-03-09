"""
Customs Pipeline — PREDATOR Analytics v55.1 Ironclad.

ETL for customs declarations.
"""
from typing import Any, Dict, List
from app.pipelines.base import BasePipeline
from app.parsers.csv_parser import CSVParser
from app.normalizers.company import CompanyNormalizer
from app.sinks.postgres_sink import PostgresSink
from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.customs_pipeline")

class CustomsPipeline(BasePipeline):
    def __init__(self, tenant_id: str):
        super().__init__(tenant_id)
        self.sink = PostgresSink()

    async def run(self, source_data: Any) -> Dict[str, Any]:
        """Виконання пайплайну обробки митних даних."""
        logger.info("customs_pipeline.start", tenant_id=self.tenant_id)
        
        try:
            # Якщо дані прийшли як рядок CSV
            if isinstance(source_data, str):
                rows = CSVParser.parse_string(source_data)
                
                processed_batch = []
                for row in rows:
                    normalized = CompanyNormalizer.normalize_data(row)
                    normalized["tenant_id"] = self.tenant_id
                    processed_batch.append(normalized)
                
                await self.sink.write_batch("customs_declarations", processed_batch)
                
                return {
                    "status": "success",
                    "count": len(processed_batch)
                }
        except Exception as e:
            logger.error("customs_pipeline.failed", error=str(e))
            return {"status": "error", "message": str(e)}
        finally:
            await self.sink.close()
