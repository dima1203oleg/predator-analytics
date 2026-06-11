import asyncio
import logging
from typing import Dict, Any, List

import docker

logger = logging.getLogger(__name__)

class Level2ContainersValidator:
    """
    Рівень 2: Container Validation
    Перевіряє статус, uptime, ресурси та healthcheck основних контейнерів платформи.
    """
    EXPECTED_CONTAINERS = [
        "predator_backend",
        "predator_frontend",
        "predator_postgres",
        "predator_clickhouse",
        "predator_neo4j",
        "predator_qdrant",
        "predator_opensearch",
        "predator_minio",
        "predator_redpanda",
        "predator_redis",
        "predator_ollama",
        "predator_graph_service",
        "predator_osint_service",
        "predator_mcp_router",
        "predator_orchestrator",
        "predator_telegram_bot"
    ]

    def __init__(self):
        self.docker_client = None
        try:
            self.docker_client = docker.from_env()
        except Exception as e:
            logger.warning(f"Failed to initialize Docker client: {e}")

    async def validate(self) -> Dict[str, Any]:
        result = {
            "level": 2,
            "name": "Container Validation",
            "status": "pass",
            "details": {}
        }
        
        if not self.docker_client:
            result["status"] = "fail"
            result["error"] = "Docker client not available"
            return result

        containers_info = {}
        all_passed = True

        for container_name in self.EXPECTED_CONTAINERS:
            info = await self._check_container(container_name)
            containers_info[container_name] = info
            if info.get("status") != "running" and info.get("status") != "healthy":
                all_passed = False

        result["details"] = containers_info
        if not all_passed:
            result["status"] = "fail"

        return result

    async def _check_container(self, name: str) -> Dict[str, Any]:
        try:
            # Використовуємо asyncio для блокуючих викликів docker
            container = await asyncio.to_thread(self.docker_client.containers.get, name)
            
            status = container.status
            health_status = "unknown"
            
            # Перевірка healthcheck, якщо він є
            if "Health" in container.attrs.get("State", {}):
                health_status = container.attrs["State"]["Health"]["Status"]
                if health_status == "healthy":
                    status = "healthy"
                elif health_status == "unhealthy":
                    status = "unhealthy"

            # Статистика використання (один знімок)
            stats = await asyncio.to_thread(container.stats, stream=False)
            
            # Розрахунок CPU (спрощений підхід)
            cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - stats['precpu_stats']['cpu_usage']['total_usage']
            system_cpu_delta = stats['cpu_stats']['system_cpu_usage'] - stats['precpu_stats']['system_cpu_usage']
            number_cpus = stats['cpu_stats'].get('online_cpus', 1)
            
            cpu_percent = 0.0
            if system_cpu_delta > 0.0 and cpu_delta > 0.0:
                cpu_percent = (cpu_delta / system_cpu_delta) * number_cpus * 100.0

            # Розрахунок RAM
            memory_usage = stats['memory_stats'].get('usage', 0)
            memory_limit = stats['memory_stats'].get('limit', 0)
            memory_percent = (memory_usage / memory_limit * 100.0) if memory_limit > 0 else 0.0

            return {
                "status": status,
                "restarts": container.attrs.get("RestartCount", 0),
                "state": container.attrs["State"]["Status"],
                "health": health_status,
                "cpu_percent": round(cpu_percent, 2),
                "ram_mb": round(memory_usage / (1024 * 1024), 2),
                "ram_percent": round(memory_percent, 2)
            }
            
        except docker.errors.NotFound:
            return {"status": "missing", "error": "Container not found"}
        except Exception as e:
            return {"status": "error", "error": str(e)}
