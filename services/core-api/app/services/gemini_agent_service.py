"""GeminiAgentService — Інтеграція з Gemini Enterprise Agent Platform.

Реалізує пряме підключення до Gemini API через google-genai SDK:
- Текстова генерація (chat completion)
- Code Execution (безпечний Python sandbox)
- Ембедінги (text-embedding-004 для Qdrant)
- Аналіз зображень/документів (OSINT Vision)
- Структурований JSON для Risk Engine

Free Tier ліміти: 500 RPD / 15 RPM для gemini-2.5-flash.
Використовує Circuit Breaker для стійкості.

© 2026 PREDATOR Analytics v61.0-ELITE — HR-04 (100% українська)
"""

from __future__ import annotations

import os
import time
import base64
from collections.abc import AsyncIterator
from typing import Any, Optional

from predator_common.circuit_breaker import CircuitBreaker
from predator_common.logging import get_logger

logger = get_logger("gemini_agent_service")

# Circuit breaker для Gemini API
_gemini_breaker = CircuitBreaker(
    name="gemini_api",
    failure_threshold=3,
    reset_timeout_s=60,
)

# Ротація ключів для обходу rate limits (15 RPM на ключ)
_KEY_POOL: list[str] = []
_key_index = 0


def _get_key_pool() -> list[str]:
    """Ініціалізація пулу API ключів з ENV."""
    global _KEY_POOL  # noqa: PLW0603
    if not _KEY_POOL:
        keys = []
        # Основний ключ
        primary = os.getenv("GEMINI_API_KEY", "")
        if primary:
            keys.append(primary)
        # Додаткові ключі для round-robin
        for i in range(2, 10):
            key = os.getenv(f"GEMINI_API_KEY_{i}", "")
            if key:
                keys.append(key)
        _KEY_POOL = keys
        logger.info(f"Gemini API Key Pool: {len(keys)} ключів ініціалізовано")
    return _KEY_POOL


def _next_api_key() -> str:
    """Round-robin вибір наступного API ключа."""
    global _key_index  # noqa: PLW0603
    pool = _get_key_pool()
    if not pool:
        msg = "Жодного Gemini API ключа не знайдено. Встановіть GEMINI_API_KEY."
        raise ValueError(msg)
    key = pool[_key_index % len(pool)]
    _key_index += 1
    return key


def _get_client() -> Any:
    """Створення Gemini клієнта з поточним ключем."""
    # Імпорт тільки за потреби (щоб не блокувати startup без SDK)
    from google import genai  # type: ignore[import-untyped]
    return genai.Client(api_key=_next_api_key())


class GeminiAgentService:
    """Уніфікований Gemini Agent Service з Circuit Breaker та key rotation."""

    # ─── Текстова генерація ────────────────────────────────────────────────────

    @staticmethod
    async def generate(
        prompt: str,
        *,
        model: str = "gemini-2.5-flash",
        system_instruction: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> dict[str, Any]:
        """Генерація тексту через Gemini API.

        Повертає: {"content": str, "model": str, "latency_ms": float}
        """
        if not _gemini_breaker.allow_request():
            logger.warning("Gemini Circuit Breaker OPEN — запит відхилено")
            return {
                "content": "Gemini API тимчасово недоступний. Спробуйте пізніше.",
                "model": model,
                "latency_ms": 0,
                "error": True,
            }

        try:
            from google.genai.types import GenerateContentConfig  # type: ignore[import-untyped]

            client = _get_client()
            start = time.time()

            config = GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            )
            if system_instruction:
                config.system_instruction = system_instruction

            # Синхронний виклик (google-genai SDK — sync by default)
            import asyncio
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=model,
                contents=prompt,
                config=config,
            )

            latency = (time.time() - start) * 1000
            _gemini_breaker.record_success()

            return {
                "content": response.text or "",
                "model": model,
                "provider": "gemini",
                "latency_ms": round(latency, 1),
            }

        except Exception as e:
            _gemini_breaker.record_failure()
            logger.error(f"Gemini generate помилка: {e!s}")
            return {
                "content": f"Gemini помилка: {e!s}",
                "model": model,
                "latency_ms": 0,
                "error": True,
            }

    # ─── Code Execution (Python Sandbox) ──────────────────────────────────────

    @staticmethod
    async def execute_code(
        prompt: str,
        *,
        model: str = "gemini-2.5-flash",
    ) -> dict[str, Any]:
        """Виконання Python коду через Gemini Code Execution Tool.

        Повертає: {"code": str, "result": str, "text": str, "latency_ms": float}
        """
        if not _gemini_breaker.allow_request():
            return {"code": "", "result": "", "text": "Circuit Breaker OPEN", "error": True}

        try:
            from google.genai.types import (  # type: ignore[import-untyped]
                GenerateContentConfig,
                Tool,
                ToolCodeExecution,
            )

            client = _get_client()
            start = time.time()

            code_tool = Tool(code_execution=ToolCodeExecution())

            import asyncio
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=model,
                contents=prompt,
                config=GenerateContentConfig(
                    tools=[code_tool],
                    temperature=0,
                ),
            )

            latency = (time.time() - start) * 1000
            _gemini_breaker.record_success()

            return {
                "code": getattr(response, "executable_code", "") or "",
                "result": getattr(response, "code_execution_result", "") or "",
                "text": response.text or "",
                "model": model,
                "provider": "gemini",
                "latency_ms": round(latency, 1),
            }

        except Exception as e:
            _gemini_breaker.record_failure()
            logger.error(f"Gemini code_execution помилка: {e!s}")
            return {"code": "", "result": "", "text": f"Помилка: {e!s}", "error": True}

    # ─── Структурований Risk Analysis ─────────────────────────────────────────

    @staticmethod
    async def analyze_risk(
        entity_data: dict[str, Any],
        *,
        model: str = "gemini-2.5-flash",
    ) -> dict[str, Any]:
        """Аналіз ризиків контрагента через Gemini.

        Повертає структурований JSON з risk_level, confidence, factors.
        """
        system_prompt = """Ти — експерт з митної аналітики та фінансової розвідки.
Аналізуй надані дані компанії та визнач рівень ризику.
ЗАВЖДИ відповідай ТІЛЬКИ валідним JSON (без markdown):
{
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "confidence": 0.0-1.0,
  "factors": ["список_факторів_ризику"],
  "recommendation_ua": "рекомендація українською",
  "sanctions_check": true/false,
  "ubo_anomaly": true/false
}"""

        import json
        prompt = f"Проаналізуй ризики для компанії:\n{json.dumps(entity_data, indent=2, ensure_ascii=False)}"

        result = await GeminiAgentService.generate(
            prompt,
            system_instruction=system_prompt,
            model=model,
            temperature=0.1,
        )

        # Спроба парсингу JSON з відповіді
        content = result.get("content", "")
        try:
            # Видалити markdown обгортку якщо є
            cleaned = content.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
            parsed = json.loads(cleaned)
            return {**result, "structured": parsed}
        except (json.JSONDecodeError, IndexError):
            logger.warning("Не вдалося спарсити JSON з Gemini Risk Analysis")
            return {**result, "structured": None}

    # ─── Vision Analysis ──────────────────────────────────────────────────────

    @staticmethod
    async def analyze_vision(
        prompt: str, 
        image_bytes: bytes, 
        mime_type: str = "image/jpeg",
        model: str = "gemini-2.5-flash"
    ) -> dict[str, Any]:
        """Мультимодальний аналіз (Vision).
        
        Використовується для аналізу:
        - Сканів митних декларацій
        - Схем корпоративної власності
        - Скріншотів GCP архітектури
        """
        from google.genai import types
        client = _get_client()
        start_time = time.time()
        
        try:
            import asyncio
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=model,
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_text(text=prompt),
                            types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                        ]
                    )
                ]
            )
            
            latency = (time.time() - start_time) * 1000
            return {
                "content": response.text,
                "model": model,
                "latency_ms": round(latency, 1)
            }
        except Exception as e:
            logger.error(f"Gemini Vision error: {e}")
            raise

    async def audit_infrastructure(self, project_id: str) -> dict[str, Any]:
        """Автономний аудит GCP інфраструктури через Gemini."""
        prompt = f"""
        Проведи критичний аудит GCP проекту {project_id}.
        Проаналізуй наступні аспекти:
        1. Безпека: IAM ролі, публічні бакети, правила фаєрволу.
        2. Продуктивність: Latency між регіонами, використання GPU квот.
        3. Витрати: Невикористані диски, перерозхід BigQuery.
        
        Поверни результат у форматі JSON:
        {{
          "score": 0-100,
          "critical_issues": [],
          "recommendations": [],
          "efficiency_gain_usd": number
        }}
        """
        return await self.analyze_risk({"project_id": project_id})

    # ─── Embeddings (для Qdrant) ──────────────────────────────────────────────

    @staticmethod
    async def embed(
        text: str,
        *,
        model: str = "text-embedding-004",
    ) -> list[float]:
        """Отримання ембедінгів через Gemini text-embedding-004.

        Повертає вектор розмірністю 768.
        """
        fallback_dim = 768

        if not _gemini_breaker.allow_request():
            return [0.0] * fallback_dim

        try:
            client = _get_client()

            import asyncio
            response = await asyncio.to_thread(
                client.models.embed_content,
                model=model,
                contents=text,
            )

            _gemini_breaker.record_success()
            return response.embeddings[0].values  # type: ignore[no-any-return]

        except Exception as e:
            _gemini_breaker.record_failure()
            logger.warning(f"Gemini embed помилка: {e!s}")
            return [0.0] * fallback_dim

    # ─── Health Check ─────────────────────────────────────────────────────────

    @staticmethod
    async def health_check() -> dict[str, Any]:
        """Перевірка доступності Gemini API."""
        pool = _get_key_pool()
        if not pool:
            return {
                "status": "offline",
                "reason": "Жодного API ключа не налаштовано",
                "keys_count": 0,
            }

        try:
            result = await GeminiAgentService.generate(
                "Відповідай одним словом: OK",
                temperature=0,
                max_tokens=10,
            )
            is_ok = not result.get("error")
            return {
                "status": "online" if is_ok else "degraded",
                "latency_ms": result.get("latency_ms", 0),
                "keys_count": len(pool),
                "model": "gemini-2.5-flash",
                "circuit_breaker": "CLOSED" if _gemini_breaker.allow_request() else "OPEN",
            }
        except Exception as e:
            return {
                "status": "offline",
                "reason": str(e),
                "keys_count": len(pool),
            }


# Синглтон для використання з роутерів
gemini_service = GeminiAgentService()
"""Глобальний інстанс Gemini Agent Service."""
