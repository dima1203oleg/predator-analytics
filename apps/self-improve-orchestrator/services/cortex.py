"""Cortex Orchestrator — PREDATOR Analytics v56.5-ELITE
AI-бекенд + системний моніторинг для Telegram мініпульта.
"""
import asyncio
import json
import logging
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx

logger = logging.getLogger("predator_cortex")

# ═══════════════════════════════════════════════════════════════════════════
# КОНФІГУРАЦІЯ
# ═══════════════════════════════════════════════════════════════════════════

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://predator_ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:latest-optimized")
OLLAMA_TIMEOUT = 120.0
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/1")

# Стартовий час для аптайму
_BOOT_TIME = time.monotonic()


class CortexOrchestrator:
    """Реальний AI-оркестратор + системний монітор."""

    def __init__(self) -> None:
        self.tasks: dict[str, dict[str, Any]] = {}
        self._http: httpx.AsyncClient | None = None
        self.active_model: str = OLLAMA_MODEL
        self._request_count: int = 0
        self._error_count: int = 0

    @property
    def http(self) -> httpx.AsyncClient:
        if self._http is None or self._http.is_closed:
            self._http = httpx.AsyncClient(timeout=OLLAMA_TIMEOUT)
        return self._http

    # ───────────────────────────────────────────────────────────────────
    # AI API
    # ───────────────────────────────────────────────────────────────────

    async def ask_ai(self, prompt: str, system: str = "", model: str = "") -> str:
        """Прямий запит до Ollama LLM."""
        self._request_count += 1
        use_model = model or self.active_model
        if not system:
            system = (
                "Ти — PREDATOR Analytics, українська OSINT-платформа для митної аналітики. "
                "Відповідай ВИКЛЮЧНО українською мовою. Будь лаконічним та корисним. "
                "Використовуй емодзі для структурування відповідей."
            )
        try:
            resp = await self.http.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": use_model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                    "stream": False,
                    "options": {"temperature": 0.7, "num_predict": 1024},
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data.get("message", {}).get("content", "")
            if not content:
                return "⚠️ Модель не повернула відповідь."
            return content.strip()
        except httpx.TimeoutException:
            self._error_count += 1
            logger.error("Ollama timeout")
            return "⏱ Таймаут. Спробуйте коротший запит або іншу модель."
        except httpx.ConnectError:
            self._error_count += 1
            logger.error("Ollama connection refused")
            return "🔌 Ollama недоступний. Перевірте контейнер."
        except Exception as e:
            self._error_count += 1
            logger.exception("Ollama error")
            return f"❌ Помилка LLM: {e}"

    async def search(self, query: str) -> str:
        system = (
            "Ти — пошуковий агент PREDATOR. Проаналізуй запит та надай "
            "структуровану відповідь по митній аналітиці. Українською."
        )
        return await self.ask_ai(f"Пошуковий запит: {query}", system)

    async def osint(self, query: str) -> str:
        system = (
            "Ти — OSINT-аналітик PREDATOR. Структура: "
            "1) Ключові факти 2) Зв'язки 3) Ризики 4) Рекомендації. Українською."
        )
        return await self.ask_ai(f"OSINT запит: {query}", system)

    async def analyze_risk(self, query: str) -> str:
        system = (
            "Ти — Risk Engine PREDATOR. Оціни ризики по шкалі 0-100. "
            "Структура: Рівень ризику, Фактори, Індикатори, Рекомендації. Українською."
        )
        return await self.ask_ai(f"Аналіз ризику: {query}", system)

    async def generate_report(self) -> str:
        system = (
            "Ти — системний аналітик PREDATOR. Згенеруй короткий звіт. Українською."
        )
        return await self.ask_ai(
            "Згенеруй статусний звіт: стан модулів, готовність, рекомендації.", system
        )

    # ───────────────────────────────────────────────────────────────────
    # МОДЕЛЬНИЙ МЕНЕДЖЕР
    # ───────────────────────────────────────────────────────────────────

    async def list_models(self) -> list[dict[str, str]]:
        """Список доступних моделей Ollama."""
        try:
            resp = await self.http.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5.0)
            resp.raise_for_status()
            models = resp.json().get("models", [])
            result = []
            for m in models:
                name = m.get("name", "?")
                size = m.get("details", {}).get("parameter_size", "?")
                result.append({"name": name, "size": size})
            return result
        except Exception as e:
            logger.error(f"Помилка отримання моделей: {e}")
            return []

    def set_model(self, model_name: str) -> None:
        """Переключити активну модель."""
        self.active_model = model_name
        logger.info(f"🔄 Активна модель: {model_name}")

    # ───────────────────────────────────────────────────────────────────
    # СИСТЕМНИЙ МОНІТОРИНГ
    # ───────────────────────────────────────────────────────────────────

    async def get_dashboard(self) -> str:
        """Швидкий дашборд — головний екран мініпульта."""
        uptime_sec = int(time.monotonic() - _BOOT_TIME)
        hours, remainder = divmod(uptime_sec, 3600)
        minutes, seconds = divmod(remainder, 60)

        # Перевірка Ollama
        ollama_ok = False
        model_count = 0
        try:
            resp = await self.http.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=3.0)
            model_count = len(resp.json().get("models", []))
            ollama_ok = True
        except Exception:
            pass

        # Перевірка Redis
        redis_ok = False
        try:
            import redis as redis_lib  # type: ignore[import-untyped]
            r = redis_lib.from_url(REDIS_URL, socket_timeout=2)
            r.ping()
            redis_ok = True
        except Exception:
            pass

        now = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")

        return (
            "🦅 *PREDATOR MINI-ПУЛЬТ*\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"⏱ *Аптайм:* `{hours}г {minutes}хв {seconds}с`\n"
            f"🕐 *Час:* `{now}`\n\n"
            "📡 *Сервіси:*\n"
            f"  {'🟢' if ollama_ok else '🔴'} Ollama — {model_count} моделей\n"
            f"  {'🟢' if redis_ok else '🔴'} Redis\n\n"
            f"🤖 *Модель:* `{self.active_model}`\n"
            f"📊 *Запитів:* {self._request_count} | "
            f"❌ *Помилок:* {self._error_count}\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━"
        )

    async def get_system_status(self) -> str:
        """Детальний статус всіх сервісів."""
        lines: list[str] = ["📊 *СТАТУС СИСТЕМИ PREDATOR*\n━━━━━━━━━━━━━━━━━━━━━\n"]

        # Ollama
        try:
            resp = await self.http.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5.0)
            models = resp.json().get("models", [])
            lines.append(f"🟢 *Ollama:* Активний ({len(models)} моделей)")
            for m in models[:8]:
                name = m["name"]
                size = m.get("details", {}).get("parameter_size", "?")
                marker = "▸" if name == self.active_model else "  "
                lines.append(f"   {marker} `{name}` ({size})")
        except Exception:
            lines.append("🔴 *Ollama:* Недоступний")

        # Redis
        try:
            import redis as redis_lib  # type: ignore[import-untyped]
            r = redis_lib.from_url(REDIS_URL, socket_timeout=2)
            info = r.info("memory")
            mem = info.get("used_memory_human", "?")
            lines.append(f"\n🟢 *Redis:* Активний (RAM: {mem})")
        except Exception:
            lines.append("\n🔴 *Redis:* Недоступний")

        lines.append(f"\n🤖 *Активна модель:* `{self.active_model}`")
        lines.append(f"📈 *Запитів оброблено:* {self._request_count}")

        return "\n".join(lines)

    async def get_docker_status(self) -> str:
        """Статус Docker контейнерів (виконується на хості)."""
        # Ми всередині контейнера, тому перевіряємо сусідів через мережу
        services = {
            "predator_ollama": ("Ollama LLM", f"{OLLAMA_BASE_URL}/api/tags"),
            "redis": ("Redis Cache", None),
        }
        lines = ["🐳 *DOCKER КОНТЕЙНЕРИ*\n━━━━━━━━━━━━━━━━━━━━━\n"]

        for svc, (desc, url) in services.items():
            if url:
                try:
                    resp = await self.http.get(url, timeout=3.0)
                    lines.append(f"🟢 *{desc}* ({svc})")
                except Exception:
                    lines.append(f"🔴 *{desc}* ({svc})")
            elif svc == "redis":
                try:
                    import redis as redis_lib  # type: ignore[import-untyped]
                    r = redis_lib.from_url(REDIS_URL, socket_timeout=2)
                    r.ping()
                    lines.append(f"🟢 *{desc}* ({svc})")
                except Exception:
                    lines.append(f"🔴 *{desc}* ({svc})")

        lines.append(f"\n🟢 *Telegram Bot* (self) — Активний")
        return "\n".join(lines)

    # ───────────────────────────────────────────────────────────────────
    # TASK API
    # ───────────────────────────────────────────────────────────────────

    async def submit_task(self, user_id: int, text: str, source: str = "text") -> str:
        task_id = str(uuid.uuid4())[:8]
        self.tasks[task_id] = {
            "id": task_id, "user_id": user_id, "text": text,
            "source": source, "status": "processing", "result": "",
        }
        asyncio.create_task(self._process_task(task_id))
        return task_id

    async def _process_task(self, task_id: str) -> None:
        task = self.tasks.get(task_id)
        if not task:
            return
        try:
            result = await self.ask_ai(task["text"])
            task["status"] = "completed"
            task["result"] = result
        except Exception as e:
            task["status"] = "failed"
            task["result"] = f"Помилка: {e}"

    def get_task_status(self, task_id: str) -> dict[str, Any] | None:
        return self.tasks.get(task_id)
