import clickhouse_connect
import structlog
from typing import List, Dict, Any
from app.config import settings

logger = structlog.get_logger(__name__)

class ClickHouseSink:
    def __init__(self):
        self.client = None
        self.host = settings.CLICKHOUSE_HOST
        self.port = settings.CLICKHOUSE_PORT
        self.user = settings.CLICKHOUSE_USER
        self.password = settings.CLICKHOUSE_PASSWORD

    def connect(self):
        try:
            self.client = clickhouse_connect.get_client(
                host=self.host,
                port=self.port,
                username=self.user,
                password=self.password,
                database='predator_analytics'
            )
            logger.info("Connected to ClickHouse", host=self.host, port=self.port)
        except Exception as e:
            logger.error("Failed to connect to ClickHouse", error=str(e))
            raise

    async def insert_declarations(self, data: List[Dict[str, Any]]):
        if not self.client:
            self.connect()
        
        try:
            # Мапінг даних до колонок ClickHouse
            rows = []
            for item in data:
                rows.append([
                    item.get('id'),
                    item.get('declaration_number'),
                    item.get('declaration_date'),
                    item.get('exporter_name'),
                    item.get('exporter_ueid'),
                    item.get('importer_name'),
                    item.get('importer_ueid'),
                    item.get('hs_code'),
                    item.get('hs_description'),
                    item.get('weight_kg'),
                    item.get('value_usd'),
                    item.get('origin_country'),
                    item.get('destination_country'),
                    item.get('customs_post_code'),
                    item.get('risk_score', 0.0)
                ])
            
            if rows:
                self.client.insert(
                    'customs_declarations',
                    rows,
                    column_names=[
                        'id', 'declaration_number', 'declaration_date', 'exporter_name', 
                        'exporter_ueid', 'importer_name', 'importer_ueid', 'hs_code', 
                        'hs_description', 'weight_kg', 'value_usd', 'origin_country', 
                        'destination_country', 'customs_post_code', 'risk_score'
                    ]
                )
                logger.info("Inserted batch into ClickHouse", count=len(rows))
        except Exception as e:
            logger.error("ClickHouse insertion error", error=str(e))
            # Не кидаємо виключення, щоб не блокувати основну інгестію, 
            # але в продакшні тут має бути Retry policy
