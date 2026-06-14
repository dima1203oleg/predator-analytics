"""LLM-based генератор для синтетичних даних."""

import asyncio
import json
from typing import Any

import httpx
import pandas as pd
from services.synthetic_data_engine.app.generators.base import BaseSyntheticGenerator
import structlog

from app.config import config as engine_config

logger = structlog.get_logger("sde.generators.llm")

class LLMSyntheticGenerator(BaseSyntheticGenerator):
    """Генератор синтетичних даних на основі LLM (через AIService)."""

    def __init__(self, config: dict[str, Any] = None):
        super().__init__(config)
        self.domain_context = self.config.get("domain_context", "")
        self.few_shot_examples = []
        self.schema = {}

    def fit(self, data: pd.DataFrame, metadata: dict[str, Any] | None = None) -> None:
        """Для LLM 'навчання' - це вилучення few-shot прикладів та формування схеми."""
        logger.info("Формування контексту для LLM генератора")

        # 1. Формуємо схему
        self.schema = {col: str(dtype) for col, dtype in data.dtypes.items()}

        # 2. Беремо 3-5 прикладів для few-shot
        num_examples = min(5, len(data))
        examples_df = data.sample(num_examples)
        self.few_shot_examples = examples_df.to_dict(orient="records")

        self.is_fitted = True

    async def _generate_batch_async(self, batch_size: int, template_prompt: str) -> list[dict]:
        """Асинхронна генерація одного батчу."""
        prompt = f"{template_prompt}\nGenerate {batch_size} rows."
        logger.debug(f"Звернення до LLM для батчу ({batch_size} рядків)")

        messages = [{"role": "user", "content": prompt}]

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{engine_config.LITELLM_API_BASE}/chat/completions",
                    json={
                        "model": engine_config.LLM_MODEL,
                        "messages": messages,
                        "temperature": engine_config.LLM_TEMPERATURE,
                        "response_format": { "type": "json_object" }
                    },
                    timeout=120.0
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]

                # Парсимо JSON (LLM має повернути об'єкт з ключем data або просто масив)
                parsed = json.loads(content)
                if isinstance(parsed, dict) and "data" in parsed:
                    return parsed["data"]
                elif isinstance(parsed, list):
                    return parsed
                else:
                    logger.warning("Неочікуваний формат від LLM", content=content)
                    return []
            except Exception as e:
                logger.error(f"LLM Error: {e}")
                # Fallback для тестування у разі помилки
                return self._mock_generate(batch_size)

    def _mock_generate(self, batch_size: int) -> list[dict]:
        from faker import Faker
        fake = Faker('uk_UA')
        batch = []
        for _ in range(batch_size):
            row = {}
            for col, dtype in self.schema.items():
                if "int" in dtype:
                    row[col] = fake.random_int(min=1, max=1000)
                elif "float" in dtype:
                    row[col] = fake.pyfloat(min_value=0.0, max_value=1000.0)
                else:
                    row[col] = fake.word()
            batch.append(row)
        return batch

    def sample(self, num_rows: int) -> pd.DataFrame:
        """Генерація через asyncio."""
        if not self.is_fitted:
            raise RuntimeError("LLM Генератор потребує схеми. Викличте fit() або задайте схему.")

        logger.info(f"LLM Генерація {num_rows} записів")

        batch_size = self.config.get("llm_batch_size", 10)
        num_batches = (num_rows + batch_size - 1) // batch_size

        prompt = self._build_prompt()

        # Використовуємо існуючий event loop якщо є, інакше створюємо новий
        try:
            _ = asyncio.get_running_loop()
            # Якщо ми вже в async контексті, ми маємо використовувати async версію
            # Це обгортка для сумісності з синхронним інтерфейсом
            raise RuntimeError("LLM generator is async, must be called with await sample_async()")
        except RuntimeError:
            # Немає loop
            results = asyncio.run(self._run_all_batches(num_batches, batch_size, prompt))

        # Обрізаємо до точної кількості
        all_data = []
        for batch in results:
            all_data.extend(batch)

        return pd.DataFrame(all_data[:num_rows])

    async def sample_async(self, num_rows: int) -> pd.DataFrame:
        """Асинхронна версія генерації."""
        batch_size = self.config.get("llm_batch_size", 10)
        num_batches = (num_rows + batch_size - 1) // batch_size
        prompt = self._build_prompt()

        results = await self._run_all_batches(num_batches, batch_size, prompt)

        all_data = []
        for batch in results:
            all_data.extend(batch)

        return pd.DataFrame(all_data[:num_rows])

    async def _run_all_batches(self, num_batches: int, batch_size: int, prompt: str) -> list[list[dict]]:
        tasks = [self._generate_batch_async(batch_size, prompt) for _ in range(num_batches)]
        return await asyncio.gather(*tasks)

    def _build_prompt(self) -> str:
        """Формування промпта для генерації."""
        prompt = f"Згенеруй синтетичні дані.\nДомен: {self.domain_context}\n"
        prompt += f"Схема (JSON): {json.dumps(self.schema)}\n"

        if self.few_shot_examples:
            prompt += f"Приклади (Reference data): {json.dumps(self.few_shot_examples, ensure_ascii=False)}\n"

        prompt += "Поверни ТІЛЬКИ валідний JSON об'єкт з ключем 'data', що містить масив об'єктів. Жодних пояснень. JSON object MUST contain 'data' array."
        return prompt
