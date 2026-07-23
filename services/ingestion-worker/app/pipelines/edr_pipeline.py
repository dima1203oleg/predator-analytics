"""EDR Connector Pipeline.

[DEPRECATED] 
УВАГА: Цей модуль є застарілим і використовувався для ручної обробки ЄДР.
Тепер забір та обробка даних ЄДР керується Автономною Фабрикою Конекторів 
через `ConnectorAgent` та `ETLGeneratorAgent`. Цей файл залишено для зворотної сумісності.
"""
import asyncio
import logging
from typing import Any

from app.sinks.neo4j_sink import Neo4jSink

logger = logging.getLogger("ingestion_worker.edr_pipeline")


class EDRPipeline:
    """Конвеєр для парсингу та побудови графа ЄДР."""
    
    def __init__(self, neo4j_sink: Neo4jSink) -> None:
        self.neo4j_sink = neo4j_sink
        
    async def process(self, event: dict[str, Any]) -> None:
        """Обробка події синхронізації ЄДР."""
        logger.warning("EDRPipeline: [DEPRECATED] Викликано застарілий конвеєр ЄДР. Будь ласка, використовуйте Автономну Фабрику.")
        logger.info("EDRPipeline: Запуск синхронізації з ЄДР (Ghost Runtime Safe).")
        
        # Симуляція скачування даних з реєстру
        # Насправді тут буде HTTPX запит до API з авторизацією
        logger.info("EDRPipeline: Виконується запит до API ЄДР...")
        await asyncio.sleep(2)
        
        mock_data = [
            {
                "edrpou": "12345678",
                "name": "ТОВ Роги та Копита",
                "status": "active",
                "director": {"name": "Бендер Остап Ібрагімович", "inn": "1111111111"},
                "founders": [
                    {"name": "Корейко Олександр Іванович", "inn": "2222222222", "share": 100}
                ]
            }
        ]
        
        nodes = []
        edges = []
        
        for company in mock_data:
            comp_id = f"COMPANY_{company['edrpou']}"
            
            # Вузол Компанії
            nodes.append({
                "label": "Company",
                "id": comp_id,
                "props": {
                    "id": comp_id,
                    "edrpou": company["edrpou"],
                    "name": company["name"],
                    "status": company["status"]
                }
            })
            
            # Вузол Директора
            dir_data = company.get("director")
            if dir_data:
                dir_id = f"PERSON_{dir_data['inn']}"
                nodes.append({
                    "label": "Person",
                    "id": dir_id,
                    "props": {
                        "id": dir_id,
                        "inn": dir_data["inn"],
                        "name": dir_data["name"]
                    }
                })
                edges.append({
                    "rel_type": "DIRECTS",
                    "source_id": dir_id,
                    "target_id": comp_id,
                    "props": {"role": "director"}
                })
                
            # Вузли Засновників
            for founder in company.get("founders", []):
                found_id = f"PERSON_{founder['inn']}"
                nodes.append({
                    "label": "Person",
                    "id": found_id,
                    "props": {
                        "id": found_id,
                        "inn": founder["inn"],
                        "name": founder["name"]
                    }
                })
                edges.append({
                    "rel_type": "OWNS",
                    "source_id": found_id,
                    "target_id": comp_id,
                    "props": {"share": founder.get("share", 0)}
                })
                
        # Bulk завантаження в Neo4j
        if self.neo4j_sink:
            if nodes:
                # Групуємо по лейблах (Company, Person)
                companies = [n for n in nodes if n["label"] == "Company"]
                persons = [n for n in nodes if n["label"] == "Person"]
                
                if companies:
                    await self.neo4j_sink.merge_bulk_nodes("Company", companies)
                if persons:
                    await self.neo4j_sink.merge_bulk_nodes("Person", persons)
                    
            if edges:
                # Групуємо по типах зв'язків
                directs = [e for e in edges if e["rel_type"] == "DIRECTS"]
                owns = [e for e in edges if e["rel_type"] == "OWNS"]
                
                if directs:
                    await self.neo4j_sink.merge_bulk_edges("DIRECTS", directs)
                if owns:
                    await self.neo4j_sink.merge_bulk_edges("OWNS", owns)
                    
        logger.info("EDRPipeline: Синхронізація успішно завершена.")
