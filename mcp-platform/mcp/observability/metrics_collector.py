"""Metrics Collector для збору та експорту метрик."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any


class MetricType(Enum):
    """Типи метрик."""

    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"


@dataclass
class Metric:
    """Метрика для моніторингу."""

    name: str
    type: MetricType
    value: float | dict[str, Any]
    timestamp: datetime = field(default_factory=datetime.now)
    labels: dict[str, str] = field(default_factory=dict)
    help_text: str | None = None


class MetricsError(Exception):
    """Базова помилка для Metrics Collector."""

    pass


class MetricsCollector:
    """Колекціонер метрик для моніторингу системи."""

    def __init__(self) -> None:
        """Ініціалізувати Metrics Collector."""
        self.metrics: dict[str, Metric] = {}
        self.history: list[Metric] = []

    def counter(self, name: str, value: float = 1.0, labels: dict[str, str] | None = None) -> None:
        """Збільшити лічильник.

        Args:
            name: Назва метрики
            value: Значення для додавання
            labels: Мітки метрики
        """
        labels = labels or {}
        key = self._make_key(name, labels)

        if key not in self.metrics:
            self.metrics[key] = Metric(
                name=name,
                type=MetricType.COUNTER,
                value=0.0,
                labels=labels,
            )

        current = self.metrics[key].value
        if isinstance(current, (int, float)):
            self.metrics[key].value = current + value
            self.metrics[key].timestamp = datetime.now()

    def gauge(self, name: str, value: float, labels: dict[str, str] | None = None) -> None:
        """Встановити gauge значення.

        Args:
            name: Назва метрики
            value: Значення
            labels: Мітки метрики
        """
        labels = labels or {}
        key = self._make_key(name, labels)

        self.metrics[key] = Metric(
            name=name,
            type=MetricType.GAUGE,
            value=value,
            labels=labels,
        )

    def histogram(self, name: str, value: float, labels: dict[str, str] | None = None) -> None:
        """Додати значення до гістограми.

        Args:
            name: Назва метрики
            value: Значення
            labels: Мітки метрики
        """
        labels = labels or {}
        key = self._make_key(name, labels)

        if key not in self.metrics:
            self.metrics[key] = Metric(
                name=name,
                type=MetricType.HISTOGRAM,
                value={"count": 0, "sum": 0.0, "buckets": {}},
                labels=labels,
            )

        if isinstance(self.metrics[key].value, dict):
            self.metrics[key].value["count"] += 1
            self.metrics[key].value["sum"] += value
            self.metrics[key].timestamp = datetime.now()

    def get_metric(self, name: str, labels: dict[str, str] | None = None) -> Metric:
        """Отримати метрику.

        Args:
            name: Назва метрики
            labels: Мітки метрики

        Returns:
            Метрика

        Raises:
            MetricsError: Якщо метрика не знайдена
        """
        labels = labels or {}
        key = self._make_key(name, labels)

        if key not in self.metrics:
            raise MetricsError(f"Метрика не знайдена: {key}")

        return self.metrics[key]

    def get_all_metrics(self) -> dict[str, Metric]:
        """Отримати всі метрики.

        Returns:
            Словник метрик
        """
        return self.metrics.copy()

    def export_prometheus(self) -> str:
        """Експортувати метрики у форматі Prometheus.

        Returns:
            Prometheus формат
        """
        lines = []
        for metric in self.metrics.values():
            labels_str = self._format_labels(metric.labels)
            if metric.type == MetricType.COUNTER:
                lines.append(f"{metric.name}_total{labels_str} {metric.value}")
            elif metric.type == MetricType.GAUGE:
                lines.append(f"{metric.name}{labels_str} {metric.value}")
            elif metric.type == MetricType.HISTOGRAM:
                if isinstance(metric.value, dict):
                    count = metric.value.get("count", 0)
                    total = metric.value.get("sum", 0)
                    lines.append(f"{metric.name}_count{labels_str} {count}")
                    lines.append(f"{metric.name}_sum{labels_str} {total}")

        return "\n".join(lines)

    def reset(self) -> None:
        """Скинути всі метрики."""
        self.metrics.clear()

    @staticmethod
    def _make_key(name: str, labels: dict[str, str]) -> str:
        """Створити ключ для метрики з урахуванням міток."""
        if not labels:
            return name

        labels_str = ",".join(f"{k}={v}" for k, v in sorted(labels.items()))
        return f"{name}{{{labels_str}}}"

    @staticmethod
    def _format_labels(labels: dict[str, str]) -> str:
        """Форматувати мітки для Prometheus."""
        if not labels:
            return ""

        labels_str = ",".join(f'{k}="{v}"' for k, v in sorted(labels.items()))
        return f"{{{labels_str}}}"


class Logger:
    """Простий логер для подій системи."""

    def __init__(self, name: str) -> None:
        """Ініціалізувати Logger.

        Args:
            name: Назва логера
        """
        self.name = name
        self.logs: list[dict[str, Any]] = []

    def info(self, message: str, metadata: dict[str, Any] | None = None) -> None:
        """Залогити інформаційне повідомлення.

        Args:
            message: Повідомлення
            metadata: Додаткові метадані
        """
        self.logs.append({
            "level": "INFO",
            "message": message,
            "timestamp": datetime.now(),
            "metadata": metadata or {},
        })

    def warning(self, message: str, metadata: dict[str, Any] | None = None) -> None:
        """Залогити попередження.

        Args:
            message: Повідомлення
            metadata: Додаткові метадані
        """
        self.logs.append({
            "level": "WARNING",
            "message": message,
            "timestamp": datetime.now(),
            "metadata": metadata or {},
        })

    def error(self, message: str, metadata: dict[str, Any] | None = None) -> None:
        """Залогити помилку.

        Args:
            message: Повідомлення
            metadata: Додаткові метадані
        """
        self.logs.append({
            "level": "ERROR",
            "message": message,
            "timestamp": datetime.now(),
            "metadata": metadata or {},
        })

    def critical(self, message: str, metadata: dict[str, Any] | None = None) -> None:
        """Залогити критичну помилку.

        Args:
            message: Повідомлення
            metadata: Додаткові метадані
        """
        self.logs.append({
            "level": "CRITICAL",
            "message": message,
            "timestamp": datetime.now(),
            "metadata": metadata or {},
        })

    def get_logs(self, level: str | None = None) -> list[dict[str, Any]]:
        """Отримати логи.

        Args:
            level: Фільтр за рівнем логування

        Returns:
            Список логів
        """
        if not level:
            return self.logs.copy()

        return [log for log in self.logs if log["level"] == level]

    def clear(self) -> None:
        """Очистити логи."""
        self.logs.clear()
