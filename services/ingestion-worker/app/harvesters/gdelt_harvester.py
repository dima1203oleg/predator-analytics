"""GDELT 2.0 Harvester — Геополітичний моніторинг новинних потоків.

Виконує безперервний глобальний моніторинг новинних потоків з усього світу.
Дані GDELT оновлюються кожні 15 хвилин. Інтеграційний конвеєр використовує 
мікро-пакетну обробку (micro-batching), декомпресуючи ZIP-архіви в пам'яті 
та видобуваючи події (events), локації та тональність.
"""

import asyncio
import io
import zipfile
from typing import Any, AsyncGenerator, Dict, List, Optional

import httpx
import pandas as pd
from tenacity import retry, stop_after_attempt, wait_exponential

from predator_common.logging import get_logger
from app.core.etl_state import ETLStateManager

logger = get_logger("ingestion.harvesters.gdelt")

GDELT_MASTER_LIST_URL = "http://data.gdeltproject.org/gdeltv2/masterfilelist.txt"
PIPELINE_ID = "gdelt_harvester"

# Структура колонок GDELT 2.0 Export File (спрощена для прикладу)
GDELT_COLUMNS = [
    "GLOBALEVENTID", "SQLDATE", "MonthYear", "Year", "FractionDate", "Actor1Code", "Actor1Name", 
    "Actor1CountryCode", "Actor1KnownGroupCode", "Actor1EthnicCode", "Actor1Religion1Code", 
    "Actor1Religion2Code", "Actor1Type1Code", "Actor1Type2Code", "Actor1Type3Code", "Actor2Code", 
    "Actor2Name", "Actor2CountryCode", "Actor2KnownGroupCode", "Actor2EthnicCode", 
    "Actor2Religion1Code", "Actor2Religion2Code", "Actor2Type1Code", "Actor2Type2Code", 
    "Actor2Type3Code", "IsRootEvent", "EventCode", "EventBaseCode", "EventRootCode", "QuadClass", 
    "GoldsteinScale", "NumMentions", "NumSources", "NumArticles", "AvgTone", "Actor1Geo_Type", 
    "Actor1Geo_FullName", "Actor1Geo_CountryCode", "Actor1Geo_ADM1Code", "Actor1Geo_Lat", 
    "Actor1Geo_Long", "Actor1Geo_FeatureID", "Actor2Geo_Type", "Actor2Geo_FullName", 
    "Actor2Geo_CountryCode", "Actor2Geo_ADM1Code", "Actor2Geo_Lat", "Actor2Geo_Long", 
    "Actor2Geo_FeatureID", "ActionGeo_Type", "ActionGeo_FullName", "ActionGeo_CountryCode", 
    "ActionGeo_ADM1Code", "ActionGeo_Lat", "ActionGeo_Long", "ActionGeo_FeatureID", "DATEADDED", "SOURCEURL"
]


class GDELTHarvester:
    """Клас для мікробатч-завантаження даних GDELT 2.0."""

    def __init__(self) -> None:
        self.http_client = httpx.AsyncClient(timeout=60.0)
        self.state_manager = ETLStateManager()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=5, max=30))
    async def _fetch_master_list(self) -> List[Dict[str, str]]:
        """Отримує список доступних файлів GDELT."""
        logger.info("GDELTHarvester: Завантаження Master File List...")
        response = await self.http_client.get(GDELT_MASTER_LIST_URL)
        response.raise_for_status()
        
        files = []
        for line in response.text.splitlines():
            if not line.strip():
                continue
            parts = line.split(" ")
            if len(parts) >= 3:
                file_size, file_hash, file_url = parts[0], parts[1], parts[2]
                if file_url.endswith("export.CSV.zip"):
                    files.append({"url": file_url, "hash": file_hash})
                    
        return files

    async def _process_zip_stream(self, file_url: str) -> List[Dict[str, Any]]:
        """Завантажує та декомпресує ZIP архів у пам'яті (без збереження на диск)."""
        logger.debug(f"GDELTHarvester: Завантаження архіву {file_url}")
        
        response = await self.http_client.get(file_url)
        response.raise_for_status()
        
        # Читання ZIP з оперативної пам'яті
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            # Очікується лише один CSV файл всередині
            filename = z.namelist()[0]
            with z.open(filename) as f:
                # Використовуємо Pandas для ефективного парсингу TSV (GDELT використовує Tab Separated)
                df = pd.read_csv(f, sep="\t", header=None, names=GDELT_COLUMNS, low_memory=False)
                
                # Відфільтрувати лише значущі геополітичні події, наприклад, пов'язані з Україною
                # df = df[(df['Actor1CountryCode'] == 'UKR') | (df['Actor2CountryCode'] == 'UKR')]
                
                # Повертаємо як список словників
                return df.to_dict(orient="records")

    async def harvest_microbatches(self) -> AsyncGenerator[List[Dict[str, Any]], None]:
        """Основний цикл мікро-пакетної обробки."""
        state = await self.state_manager.get_state(PIPELINE_ID)
        processed_urls = set(state.get("processed_urls", []))
        
        master_list = await self._fetch_master_list()
        
        # Обробляємо лише останні 10 файлів для синхронізації
        recent_files = master_list[-10:]
        
        for file_info in recent_files:
            file_url = file_info["url"]
            
            if file_url in processed_urls:
                continue
                
            try:
                events = await self._process_zip_stream(file_url)
                
                if events:
                    yield events
                    
                processed_urls.add(file_url)
                
                # Зберігаємо стан (останні 100 URL, щоб не переповнювати Redis)
                await self.state_manager.save_state(
                    PIPELINE_ID,
                    {"processed_urls": list(processed_urls)[-100:]}
                )
                
                logger.info(f"GDELTHarvester: Успішно оброблено {file_url} ({len(events)} подій)")
                
                # Пауза між завантаженнями
                await asyncio.sleep(1.0)
                
            except Exception as e:
                logger.error(f"GDELTHarvester: Помилка обробки {file_url}: {e}")

    async def close(self) -> None:
        """Закриття HTTP клієнта."""
        await self.http_client.aclose()
