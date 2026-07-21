import abc
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class BaseOsintCollector(abc.ABC):
    """
    Базовий клас для всіх OSINT-колекторів (EDR, Leaks, Blockchain, etc.)
    Визначає стандартизований життєвий цикл:
    1. collect (fetch from source)
    2. save_raw (save raw JSON/HTML to MinIO Data Lake)
    3. normalize (convert to standard graph/dossier format)
    """

    def __init__(self, source_name: str):
        self.source_name = source_name

    @abc.abstractmethod
    async def collect(self, query: str, **kwargs) -> Dict[str, Any]:
        """
        Виконує запит до зовнішнього джерела.
        Повертає 'сирий' формат даних.
        """
        pass

    async def save_raw(self, identifier: str, data: Dict[str, Any]) -> bool:
        """
        Зберігає сирі дані у MinIO (Data Lake) для аудиту та повторної обробки.
        Поки що симулюємо збереження (логіювання), оскільки MinIO клієнт 
        існує в RegistryManager, але OSINT колектори можуть мати свій бакет.
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"osint/{self.source_name}/{identifier}_{timestamp}.json"
            
            # В реальній імплементації:
            # json_bytes = json.dumps(data, ensure_ascii=False).encode('utf-8')
            # self.minio_client.put_object(...)
            
            logger.info(f"[MinIO Mock] Збережено сирі дані колектора {self.source_name} у файл {filename}")
            return True
        except Exception as e:
            logger.error(f"Помилка збереження сирих даних ({self.source_name}): {e}")
            return False

    @abc.abstractmethod
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Нормалізує сирі дані у стандартизований формат:
        {
            "nodes": [...],
            "edges": [...],
            "dossier_updates": {...}
        }
        """
        pass

    async def run_pipeline(self, query: str, identifier: str) -> Dict[str, Any]:
        """
        Запускає повний цикл: збір -> збереження сирих даних -> нормалізація.
        """
        logger.info(f"Запуск колектора {self.source_name} для запиту: {query}")
        raw_data = await self.collect(query)
        
        if not raw_data:
            logger.warning(f"Колектор {self.source_name} не знайшов даних для: {query}")
            return {"nodes": [], "edges": [], "dossier_updates": {}}
            
        await self.save_raw(identifier, raw_data)
        
        normalized = self.normalize(raw_data)
        return normalized
