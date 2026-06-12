"""
Шар тестування штучного інтелекту (AI Layer) UTOS v61.0-ELITE.
Тестує підключення до Ollama та LiteLLM, перевіряє наявність потрібних моделей,
а також виконує швидкий тест генерації (Inference Latency & Quality check).
"""
import time
import logging
from typing import Dict, Any

import httpx
from utos.config import OLLAMA_URL, OLLAMA_REQUIRED_MODEL, OLLAMA_INFERENCE_TIMEOUT, LITELLM_URL
from utos.layers import BaseLayer, CheckResult

logger = logging.getLogger(__name__)


class AiLayer(BaseLayer):
    """Шар валідації AI/LLM інфраструктури та інференсу."""

    def __init__(self):
        super().__init__(
            name="ai",
            description="Тестування Ollama, LiteLLM, наявності моделей та швидкості генерації",
            weight=0.15,
        )

    async def _run_validation(self) -> None:
        # 1. Перевірка LiteLLM
        litellm_ok = await self._validate_litellm()

        # 2. Перевірка Ollama
        ollama_ok = await self._validate_ollama_models()

        # 3. Швидкий тест інференсу моделі (якщо Ollama доступний)
        if ollama_ok:
            await self._run_inference_benchmark()

    async def _validate_litellm(self) -> bool:
        """Перевірка статусу проксі LiteLLM."""
        start = time.time()
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                # LiteLLM зазвичай має ендпоінт /health або /models
                resp = await client.get(f"{LITELLM_URL.rstrip('/')}/v1/models")
                latency = (time.time() - start) * 1000
                if resp.status_code == 200:
                    self.add_check(CheckResult(
                        name="litellm_models_api",
                        passed=True,
                        message=f"LiteLLM API доступний ({latency:.0f}мс)",
                        latency_ms=latency,
                    ))
                    return True
                else:
                    raise ValueError(f"HTTP {resp.status_code}")
        except Exception as e:
            self.add_check(CheckResult(
                name="litellm_models_api",
                passed=False,
                message=f"LiteLLM не працює або недоступний: {e}",
                severity="warning",
            ))
            return False

    async def _validate_ollama_models(self) -> bool:
        """Перевірка списку завантажених моделей у локальному Ollama."""
        start = time.time()
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{OLLAMA_URL.rstrip('/')}/api/tags")
                latency = (time.time() - start) * 1000
                if resp.status_code != 200:
                    raise ValueError(f"HTTP {resp.status_code}")
                
                data = resp.json()
                models = [m["name"] for m in data.get("models", [])]
                
                # Перевіряємо чи є потрібна модель
                required = OLLAMA_REQUIRED_MODEL
                has_model = any(required in m for m in models)

                self.add_check(CheckResult(
                    name="ollama_api",
                    passed=True,
                    message=f"Ollama версія API доступна ({latency:.0f}мс)",
                    latency_ms=latency,
                    details={"models_loaded": models}
                ))

                self.add_check(CheckResult(
                    name="ollama_model_presence",
                    passed=has_model,
                    message=f"Модель '{required}' знайдена локально" if has_model 
                            else f"Модель '{required}' відсутня в Ollama (знайдено: {models})",
                    severity="warning"
                ))
                return True
        except Exception as e:
            self.add_check(CheckResult(
                name="ollama_api",
                passed=False,
                message=f"Ollama недоступний: {e}",
                severity="warning"
            ))
            return False

    async def _run_inference_benchmark(self) -> None:
        """Тест генерації тексту для виміру затримки."""
        start = time.time()
        try:
            async with httpx.AsyncClient(timeout=OLLAMA_INFERENCE_TIMEOUT) as client:
                prompt_data = {
                    "model": OLLAMA_REQUIRED_MODEL,
                    "prompt": "Привіт, скажи 'PREDATOR'",
                    "stream": False,
                    "options": {
                        "num_predict": 10
                    }
                }
                resp = await client.post(
                    f"{OLLAMA_URL.rstrip('/')}/api/generate",
                    json=prompt_data
                )
                latency = (time.time() - start) * 1000
                
                if resp.status_code == 200:
                    resp_json = resp.json()
                    response_text = resp_json.get("response", "").strip()
                    passed = "PREDATOR" in response_text.upper()
                    
                    self.add_check(CheckResult(
                        name="llm_inference_latency",
                        passed=passed,
                        message=f"Генерація успішна за {latency/1000:.2f}с, відповідь: '{response_text}'",
                        latency_ms=latency,
                        details={"response": response_text}
                    ))
                else:
                    raise ValueError(f"HTTP {resp.status_code}: {resp.text}")
        except Exception as e:
            self.add_check(CheckResult(
                name="llm_inference_latency",
                passed=False,
                message=f"Помилка інференсу моделі: {e}",
                severity="warning"
            ))
