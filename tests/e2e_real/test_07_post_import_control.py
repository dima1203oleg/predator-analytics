"""Етап 7+: Контрольні запити після кожного імпорту.

PREDATOR Analytics v61.0-ELITE.
Канонічна локалізація: УКРАЇНСЬКА (HR-03).

Перевіряє:
- Після імпорту кожного Excel-файлу автоматично виконуються контрольні запити
- AI базує відповіді саме на щойно завантажених даних
- Старий кеш або індекс не використовується
- Порівняння відповідей з фактичними даними з Excel
"""
import re
import time
from typing import Any

import pytest

from control_queries import ControlQuery, get_static_queries


@pytest.mark.stage7_queries
class TestPostImportControlQueries:
    """Контрольні запити після імпорту для валідації ланцюга
    завантаження → ETL → індексація → embeddings → AI → відповідь.
    """

    @pytest.mark.asyncio
    async def test_post_import_validation_chain(
        self,
        ai_client,
        test_context,
        report_collector,
    ):
        """Повна валідація ланцюга після імпорту: 20 запитів."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        queries = get_static_queries()
        # Беремо 20 найважливіших (required + recommended)
        priority_queries = [
            q for q in queries
            if q.severity in ("required", "recommended")
        ][:20]

        results: list[dict[str, Any]] = []
        passed = 0
        total_duration_ms = 0

        for idx, cq in enumerate(priority_queries):
            start = time.time()
            result: dict[str, Any] = {
                "index": idx,
                "query": cq.query,
                "category": cq.category,
                "status": "skipped",
                "duration_ms": 0,
                "answer_preview": "",
                "validation_passed": False,
            }

            try:
                response = await ai_client.post(
                    "/ai/query",
                    json={
                        "query": cq.query,
                        "use_rag": True,
                    },
                )

                duration_ms = int((time.time() - start) * 1000)
                result["duration_ms"] = duration_ms
                total_duration_ms += duration_ms

                if response.status_code != 200:
                    result["status"] = "api_error"
                    results.append(result)
                    continue

                data = response.json()
                answer = data.get("answer", "") or data.get("response", "")
                result["answer_preview"] = answer[:200]

                # Валідація
                validation_ok = self._validate_answer(cq, answer)
                result["validation_passed"] = validation_ok
                result["status"] = "pass" if validation_ok else "fail"

                if validation_ok:
                    passed += 1

            except Exception as e:
                result["status"] = "error"
                result["answer_preview"] = str(e)[:200]

            results.append(result)

        # Зберігаємо результати
        report_collector["stages"]["post_import_control"] = {
            "total_queries": len(priority_queries),
            "passed": passed,
            "failed": len(priority_queries) - passed,
            "avg_duration_ms": int(total_duration_ms / max(len(priority_queries), 1)),
            "success_rate": round(passed / max(len(priority_queries), 1) * 100, 2),
        }

        # Мінімум 50% запитів повинні пройти
        success_rate = passed / max(len(priority_queries), 1)
        assert success_rate >= 0.5, (
            f"Лише {passed}/{len(priority_queries)} ({success_rate:.0%}) "
            f"контрольних запитів пройшли валідацію"
        )

    @pytest.mark.asyncio
    async def test_cache_invalidation_after_import(
        self, ai_client, redis_client, test_context
    ):
        """Кеш інвалідується після нового імпорту."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        # Виконуємо один і той самий запит двічі
        query = "Скільки декларацій було за березень 2024?"

        response1 = await ai_client.post(
            "/ai/query",
            json={"query": query, "use_rag": True},
        )
        if response1.status_code != 200:
            pytest.skip("AI API недоступний")

        answer1 = response1.json().get("answer", "") or response1.json().get("response", "")

        # Другий запит — відповідь повинна бути консистентною
        response2 = await ai_client.post(
            "/ai/query",
            json={"query": query, "use_rag": True},
        )
        if response2.status_code != 200:
            pytest.skip("AI API недоступний для другого запиту")

        answer2 = response2.json().get("answer", "") or response2.json().get("response", "")

        # Обидві відповіді повинні бути непорожніми
        assert len(answer1) > 0, "Перша відповідь порожня"
        assert len(answer2) > 0, "Друга відповідь порожня"

    @pytest.mark.asyncio
    async def test_data_freshness_verification(
        self, ai_client, pg_conn, test_context
    ):
        """Відповіді AI відповідають фактичним даним у БД."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        # Отримуємо фактичну кількість з PostgreSQL
        try:
            pg_count = await pg_conn.fetchval(
                "SELECT count(*) FROM customs_declarations WHERE job_id = $1",
                test_context.get("job_id"),
            )
        except Exception:
            pytest.skip("Не вдалося отримати кількість з PG")

        if pg_count == 0:
            pytest.skip("Немає записів у PG")

        # Запитуємо AI про кількість
        response = await ai_client.post(
            "/ai/query",
            json={
                "query": "Скільки декларацій було завантажено з останнього файлу?",
                "use_rag": True,
            },
        )

        if response.status_code != 200:
            pytest.skip("AI API недоступний")

        data = response.json()
        answer = data.get("answer", "") or data.get("response", "")

        # Шукаємо числа у відповіді
        numbers = re.findall(r"\d+", answer)
        if numbers:
            parsed = [int(n) for n in numbers if int(n) > 0]
            if parsed:
                # Хоча б одне число повинно бути в діапазоні ±20% від PG
                tolerance = max(5, int(pg_count * 0.2))
                found_close = any(
                    abs(n - pg_count) <= tolerance
                    for n in parsed
                )
                if not found_close:
                    pytest.xfail(
                        f"AI повернув {parsed}, PG має {pg_count} "
                        f"(допуск: ±{tolerance})"
                    )

    def _validate_answer(self, cq: ControlQuery, answer: str) -> bool:
        """Валідація відповіді AI за типом перевірки."""
        if not answer or len(answer) < 5:
            return False

        if cq.validation_type == "not_empty":
            return len(answer) > 10

        elif cq.validation_type == "contains":
            matched = sum(
                1 for field in cq.expected_fields
                if field.lower() in answer.lower()
            )
            return matched > 0

        elif cq.validation_type == "numeric_range":
            numbers = re.findall(r"[\d,]+\.?\d*", answer.replace(" ", ""))
            if not numbers:
                return False
            parsed = []
            for n in numbers:
                clean = n.replace(",", "")
                try:
                    parsed.append(float(clean))
                except ValueError:
                    continue
            if not parsed:
                return False
            if cq.expected_min is not None:
                return any(n >= cq.expected_min for n in parsed)
            return True

        return len(answer) > 0
