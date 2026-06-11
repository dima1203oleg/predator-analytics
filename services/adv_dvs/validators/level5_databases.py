import asyncio
from typing import Dict, Any
from .base import BaseValidator

class DatabasesValidator(BaseValidator):
    def __init__(self):
        super().__init__(name="DatabasesValidator", description="Databases Validation (8 systems)")

    async def _run_validation(self) -> Dict[str, Any]:
        details = {}
        errors = []
        
        # Ports for databases as per architecture
        db_ports = {
            "PostgreSQL": 5432,
            "ClickHouse": 8123,
            "Neo4j": 7687,
            "Qdrant": 6333,
            "OpenSearch": 9200,
            "Redis": 6379,
            "MinIO": 9000,
            "Kafka/Redpanda": 9092
        }
        
        for db, port in db_ports.items():
            try:
                # Basic connection test to local or remote host
                # We assume the validator runs inside docker and can access other containers
                # For now, just a dummy check
                reader, writer = await asyncio.wait_for(
                    asyncio.open_connection('localhost', port), timeout=0.5
                )
                writer.close()
                await writer.wait_closed()
                details[db] = "Online"
            except Exception as e:
                details[db] = "Offline"
                errors.append(f"{db} is unreachable on port {port}")
                
        success = len(errors) == 0
        
        return {
            "success": success,
            "details": details,
            "errors": errors
        }
