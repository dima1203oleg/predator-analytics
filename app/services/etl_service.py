import logging

logger = logging.getLogger("app.services.etl_service")

class ETLService:
    async def process_file(self, file_path: str, dataset_type: str = "custom"):
        logger.info(f"ETL processing file: {file_path}, type: {dataset_type} (Mock)")
        return {"success": True, "documents": [], "rows_processed": 100}

etl_service = ETLService()
