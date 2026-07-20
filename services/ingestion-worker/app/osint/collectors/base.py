"""Base Collector — Абстрактний базовий клас для всіх збирачів даних.

Визначає контракт для модулів збору інформації з різних джерел.
Кожен збирач має:
  - name: унікальне ім'я збирача
  - classification: рівень класифікації (WHITE/GREY/BLACK)
  - collect(): основний метод збору
  - health_check(): перевірка доступності джерела
"""
from __future__ import annotations

import time
from abc import ABC, abstractmethod
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, Field

from predator_common.logging import get_logger

logger = get_logger("die.collectors")


# ======================== ПЕРЕЛІЧЕННЯ ========================


class EntityType(StrEnum):
    """Тип сутності для пошуку."""
    PERSON = "person"
    COMPANY = "company"
    PROPERTY = "property"
    VEHICLE = "vehicle"
    DOCUMENT = "document"
    CRYPTO_WALLET = "crypto_wallet"
    PHONE = "phone"
    EMAIL = "email"


class Classification(StrEnum):
    """Рівень класифікації джерела даних."""
    WHITE = "WHITE"   # Публічні державні реєстри
    GREY = "GREY"     # OSINT, соціальні мережі, scraping
    BLACK = "BLACK"   # Витоки, darknet, нелегальні бази


class CollectorStatus(StrEnum):
    """Статус збирача."""
    IDLE = "idle"
    RUNNING = "running"
    SUCCESS = "success"
    ERROR = "error"
    TIMEOUT = "timeout"
    DISABLED = "disabled"


# ======================== МОДЕЛІ ========================


class DossierQuery(BaseModel):
    """Запит на збір досьє."""
    entity_type: EntityType
    identifier: str = Field(..., description="ЄДРПОУ, ІПН, ПІБ, номер авто, адреса тощо")
    # Додаткові ідентифікатори для крос-рефернсу
    name: str | None = Field(None, description="ПІБ або назва компанії")
    edrpou: str | None = Field(None, description="Код ЄДРПОУ")
    rnokpp: str | None = Field(None, description="РНОКПП (ІПН)")
    phone: str | None = Field(None, description="Номер телефону")
    email: str | None = Field(None, description="Email адреса")
    date_of_birth: str | None = Field(None, description="Дата народження (YYYY-MM-DD)")
    address: str | None = Field(None, description="Адреса")
    # Параметри збору
    classification_levels: list[Classification] = Field(
        default=[Classification.WHITE, Classification.GREY],
        description="Які рівні джерел активувати"
    )
    collectors_override: list[str] | None = Field(
        None, description="Список конкретних збирачів (якщо None — всі доступні)"
    )
    deep_scan: bool = Field(False, description="Глибоке сканування (повільніше, але більше даних)")
    tenant_id: str | None = None


class DataFragment(BaseModel):
    """Один фрагмент зібраних даних від збирача."""
    category: str = Field(..., description="Категорія: edr, court, property, sanctions, leak тощо")
    source_name: str = Field(..., description="Назва конкретного джерела")
    classification: Classification
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Впевненість у даних (0-1)")
    data: dict[str, Any] = Field(default_factory=dict)
    raw_records: list[dict[str, Any]] = Field(default_factory=list)
    # Зв'язки, виявлені у цих даних
    discovered_links: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Виявлені зв'язки: [{source_id, target_id, target_name, relation_type, risk}]"
    )
    metadata: dict[str, Any] = Field(default_factory=dict)


class CollectorResult(BaseModel):
    """Результат роботи одного збирача."""
    collector_name: str
    status: CollectorStatus
    classification: Classification
    started_at: str
    completed_at: str
    duration_ms: int
    fragments: list[DataFragment] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class CompleteDossier(BaseModel):
    """Повне зібране досьє."""
    dossier_id: str
    entity_type: EntityType
    identifier: str
    name: str | None = None
    status: str = "complete"
    # Агреговані дані по категоріях
    sections: dict[str, Any] = Field(default_factory=dict)
    # Граф зв'язків (Cytoscape-сумісний)
    graph: dict[str, Any] = Field(default_factory=dict)
    # Результати по кожному збирачу
    collector_results: list[CollectorResult] = Field(default_factory=list)
    # Зведений ризик-скор
    risk_assessment: dict[str, Any] = Field(default_factory=dict)
    # Метадані
    classification_level: str = "WHITE"
    collectors_used: int = 0
    collectors_succeeded: int = 0
    total_records_found: int = 0
    created_at: str = ""
    completed_at: str = ""
    duration_ms: int = 0


# ======================== БАЗОВИЙ КЛАС ========================


class BaseCollector(ABC):
    """Абстрактний базовий клас для всіх збирачів даних."""

    name: str = "base"
    display_name: str = "Базовий Збирач"
    classification: Classification = Classification.WHITE
    description: str = ""
    # Сутності, які цей збирач підтримує
    supported_entities: list[EntityType] = []

    def __init__(self) -> None:
        self._logger = get_logger(f"die.collectors.{self.name}")

    def supports(self, entity_type: EntityType) -> bool:
        """Чи підтримує збирач цей тип сутності."""
        if not self.supported_entities:
            return True  # Порожній список = підтримка всіх
        return entity_type in self.supported_entities

    async def execute(self, query: DossierQuery) -> CollectorResult:
        """Обгортка навколо collect() з логуванням та хронометражем."""
        started = datetime.now(UTC)
        start_ts = time.monotonic()

        self._logger.info(
            f"🔍 [{self.classification.value}] {self.display_name}: "
            f"збір для '{query.identifier}' ({query.entity_type.value})"
        )

        try:
            fragments = await self.collect(query)
            elapsed_ms = int((time.monotonic() - start_ts) * 1000)

            self._logger.info(
                f"✅ {self.display_name}: зібрано {len(fragments)} фрагментів за {elapsed_ms}ms"
            )

            return CollectorResult(
                collector_name=self.name,
                status=CollectorStatus.SUCCESS,
                classification=self.classification,
                started_at=started.isoformat(),
                completed_at=datetime.now(UTC).isoformat(),
                duration_ms=elapsed_ms,
                fragments=fragments,
            )
        except TimeoutError:
            elapsed_ms = int((time.monotonic() - start_ts) * 1000)
            self._logger.warning(f"⏱️ {self.display_name}: таймаут ({elapsed_ms}ms)")
            return CollectorResult(
                collector_name=self.name,
                status=CollectorStatus.TIMEOUT,
                classification=self.classification,
                started_at=started.isoformat(),
                completed_at=datetime.now(UTC).isoformat(),
                duration_ms=elapsed_ms,
                errors=[f"Таймаут збирача {self.name}"],
            )
        except Exception as e:
            elapsed_ms = int((time.monotonic() - start_ts) * 1000)
            self._logger.error(f"❌ {self.display_name}: помилка — {e}")
            return CollectorResult(
                collector_name=self.name,
                status=CollectorStatus.ERROR,
                classification=self.classification,
                started_at=started.isoformat(),
                completed_at=datetime.now(UTC).isoformat(),
                duration_ms=elapsed_ms,
                errors=[str(e)],
            )

    @abstractmethod
    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        """Основний метод збору даних. Реалізується кожним збирачем."""
        ...

    async def health_check(self) -> bool:
        """Перевірка доступності джерела даних."""
        return True
