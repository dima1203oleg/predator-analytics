"""Connector Knowledge Base — PREDATOR Analytics v62.0-ELITE.

Зберігає накопичені знання про всі джерела даних:
- Версії API, шаблони пагінації, авторизації
- Час відповіді, середній розмір, надійність
- Історія деплоїв, тестів, міграцій
- Meta-Learning: кожен новий конектор покращує наступний
"""
import logging
from datetime import UTC, datetime
from typing import Any

logger = logging.getLogger(__name__)


class ConnectorKnowledgeBase:
    """
    In-memory Knowledge Base з персистентністю через PostgreSQL (майбутня міграція).

    Зберігає:
    - Профілі джерел (версія API, пагінація, auth, endpoints)
    - Статистику виконання (avg_response_ms, avg_payload_kb, error_rate)
    - Шаблони (pagination_patterns, auth_patterns)
    - Лог деплоїв та тестів
    - Self-Healing події
    """

    def __init__(self) -> None:
        # Головний реєстр: url -> SourceRecord
        self._registry: dict[str, dict[str, Any]] = {}
        # Meta-learning: загальні шаблони
        self._pagination_patterns: dict[str, int] = {}
        self._auth_patterns: dict[str, int] = {}
        logger.info("ConnectorKnowledgeBase: Ініціалізовано.")

    # ------------------------------------------------------------------
    # Реєстрація / оновлення джерела
    # ------------------------------------------------------------------

    def register_source(self, url: str, metadata: dict[str, Any]) -> None:
        """Реєстрація нового або оновлення існуючого джерела."""
        if url not in self._registry:
            self._registry[url] = {
                "url": url,
                "created_at": datetime.now(UTC).isoformat(),
                "sync_history": [],
                "deploy_history": [],
                "test_history": [],
                "healing_history": [],
                "api_versions": [],
                "pagination_pattern": None,
                "auth_type": "none",
                "endpoints": [],
                "avg_response_ms": None,
                "avg_payload_kb": None,
                "error_rate": 0.0,
                "reliability_score": 1.0,
                "last_schema_hash": None,
            }
        self._registry[url].update(metadata)
        self._registry[url]["updated_at"] = datetime.now(UTC).isoformat()

        # Meta-learning: збираємо шаблони
        if pg := metadata.get("pagination_pattern"):
            self._pagination_patterns[pg] = self._pagination_patterns.get(pg, 0) + 1
        if auth := metadata.get("auth_type"):
            self._auth_patterns[auth] = self._auth_patterns.get(auth, 0) + 1

        logger.info(f"KB: Зареєстровано/оновлено джерело {url}")

    # ------------------------------------------------------------------
    # Запис синхронізацій
    # ------------------------------------------------------------------

    def record_sync(
        self,
        url: str,
        status: str,
        rows: int = 0,
        error: str | None = None,
        response_ms: float | None = None,
        payload_kb: float | None = None,
    ) -> None:
        """Записує результати синхронізації та оновлює статистику."""
        self._ensure_exists(url)
        record = {
            "timestamp": datetime.now(UTC).isoformat(),
            "status": status,
            "rows_processed": rows,
            "error": error,
            "response_ms": response_ms,
            "payload_kb": payload_kb,
        }
        self._registry[url]["sync_history"].append(record)
        # Обмеження до 100 записів
        self._registry[url]["sync_history"] = self._registry[url]["sync_history"][-100:]
        self._registry[url]["last_sync_status"] = status
        self._registry[url]["last_sync_at"] = record["timestamp"]

        # Оновлюємо rolling averages
        if response_ms is not None:
            prev = self._registry[url].get("avg_response_ms")
            self._registry[url]["avg_response_ms"] = (
                response_ms if prev is None else round((prev * 0.8 + response_ms * 0.2), 2)
            )
        if payload_kb is not None:
            prev = self._registry[url].get("avg_payload_kb")
            self._registry[url]["avg_payload_kb"] = (
                payload_kb if prev is None else round((prev * 0.8 + payload_kb * 0.2), 2)
            )

        # Оновлюємо error rate (EWMA)
        is_error = 1.0 if status == "FAILED" else 0.0
        prev_err = self._registry[url].get("error_rate", 0.0)
        self._registry[url]["error_rate"] = round(prev_err * 0.9 + is_error * 0.1, 4)
        self._registry[url]["reliability_score"] = round(
            1.0 - self._registry[url]["error_rate"], 4
        )

        logger.debug(f"KB: Sync recorded for {url}: {status}")

    # ------------------------------------------------------------------
    # Деплой та тести
    # ------------------------------------------------------------------

    def record_deploy(self, url: str, version: str, status: str, details: str = "") -> None:
        """Фіксує деплой конектора."""
        self._ensure_exists(url)
        self._registry[url]["deploy_history"].append({
            "timestamp": datetime.now(UTC).isoformat(),
            "version": version,
            "status": status,
            "details": details,
        })
        self._registry[url]["deploy_history"] = self._registry[url]["deploy_history"][-50:]
        if version not in self._registry[url].get("api_versions", []):
            self._registry[url]["api_versions"].append(version)
        logger.info(f"KB: Деплой {version} для {url}: {status}")

    def record_test(self, url: str, test_name: str, passed: bool, details: str = "") -> None:
        """Фіксує результат тесту."""
        self._ensure_exists(url)
        self._registry[url]["test_history"].append({
            "timestamp": datetime.now(UTC).isoformat(),
            "test_name": test_name,
            "passed": passed,
            "details": details,
        })
        self._registry[url]["test_history"] = self._registry[url]["test_history"][-50:]

    def record_healing(self, url: str, trigger: str, action: str, success: bool) -> None:
        """Фіксує Self-Healing подію."""
        self._ensure_exists(url)
        self._registry[url]["healing_history"].append({
            "timestamp": datetime.now(UTC).isoformat(),
            "trigger": trigger,
            "action": action,
            "success": success,
        })
        self._registry[url]["healing_history"] = self._registry[url]["healing_history"][-30:]
        logger.info(f"KB: Self-Healing для {url}: {trigger} → {action} ({'OK' if success else 'FAIL'})")

    # ------------------------------------------------------------------
    # Читання
    # ------------------------------------------------------------------

    def get_source(self, url: str) -> dict[str, Any] | None:
        return self._registry.get(url)

    def get_all_sources(self) -> list[dict[str, Any]]:
        return list(self._registry.values())

    def get_high_priority_sources(self, threshold: float = 0.6) -> list[dict[str, Any]]:
        """Повертає джерела з priority_score вище порогу."""
        return [
            s for s in self._registry.values()
            if (s.get("priority_score") or 0.0) >= threshold
        ]

    def get_failing_sources(self, error_rate_threshold: float = 0.2) -> list[dict[str, Any]]:
        """Повертає джерела із підвищеним error rate."""
        return [
            s for s in self._registry.values()
            if (s.get("error_rate") or 0.0) >= error_rate_threshold
        ]

    def get_meta_patterns(self) -> dict[str, Any]:
        """Повертає Meta-Learning шаблони для допомоги при генерації нових конекторів."""
        total_pg = sum(self._pagination_patterns.values()) or 1
        total_auth = sum(self._auth_patterns.values()) or 1
        return {
            "most_common_pagination": max(self._pagination_patterns, key=self._pagination_patterns.get, default="offset"),
            "pagination_distribution": {
                k: round(v / total_pg, 3)
                for k, v in sorted(self._pagination_patterns.items(), key=lambda x: -x[1])
            },
            "most_common_auth": max(self._auth_patterns, key=self._auth_patterns.get, default="none"),
            "auth_distribution": {
                k: round(v / total_auth, 3)
                for k, v in sorted(self._auth_patterns.items(), key=lambda x: -x[1])
            },
            "total_sources": len(self._registry),
        }

    def get_schema_hash(self, url: str) -> str | None:
        src = self._registry.get(url)
        return src.get("last_schema_hash") if src else None

    def update_schema_hash(self, url: str, new_hash: str) -> None:
        self._ensure_exists(url)
        self._registry[url]["last_schema_hash"] = new_hash

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _ensure_exists(self, url: str) -> None:
        if url not in self._registry:
            self.register_source(url, {"auto_created": True})


# Глобальний синглтон Knowledge Base
knowledge_base = ConnectorKnowledgeBase()
