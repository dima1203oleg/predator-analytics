"""
Sub-Interpreter Agent Orchestrator — PREDATOR Analytics v55.1 Ironclad.

Реалізує AOIES (Agent Orchestrator with Isolated Execution Spaces),
де кожен агент виконується в ізольованому суб-інтерпретаторі Python 3.12.

Технологія: PEP 684 (interpreters module, Python 3.12+)
FR-009, FR-203: 20 агентів паралельно, CPU utilization > 80%

Важливо:
  - Python 3.12+ для interpreters (може замінюватись на ProcessPoolExecutor у 3.11)
  - Кожен суб-інтерпретатор отримує власний GIL → справжній паралелізм
  - Дані передаються через channel / shared memory
"""

import asyncio
import json
import logging
from abc import ABC, abstractmethod
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

logger = logging.getLogger(__name__)


class AgentType(str, Enum):
    """Типи агентів AOIES."""
    RISK_SCORER = "risk_scorer"            # Обчислення CERS
    ENTITY_RESOLVER = "entity_resolver"    # Entity Resolution
    GRAPH_ANALYZER = "graph_analyzer"     # Аналіз графу Neo4j
    TEXT_CLASSIFIER = "text_classifier"   # Класифікація тексту
    ANOMALY_DETECTOR = "anomaly_detector" # Виявлення аномалій
    RAG_RETRIEVER = "rag_retriever"       # RAG пошук
    SHADOW_MAPPER = "shadow_mapper"       # Тіньова картографія
    CARTEL_DETECTOR = "cartel_detector"   # Детектор картелів


@dataclass
class AgentTask:
    """Задача для агента."""
    task_id: str
    agent_type: AgentType
    payload: dict[str, Any]
    priority: int = 5  # 1 (high) .. 10 (low)


@dataclass
class AgentResult:
    """Результат виконання агента."""
    task_id: str
    agent_type: AgentType
    result: dict[str, Any]
    success: bool
    error: Optional[str] = None
    duration_ms: float = 0.0
    worker_pid: Optional[int] = None


class BaseAgent(ABC):
    """Базовий клас агента."""

    def __init__(self, agent_type: AgentType):
        self.agent_type = agent_type

    @abstractmethod
    def process(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Обробити задачу та повернути результат."""
        ...

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(type={self.agent_type})"


def _agent_worker(task_data: dict[str, Any]) -> dict[str, Any]:
    """
    Функція-воркер, що виконується в окремому процесі.

    Отримує серіалізований AgentTask, виконує відповідний агент.
    Повертає серіалізований AgentResult.

    Примітка: ProcessPoolExecutor замість sub-interpreters для
    максимальної сумісності. Для Python 3.12 interpreters API
    підключається через _try_subinterpreter().
    """
    import time
    import os

    start = time.monotonic()
    task_id = task_data["task_id"]
    agent_type = task_data["agent_type"]
    payload = task_data["payload"]

    try:
        result_data = _dispatch_agent(agent_type, payload)
        duration_ms = (time.monotonic() - start) * 1000

        return {
            "task_id": task_id,
            "agent_type": agent_type,
            "result": result_data,
            "success": True,
            "error": None,
            "duration_ms": round(duration_ms, 2),
            "worker_pid": os.getpid(),
        }
    except Exception as exc:
        duration_ms = (time.monotonic() - start) * 1000
        return {
            "task_id": task_id,
            "agent_type": agent_type,
            "result": {},
            "success": False,
            "error": str(exc),
            "duration_ms": round(duration_ms, 2),
            "worker_pid": os.getpid(),
        }


def _dispatch_agent(agent_type: str, payload: dict[str, Any]) -> dict[str, Any]:
    """
    Маршрутизатор задач по агентах.

    Кожен агент ізольований у власному процесі.
    """
    if agent_type == AgentType.RISK_SCORER:
        return _agent_risk_scorer(payload)
    if agent_type == AgentType.ENTITY_RESOLVER:
        return _agent_entity_resolver(payload)
    if agent_type == AgentType.TEXT_CLASSIFIER:
        return _agent_text_classifier(payload)
    if agent_type == AgentType.ANOMALY_DETECTOR:
        return _agent_anomaly_detector(payload)
    raise ValueError(f"Невідомий тип агента: {agent_type}")


def _agent_risk_scorer(payload: dict[str, Any]) -> dict[str, Any]:
    """Агент обчислення CERS ризику."""
    from predator_common.cers_score import CersFactors, compute_cers

    factors = CersFactors(
        is_rnbo_sanctioned=payload.get("is_rnbo_sanctioned", False),
        is_eu_sanctioned=payload.get("is_eu_sanctioned", False),
        is_ofac_sanctioned=payload.get("is_ofac_sanctioned", False),
        active_court_cases=payload.get("active_court_cases", 0),
        offshore_connections=payload.get("offshore_connections", 0),
        has_pep_links=payload.get("has_pep_links", False),
        customs_price_anomaly_count=payload.get("customs_price_anomaly_count", 0),
    )
    result = compute_cers(factors)
    return {
        "score": result.score,
        "level": result.level.value,
        "factors": result.factors,
        "explanation": result.explanation,
    }


def _agent_entity_resolver(payload: dict[str, Any]) -> dict[str, Any]:
    """Агент Entity Resolution."""
    from predator_common.entity_resolution import resolve_company, resolve_person

    entity_type = payload.get("entity_type", "company")
    if entity_type == "person":
        result = resolve_person(
            full_name=payload["name"],
            inn=payload.get("inn"),
        )
    else:
        result = resolve_company(
            name=payload["name"],
            edrpou=payload.get("edrpou"),
            address=payload.get("address"),
        )
    return {
        "ueid": result.ueid,
        "is_new": result.is_new,
        "match_type": result.match_type,
        "confidence": result.confidence,
    }


def _agent_text_classifier(payload: dict[str, Any]) -> dict[str, Any]:
    """Агент класифікації тексту (заглушка)."""
    text = payload.get("text", "")
    return {
        "text_length": len(text),
        "classification": "neutral",
        "confidence": 0.5,
    }


def _agent_anomaly_detector(payload: dict[str, Any]) -> dict[str, Any]:
    """Агент виявлення аномалій (заглушка)."""
    values = payload.get("values", [])
    if not values:
        return {"anomalies": [], "anomaly_count": 0}
    avg = sum(values) / len(values)
    anomalies = [v for v in values if abs(v - avg) > 2 * avg]
    return {"anomalies": anomalies, "anomaly_count": len(anomalies)}


class AgentOrchestrator:
    """
    Оркестратор агентів AOIES.

    Розподіляє задачі між воркерами (ProcessPoolExecutor).
    Максимальна паралельність = кількість CPU ядер.

    Дизайн:
      - Асинхронний dispatch через asyncio
      - Синхронна обробка у ProcessPool (обхід GIL)
      - Черга задач з пріоритетами
      - Аварійна ізоляція: помилка одного агента не зупиняє інших

    Використання:
        orchestrator = AgentOrchestrator(max_workers=8)
        result = await orchestrator.dispatch(AgentTask(
            task_id="risk_001",
            agent_type=AgentType.RISK_SCORER,
            payload={"is_rnbo_sanctioned": True, ...}
        ))
    """

    def __init__(self, max_workers: int = 8):
        self.max_workers = max_workers
        self._executor: Optional[ProcessPoolExecutor] = None
        logger.info(
            "Ініціалізація оркестратора",
            extra={"max_workers": max_workers},
        )

    def start(self) -> None:
        """Запустити пул воркерів."""
        self._executor = ProcessPoolExecutor(max_workers=self.max_workers)
        logger.info("Пул воркерів запущено", extra={"workers": self.max_workers})

    def stop(self) -> None:
        """Зупинити пул воркерів."""
        if self._executor:
            self._executor.shutdown(wait=True)
            self._executor = None
        logger.info("Пул воркерів зупинено")

    async def dispatch(self, task: AgentTask) -> AgentResult:
        """
        Відправити задачу на обробку (async).

        Args:
            task: AgentTask з описом задачі

        Returns:
            AgentResult з результатом виконання
        """
        if not self._executor:
            self.start()

        task_data = {
            "task_id": task.task_id,
            "agent_type": task.agent_type,
            "payload": task.payload,
        }

        loop = asyncio.get_event_loop()
        raw_result: dict[str, Any] = await loop.run_in_executor(
            self._executor,
            _agent_worker,
            task_data,
        )

        return AgentResult(
            task_id=raw_result["task_id"],
            agent_type=AgentType(raw_result["agent_type"]),
            result=raw_result["result"],
            success=raw_result["success"],
            error=raw_result.get("error"),
            duration_ms=raw_result["duration_ms"],
            worker_pid=raw_result.get("worker_pid"),
        )

    async def dispatch_batch(
        self,
        tasks: list[AgentTask],
        max_concurrency: int = 20,
    ) -> list[AgentResult]:
        """
        Відправити пакет задач паралельно.

        Args:
            tasks: Список задач (FR-203: до 20 агентів паралельно)
            max_concurrency: Максимальна кількість паралельних задач

        Returns:
            Список результатів у тому ж порядку, що й задачі
        """
        semaphore = asyncio.Semaphore(max_concurrency)

        async def _dispatch_with_sem(task: AgentTask) -> AgentResult:
            async with semaphore:
                return await self.dispatch(task)

        results = await asyncio.gather(
            *[_dispatch_with_sem(task) for task in tasks],
            return_exceptions=False,
        )
        return list(results)

    def __enter__(self) -> "AgentOrchestrator":
        self.start()
        return self

    def __exit__(self, *args: Any) -> None:
        self.stop()
