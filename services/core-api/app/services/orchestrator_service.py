"""Orchestrator Service — PREDATOR Analytics v61.0-ELITE.

Управління життєвим циклом системних компонентів (pods, containers).
"""

import asyncio
from datetime import datetime, UTC
from typing import Dict, List, Optional
from pydantic import BaseModel

from predator_common.logging import get_logger
from app.services.audit_service import audit_logger

logger = get_logger("core_api.orchestrator")

class PodStatus(BaseModel):
    id: str
    name: str
    status: str
    cpu: str
    mem: str
    restarts: int
    uptime: str
    replicas: int

class OrchestratorService:
    """Сервіс для імітації та виконання оркестраційних команд."""
    
    _instance: Optional["OrchestratorService"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OrchestratorService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        # Стан, який ми зберігаємо локально (рестарти, репліки, оверрайди статусу)
        self._pod_states: Dict[str, Dict[str, Any]] = {}
        self._seed_states()

    def _seed_states(self):
        """Початкове заповнення станів."""
        services = [
            "core-api", "ingestion-worker", "graph-service", "ml-studio", 
            "osint-gatherer", "postgresql", "redis", "neo4j", "kafka", 
            "minio", "opensearch", "qdrant", "ollama", "mlflow"
        ]
        for name in services:
            self._pod_states[name] = {
                "restarts": 0,
                "replicas": 1 if name != "ingestion-worker" else 3,
                "status_override": None
            }

    async def get_pods(self) -> List[PodStatus]:
        """Отримання списку всіх активних подів з урахуванням health_service."""
        from app.core.health import health_service
        health = await health_service.comprehensive_health_check()
        services = health.get("services", {})
        
        # Також додаємо наші "віртуальні" сервіси, яких немає в health check, але є в списку
        all_names = set(services.keys()) | set(self._pod_states.keys())
        
        pods = []
        for name in all_names:
            state = self._pod_states.get(name, {"restarts": 0, "replicas": 1, "status_override": None})
            service_info = services.get(name, {"status": "ok"})
            
            status = state["status_override"] or self._map_health_status(service_info.get("status", "ok"))
            
            pods.append(PodStatus(
                id=name,
                name=f"predator-{name}",
                status=status,
                cpu=f"{10 + (hash(name) % 15)}%",
                mem=f"{128 + (hash(name) % 512)}Mi",
                restarts=state["restarts"],
                uptime="12h 30m",
                replicas=state["replicas"]
            ))
        return pods

    def _map_health_status(self, status: str) -> str:
        mapping = {
            "ok": "Running",
            "degraded": "Degraded",
            "offline": "Offline",
            "error": "CrashLoopBackOff",
        }
        return mapping.get(status, "Running")

    async def restart_pod(self, pod_id: str) -> bool:
        """Перезапуск конкретного пода."""
        if pod_id not in self._pod_states:
            # Спробуємо додати якщо це новий сервіс
            self._pod_states[pod_id] = {"restarts": 0, "replicas": 1, "status_override": None}
        
        state = self._pod_states[pod_id]
        logger.info(f"Перезапуск пода {pod_id}")
        
        state["status_override"] = "Restarting"
        state["restarts"] += 1
        
        await audit_logger.log(
            action="pod_restart",
            resource_type="infrastructure",
            resource_id=pod_id,
            details={"pod_id": pod_id, "new_restarts": state["restarts"]}
        )
        
        # У фоні "відновлюємо" статус через 5 секунд
        async def _restore():
            await asyncio.sleep(5)
            state["status_override"] = None
            logger.info(f"Под {pod_id} відновлено.")
            
        asyncio.create_task(_restore())
        return True

    async def scale_pod(self, pod_id: str, delta: int) -> bool:
        """Зміна кількості реплік пода."""
        if pod_id not in self._pod_states:
            self._pod_states[pod_id] = {"restarts": 0, "replicas": 1, "status_override": None}
        
        state = self._pod_states[pod_id]
        old_replicas = state["replicas"]
        new_replicas = max(1, old_replicas + delta)
        logger.info(f"Масштабування {pod_id}: {old_replicas} -> {new_replicas}")
        
        state["replicas"] = new_replicas
        
        await audit_logger.log(
            action="pod_scale",
            resource_type="infrastructure",
            resource_id=pod_id,
            details={"pod_id": pod_id, "old_replicas": old_replicas, "new_replicas": new_replicas}
        )
        return True

def uuid_short():
    import uuid
    return uuid.uuid4().hex[:6]

orchestrator_service = OrchestratorService()
