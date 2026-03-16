"""Базовий клас для українських реєстрів."""
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class RegistryStatus(str, Enum):
    """Статус реєстру."""
    ACTIVE = "active"
    LIMITED = "limited"  # Обмежений доступ (воєнний час)
    ARCHIVED = "archived"  # Не оновлюється
    UNAVAILABLE = "unavailable"


@dataclass
class RegistryResult:
    """Результат запиту до реєстру."""
    registry_name: str
    success: bool
    data: dict[str, Any] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    source_url: str = ""
    fetched_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    cache_hit: bool = False
    response_time_ms: float = 0.0


class BaseRegistryClient(ABC):
    """Базовий клас для клієнтів українських реєстрів.
    
    Всі реєстри мають спільні характеристики:
    - Ідентифікація за ЄДРПОУ (компанії) або РНОКПП (фізособи)
    - Можливі обмеження воєнного часу
    - Кешування результатів
    """

    name: str = "base_registry"
    description: str = ""
    holder: str = ""  # Держатель реєстру
    data_format: str = "XML"
    status: RegistryStatus = RegistryStatus.ACTIVE
    update_frequency: str = "daily"

    def __init__(self, timeout: int = 30, cache_ttl: int = 3600):
        """Ініціалізація.
        
        Args:
            timeout: Таймаут запитів (секунди)
            cache_ttl: Час життя кешу (секунди)
        """
        self.timeout = timeout
        self.cache_ttl = cache_ttl
        self._cache: dict[str, tuple[datetime, Any]] = {}

    def _get_cached(self, key: str) -> Any | None:
        """Отримати з кешу."""
        if key in self._cache:
            cached_at, data = self._cache[key]
            age = (datetime.now(UTC) - cached_at).total_seconds()
            if age < self.cache_ttl:
                return data
            del self._cache[key]
        return None

    def _set_cached(self, key: str, data: Any) -> None:
        """Зберегти в кеш."""
        self._cache[key] = (datetime.now(UTC), data)

    @abstractmethod
    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук за кодом ЄДРПОУ."""
        pass

    @abstractmethod
    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою."""
        pass

    async def is_available(self) -> bool:
        """Перевірка доступності реєстру."""
        return self.status in [RegistryStatus.ACTIVE, RegistryStatus.LIMITED]

    def validate_edrpou(self, edrpou: str) -> bool:
        """Валідація коду ЄДРПОУ (8 цифр)."""
        return edrpou.isdigit() and len(edrpou) == 8

    def validate_rnokpp(self, rnokpp: str) -> bool:
        """Валідація РНОКПП (10 цифр)."""
        return rnokpp.isdigit() and len(rnokpp) == 10

    def normalize_edrpou(self, edrpou: str) -> str:
        """Нормалізація ЄДРПОУ (додати нулі зліва)."""
        return edrpou.zfill(8)
