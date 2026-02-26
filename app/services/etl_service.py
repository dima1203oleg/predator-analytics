import logging

logger = logging.getLogger("app.services.etl_service")

class ETLService:
    async def process_file(self, file_path: str):
        logger.info(f"ETL processing file: {file_path} (Mock)")
        return {"status": "success", "rows": 100}

etl_service = ETLService()
