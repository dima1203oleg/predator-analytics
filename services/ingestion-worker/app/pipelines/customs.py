"""Customs Pipeline — PREDATOR Analytics v55.2-SM-EXTENDED.
Інтелектуальна обробка митних декларацій та профілювання компаній.
"""
from typing import Any

from app.normalizers.company import CompanyNormalizer
from app.parsers.csv_parser import CSVParser
from app.pipelines.base import BasePipeline
from app.sinks.postgres_sink import PostgresSink
from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.customs_pipeline")

class CustomsPipeline(BasePipeline):
    def __init__(self, tenant_id: str):
        super().__init__(tenant_id)
        self.sink = PostgresSink()

    async def run(self, source_data: Any) -> dict[str, Any]:
        """Процесинг митних даних: Парсинг -> Нормалізація (UEID) -> UPSERT."""
        logger.info("customs_pipeline.start", tenant_id=self.tenant_id)

        try:
            # 1. Парсинг (підтримка CSV рядків або списків)
            rows = []
            if isinstance(source_data, str):
                rows = CSVParser.parse_string(source_data)
            else:
                rows = source_data

            if not rows:
                return {"status": "skipped", "message": "No data to process"}

            # 2. Нормалізація та збагачення (UEID)
            processed_companies = []
            for row in rows:
                normalized = CompanyNormalizer.normalize_data(row, self.tenant_id)
                if normalized.get("ueid"):
                    processed_companies.append(normalized)

            # 3. Стійкий запис у БД (UPSERT)
            if processed_companies:
                await self.sink.upsert_companies(processed_companies)

            # 4. Запис самих декларацій
            valid_declarations = [r for r in rows if r.get("declaration_number") or r.get("customs_value")]
            if valid_declarations:
                # Додамо tenant_id до кожної декларації, якщо його немає
                for d in valid_declarations:
                    if "_tenant_id" not in d:
                        d["_tenant_id"] = self.tenant_id
                await self.sink.insert_declarations(valid_declarations)

            logger.info("customs_pipeline.completed", count=len(processed_companies), decl_count=len(valid_declarations))

            return {
                "status": "success",
                "processed_count": len(processed_companies),
                "tenant_id": self.tenant_id
            }

        except Exception as e:
            logger.error("customs_pipeline.failed", error=str(e))
            return {"status": "error", "message": str(e)}
        finally:
            await self.sink.close()
