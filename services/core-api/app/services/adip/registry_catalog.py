import logging
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class RegistryCatalogMock:
    """
    Етап 6 & 9: Registry Catalog
    Тимчасовий in-memory mock для бази даних.
    В майбутньому буде інтегровано з PostgreSQL через SQLAlchemy ORM.
    """
    def __init__(self):
        self.registry = {}
        
    async def record_sync(self, url: str, status: str, rows: int = 0, error: Optional[str] = None):
        """
        Записує результати синхронізації (Етап 9).
        """
        if url not in self.registry:
            self.registry[url] = {
                "created_at": datetime.utcnow().isoformat(),
                "sync_history": []
            }
            
        record = {
            "timestamp": datetime.utcnow().isoformat(),
            "status": status,
            "rows_processed": rows,
            "error": error
        }
        self.registry[url]["sync_history"].append(record)
        self.registry[url]["last_sync_status"] = status
        
        logger.info(f"Registry: Записано статус {status} для {url}. Оброблено {rows} рядків.")
        
    async def register_source(self, url: str, metadata: dict):
        """
        Реєстрація нового джерела в каталозі.
        """
        if url not in self.registry:
            self.registry[url] = {
                "created_at": datetime.utcnow().isoformat(),
                "metadata": metadata,
                "sync_history": []
            }
        else:
            self.registry[url]["metadata"].update(metadata)
            
        logger.info(f"Registry: Джерело {url} зареєстровано в каталозі.")

catalog_db = RegistryCatalogMock()

async def record_sync(url: str, status: str, rows: int = 0, error: Optional[str] = None):
    await catalog_db.record_sync(url, status, rows, error)
