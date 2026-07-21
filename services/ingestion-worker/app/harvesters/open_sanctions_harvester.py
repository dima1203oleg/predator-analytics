"""OpenSanctions Harvester — Потоковий збирач глобальних санкційних списків.

Дані OpenSanctions надаються у форматі FollowTheMoney (FtM) як line-delimited JSON.
Через великий обсяг файлів (декілька ГБ), конвеєр використовує HTTP потокове читання
(streaming) для запобігання переповненню пам'яті (Out of Memory), обробляючи кожен
рядок незалежно та відфільтровуючи лише релевантні сутності.
"""

import asyncio
from typing import Any, AsyncGenerator, Dict, List, Optional, Set

import httpx
import orjson
from tenacity import retry, stop_after_attempt, wait_exponential

from predator_common.logging import get_logger

logger = get_logger("ingestion.harvesters.opensanctions")

# URL для завантаження FtM експорту всього набору даних (default)
OPENSANCTIONS_FTM_URL = "https://data.opensanctions.org/datasets/latest/default/entities.ftm.json"

# Релевантні схеми сутностей FtM, які ми хочемо імпортувати
RELEVANT_SCHEMAS: Set[str] = {
    "Person",
    "Company",
    "Organization",
    "Vessel",
    "Airplane",
    "LegalEntity"
}


class OpenSanctionsHarvester:
    """Потоковий збирач для OpenSanctions."""

    def __init__(self, target_schemas: Optional[Set[str]] = None) -> None:
        # Встановлюємо таймаут підключення, але не обмежуємо час читання всього потоку
        self.http_client = httpx.AsyncClient(timeout=httpx.Timeout(connect=60.0, read=None, write=60.0, pool=60.0))
        self.target_schemas = target_schemas or RELEVANT_SCHEMAS

    def _is_relevant_entity(self, entity: Dict[str, Any]) -> bool:
        """Перевіряє, чи відповідає сутність цільовим критеріям (схема, теми)."""
        schema = entity.get("schema")
        
        # 1. Фільтрація за типом сутності (schema)
        if schema not in self.target_schemas:
            return False
            
        # 2. Можна додати фільтрацію за темами (topics), наприклад:
        # topics = entity.get("properties", {}).get("topics", [])
        # if not any(t in {"sanction", "role.pep", "crime"} for t in topics):
        #     return False
            
        return True

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=5, max=30),
        reraise=True,
    )
    async def stream_entities(self, limit: Optional[int] = None) -> AsyncGenerator[Dict[str, Any], None]:
        """Відкриває HTTP потік і генерує відфільтровані FtM сутності."""
        try:
            logger.info("OpenSanctionsHarvester: Ініціалізація потоку завантаження FtM...")
            
            async with self.http_client.stream("GET", OPENSANCTIONS_FTM_URL) as response:
                response.raise_for_status()
                
                processed_count = 0
                yielded_count = 0
                
                # Читання файлу рядок за рядком (line-delimited JSON)
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                        
                    processed_count += 1
                    
                    try:
                        entity = orjson.loads(line)
                    except orjson.JSONDecodeError:
                        logger.warning(f"OpenSanctionsHarvester: Помилка парсингу JSON на рядку {processed_count}")
                        continue
                        
                    if self._is_relevant_entity(entity):
                        yield entity
                        yielded_count += 1
                        
                        if limit and yielded_count >= limit:
                            logger.info(f"OpenSanctionsHarvester: Досягнуто ліміт у {limit} записів.")
                            break
                            
                    # Логування прогресу
                    if processed_count % 100000 == 0:
                        logger.info(f"OpenSanctionsHarvester: Оброблено {processed_count} рядків, знайдено {yielded_count} цільових сутностей...")
                        
            logger.info(f"OpenSanctionsHarvester: Потік завершено. Всього оброблено {processed_count} рядків, з них релевантних {yielded_count}.")
            
        except httpx.HTTPStatusError as e:
            logger.error(f"OpenSanctionsHarvester: HTTP помилка під час потокового читання: {e.response.status_code}")
            raise
        except Exception as e:
            logger.error(f"OpenSanctionsHarvester: Системна помилка під час потокового читання: {e}")
            raise
            
    async def close(self) -> None:
        """Закриття HTTP клієнта."""
        await self.http_client.aclose()
