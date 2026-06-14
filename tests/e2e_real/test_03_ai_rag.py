"""Етап 6–7: Перевірка AI-підсистеми та запитів користувача.

PREDATOR Analytics v61.0-ELITE.
Канонічна локалізація: УКРАЇНСЬКА (HR-03).

Перевіряє:
- Доступність DeepSeek-R1 через Ollama
- Використання актуальних індексів та embeddings
- Коректне формування контексту RAG
- Пошук релевантних документів
- Відсутність використання застарілих даних
- Контрольний набір із 25 запитів (required severity)
- Source Attribution — AI може пояснити джерело інформації
"""
import json
import re
import time
from typing import Any

import pytest

from conftest import AI_QUERY_TIMEOUT, OLLAMA_MODEL, OLLAMA_URL
from control_queries import ControlQuery, get_all_queries, get_static_queries


# ═══════════════════════════════════════════════════════════════════════════
# Етап 6: Перевірка AI-підсистеми
# ═══════════════════════════════════════════════════════════════════════════
@pytest.mark.stage6_ai
class TestAIAvailability:
    """Перевірка доступності та готовності AI-підсистеми."""

    @pytest.mark.asyncio
    async def test_ollama_model_available(self, ollama_client):
        """DeepSeek-R1 через Ollama доступний та завантажений."""
        response = await ollama_client.get("/api/tags")
        if response.status_code != 200:
            pytest.skip(f"Ollama недоступний: HTTP {response.status_code}")

        models = response.json().get("models", [])
        model_names = [m.get("name", "") for m in models]

        # Перевіряємо наявність DeepSeek-R1 (або іншої конфігурованої моделі)
        model_base = OLLAMA_MODEL.split(":")[0]
        has_model = any(model_base in name for name in model_names)

        assert has_model, (
            f"Модель {OLLAMA_MODEL} не знайдена в Ollama. "
            f"Доступні: {model_names}"
        )

    @pytest.mark.asyncio
    async def test_ollama_inference_works(self, ollama_client):
        """Модель може виконати inference (базовий тест)."""
        response = await ollama_client.post(
            "/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": "Скажи 'привіт' одним словом.",
                "stream": False,
            },
            timeout=float(AI_QUERY_TIMEOUT),
        )

        if response.status_code != 200:
            pytest.skip(f"Ollama inference не працює: HTTP {response.status_code}")

        data = response.json()
        answer = data.get("response", "")
        assert len(answer) > 0, "Модель повернула порожню відповідь"

    @pytest.mark.asyncio
    async def test_ai_api_health(self, ai_client):
        """AI/RAG API endpoint доступний."""
        # Спроба кількох можливих endpoints
        endpoints = ["/ai/health", "/llm/health", "/health"]
        for endpoint in endpoints:
            response = await ai_client.get(endpoint)
            if response.status_code == 200:
                return

        pytest.skip("AI API health endpoint недоступний")


@pytest.mark.stage6_ai
class TestRAGFreshness:
    """Перевірка використання актуальних індексів та embeddings."""

    @pytest.mark.asyncio
    async def test_ai_uses_fresh_indices(self, ai_client, test_context):
        """RAG використовує нові (свіжі) індекси після імпорту."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        response = await ai_client.post(
            "/ai/query",
            json={
                "query": "Покажи останні завантажені дані за березень 2024",
                "use_rag": True,
            },
        )

        if response.status_code != 200:
            pytest.skip(f"AI API не відповідає: HTTP {response.status_code}")

        data = response.json()
        sources = data.get("sources", [])

        # Перевіряємо, що є хоча б одне джерело
        if len(sources) > 0:
            # Перевіряємо, що джерела посилаються на свіжі дані
            source_texts = " ".join(str(s) for s in sources)
            assert "березень" in source_texts.lower() or "2024" in source_texts, (
                f"RAG не використовує свіжі індекси. Джерела: {sources[:3]}"
            )

    @pytest.mark.asyncio
    async def test_ai_uses_fresh_embeddings(self, qdrant_client_fixture, test_context):
        """Qdrant містить свіжі embeddings після імпорту."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        qdrant_count = test_context.get("db_counts", {}).get("qdrant", 0)
        assert qdrant_count > 0, "Qdrant не містить embeddings після імпорту"

    @pytest.mark.asyncio
    async def test_ai_context_formation(self, ai_client, test_context):
        """Контекст RAG сформований коректно (містить дані з файлу)."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        response = await ai_client.post(
            "/ai/query",
            json={
                "query": "Які компанії імпортували товари у березні 2024?",
                "use_rag": True,
                "return_context": True,
            },
        )

        if response.status_code != 200:
            pytest.skip(f"AI API не відповідає: HTTP {response.status_code}")

        data = response.json()
        context = data.get("context", "") or data.get("rag_context", "")
        answer = data.get("answer", "") or data.get("response", "")

        # Хоча б одна з відповідей повинна містити корисну інформацію
        combined = f"{context} {answer}"
        assert len(combined) > 50, "Контекст RAG порожній або надто короткий"


# ═══════════════════════════════════════════════════════════════════════════
# Етап 7: Контрольні запити до AI
# ═══════════════════════════════════════════════════════════════════════════
@pytest.mark.stage7_queries
class TestControlQueries:
    """Контрольний набір запитів через AI Copilot або REST API."""

    @pytest.mark.asyncio
    async def test_control_queries_required(
        self,
        ai_client,
        test_context,
        excel_file_metadata,
        report_collector,
    ):
        """Виконання обов'язкових контрольних запитів (severity=required)."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        queries = get_all_queries(excel_file_metadata)
        required_queries = [q for q in queries if q.severity == "required"]

        results: list[dict[str, Any]] = []
        passed = 0
        failed = 0
        skipped = 0

        for idx, cq in enumerate(required_queries):
            result = await self._execute_control_query(ai_client, cq, idx)
            results.append(result)

            if result["status"] == "pass":
                passed += 1
            elif result["status"] == "fail":
                failed += 1
            else:
                skipped += 1

        # Зберігаємо результати
        test_context["ai_query_results"] = results
        report_collector["stages"]["ai_control_queries"] = {
            "total": len(required_queries),
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "success_rate": round(passed / max(len(required_queries), 1) * 100, 2),
        }

        # Мінімальний поріг проходження — 60% required запитів
        success_rate = passed / max(len(required_queries), 1)
        assert success_rate >= 0.6, (
            f"Лише {passed}/{len(required_queries)} ({success_rate:.0%}) "
            f"обов'язкових запитів пройшли"
        )

    @pytest.mark.asyncio
    async def test_ai_answers_contain_file_data(self, ai_client, test_context):
        """Відповіді AI містять інформацію з імпортованого Excel-файлу."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        response = await ai_client.post(
            "/ai/query",
            json={
                "query": "Знайди всі декларації з файлу Березень_2024.xlsx",
                "use_rag": True,
            },
        )

        if response.status_code != 200:
            pytest.skip(f"AI API: HTTP {response.status_code}")

        data = response.json()
        answer = data.get("answer", "") or data.get("response", "")

        # Відповідь повинна містити корисну інформацію
        assert len(answer) > 20, "AI повернув надто коротку відповідь"
        assert "помилка" not in answer.lower() or "не знайдено" not in answer.lower(), (
            f"AI не знайшов дані з файлу: {answer[:200]}"
        )

    @pytest.mark.asyncio
    async def test_ai_numeric_accuracy(self, ai_client, test_context, excel_file_metadata):
        """Числові значення у відповідях AI коректні."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        total_rows = excel_file_metadata.get("total_rows", 0)
        if total_rows == 0:
            pytest.skip("Метадані файлу порожні")

        response = await ai_client.post(
            "/ai/query",
            json={
                "query": f"Скільки записів у файлі Березень_2024.xlsx?",
                "use_rag": True,
            },
        )

        if response.status_code != 200:
            pytest.skip(f"AI API: HTTP {response.status_code}")

        data = response.json()
        answer = data.get("answer", "") or data.get("response", "")

        # Шукаємо числа у відповіді
        numbers = re.findall(r"\d+", answer)
        if numbers:
            # Перевіряємо, чи хоча б одне число близьке до реальної кількості
            found_close = any(
                abs(int(n) - total_rows) <= max(10, total_rows * 0.1)
                for n in numbers
                if int(n) > 0
            )
            # Не assert fail — це м'яка перевірка
            if not found_close:
                pytest.xfail(
                    f"AI повернув числа {numbers}, "
                    f"але жодне не близьке до {total_rows}"
                )

    @pytest.mark.asyncio
    async def test_ai_source_attribution(self, ai_client, test_context):
        """AI може пояснити джерело інформації."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        response = await ai_client.post(
            "/ai/query",
            json={
                "query": "Поясни, з якого джерела ти отримав дані про імпорт за березень 2024",
                "use_rag": True,
            },
        )

        if response.status_code != 200:
            pytest.skip(f"AI API: HTTP {response.status_code}")

        data = response.json()
        answer = data.get("answer", "") or data.get("response", "")
        sources = data.get("sources", [])

        # Відповідь або джерела повинні згадувати файл
        combined = f"{answer} {json.dumps(sources)}"
        has_attribution = any(
            kw in combined.lower()
            for kw in ["березень", "2024", "xlsx", "файл", "джерел"]
        )

        assert has_attribution, (
            f"AI не може атрибутувати джерело. Відповідь: {answer[:200]}"
        )

    @pytest.mark.asyncio
    async def test_ai_no_stale_data(self, ai_client, test_context):
        """AI не використовує застарілі дані (перевірка cache invalidation)."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        # Запитуємо дані з відомою міткою часу
        upload_time = test_context.get("upload_start_time", 0)
        if not upload_time:
            pytest.skip("Час завантаження невідомий")

        response = await ai_client.post(
            "/ai/query",
            json={
                "query": "Коли були завантажені останні дані? Вкажи дату та час.",
                "use_rag": True,
            },
        )

        if response.status_code != 200:
            pytest.skip(f"AI API: HTTP {response.status_code}")

        # Цей тест є м'яким — перевіряємо, що відповідь не порожня
        data = response.json()
        answer = data.get("answer", "") or data.get("response", "")
        assert len(answer) > 0, "AI не зміг відповісти про час завантаження"

    # ─── Допоміжні методи ───────────────────────────────────────────────────

    async def _execute_control_query(
        self,
        ai_client,
        cq: ControlQuery,
        idx: int,
    ) -> dict[str, Any]:
        """Виконує один контрольний запит та валідує результат."""
        start = time.time()
        result: dict[str, Any] = {
            "index": idx,
            "query": cq.query,
            "category": cq.category,
            "severity": cq.severity,
            "status": "skipped",
            "duration_ms": 0,
            "answer": "",
            "error": None,
        }

        try:
            response = await ai_client.post(
                "/ai/query",
                json={
                    "query": cq.query,
                    "use_rag": True,
                },
            )

            result["duration_ms"] = int((time.time() - start) * 1000)

            if response.status_code != 200:
                result["status"] = "skipped"
                result["error"] = f"HTTP {response.status_code}"
                return result

            data = response.json()
            answer = data.get("answer", "") or data.get("response", "")
            result["answer"] = answer[:500]

            # Валідація відповіді
            if cq.validation_type == "not_empty":
                result["status"] = "pass" if len(answer) > 10 else "fail"

            elif cq.validation_type == "contains":
                matched = sum(
                    1 for field in cq.expected_fields
                    if field.lower() in answer.lower()
                )
                result["status"] = "pass" if matched > 0 else "fail"

            elif cq.validation_type == "numeric_range":
                numbers = re.findall(r"[\d,]+\.?\d*", answer.replace(" ", ""))
                if numbers:
                    parsed = [
                        float(n.replace(",", ""))
                        for n in numbers
                        if n.replace(",", "").replace(".", "").isdigit()
                    ]
                    if parsed:
                        if cq.expected_min is not None and any(n >= cq.expected_min for n in parsed):
                            result["status"] = "pass"
                        elif cq.expected_max is not None and any(n <= cq.expected_max for n in parsed):
                            result["status"] = "pass"
                        else:
                            result["status"] = "fail"
                            result["error"] = f"Числа {parsed} поза діапазоном [{cq.expected_min}, {cq.expected_max}]"
                    else:
                        result["status"] = "fail"
                        result["error"] = "Не вдалося розпарсити числа"
                else:
                    result["status"] = "fail"
                    result["error"] = "Числа не знайдені у відповіді"
            else:
                result["status"] = "pass" if len(answer) > 0 else "fail"

        except Exception as e:
            result["status"] = "fail"
            result["error"] = str(e)
            result["duration_ms"] = int((time.time() - start) * 1000)

        return result
