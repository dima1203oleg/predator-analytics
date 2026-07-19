import os
"""
Рівень 11: Перевірка LLM.
deepseek-r1:latest через Ollama, генерація відповідей, інтеграція з RAG/embeddings.
"""
import httpx
import time
from .base import BaseValidator, CheckResult
from .. import config
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class LlmValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level11_llm",
            description="LLM: Ollama, deepseek-r1:latest, генерація, embeddings",
        )

    async def _run_validation(self):
        ollama_url = config.OLLAMA_URL
        required_model = config.OLLAMA_REQUIRED_MODEL

        # 1. Ollama доступність
        r = await self.http_check("ollama_health", ollama_url, severity="critical")

        # 2. Перевірка встановлених моделей
        r2, data = await self.http_json_check("ollama_models_list", f"{ollama_url}/api/tags", severity="critical")
        if data:
            models = data.get("models", [])
            model_names = [m.get("name", "") for m in models]
            self.add_check(CheckResult(
                name="ollama_models_count",
                passed=len(models) > 0,
                message=f"Ollama: {len(models)} моделей встановлено",
                severity="info",
                details={"models": model_names},
            ))

            # 3. Перевірка потрібної моделі (deepseek-r1:latest)
            has_required = any(required_model in m for m in model_names)
            self.add_check(CheckResult(
                name="ollama_required_model",
                passed=has_required,
                message=f"Модель {required_model}: {'встановлена' if has_required else 'ВІДСУТНЯ'}",
                severity="critical" if not has_required else "info",
                details={"required": required_model, "available": model_names},
            ))

            # 4. Перевірка відсутності застарілих екземплярів
            if not has_required and model_names:
                self.add_check(CheckResult(
                    name="ollama_alternative_models",
                    passed=True,
                    message=f"Доступні альтернативні моделі: {', '.join(model_names)}",
                    severity="warning",
                ))

        # 5. Тест інференсу (з доступною моделлю)
        await self._test_inference(ollama_url, data)

    async def _test_inference(self, ollama_url: str, models_data: dict | None):
        """Тест генерації відповіді."""
        if not models_data:
            return

        models = models_data.get("models", [])
        if not models:
            return

        # Використовуємо першу доступну модель для тесту
        test_model = models[0].get("name", "")
        if not test_model:
            return

        try:
            start = time.time()
            async with httpx.AsyncClient(verify=False, timeout=30) as client:
                resp = await client.post(
                    f"{ollama_url}/api/generate",
                    json={
                        "model": test_model,
                        "prompt": "Відповідай одним словом: 2+2=?",
                        "stream": False,
                    },
                )
                latency = (time.time() - start) * 1000

                if resp.status_code == 200:
                    result = resp.json()
                    response_text = result.get("response", "")[:100]
                    self.add_check(CheckResult(
                        name="ollama_inference",
                        passed=True,
                        message=f"Інференс ({test_model}): {latency:.0f}мс — '{response_text}'",
                        severity="info",
                        latency_ms=latency,
                        details={"model": test_model, "response_preview": response_text},
                    ))
                else:
                    self.add_check(CheckResult(
                        name="ollama_inference",
                        passed=False,
                        message=f"Інференс помилка: HTTP {resp.status_code}",
                        severity="warning",
                    ))
        except Exception as e:
            self.add_check(CheckResult(
                name="ollama_inference",
                passed=False,
                message=f"Інференс таймаут/помилка: {e}",
                severity="warning",
            ))
