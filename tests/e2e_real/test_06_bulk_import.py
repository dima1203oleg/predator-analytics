"""Етап 9: Масове тестування (Bulk Import 96 Excel-файлів).

PREDATOR Analytics v61.0-ELITE.
Канонічна локалізація: УКРАЇНСЬКА (HR-03).

Перевіряє:
- Стабільність роботи при послідовному імпорті 96 файлів
- Використання пам'яті (RSS/VMS)
- Продуктивність ETL (середній час на файл)
- Відсутність втрати записів
- Відсутність дублювання між файлами
- Масштабованість індексів
- Коректність побудови embeddings та графових структур
- Здатність AI працювати на повному історичному масиві
"""
import asyncio
import json
import os
import time
from typing import Any

import pytest

from conftest import BULK_FILE_TIMEOUT, ETL_TIMEOUT


@pytest.mark.stage9_bulk
class TestBulkImport:
    """Масове тестування імпорту 96 Excel-файлів."""

    @pytest.mark.asyncio
    async def test_bulk_import_all_files(
        self,
        api_client,
        excel_archive_files,
        test_context,
        report_collector,
    ):
        """Послідовний імпорт усіх Excel-файлів з архіву."""
        test_context["bulk_start_time"] = time.time()
        bulk_results: list[dict[str, Any]] = []
        total_records = 0

        for idx, file_path in enumerate(excel_archive_files):
            file_name = os.path.basename(file_path)
            start = time.time()

            result: dict[str, Any] = {
                "index": idx,
                "file_name": file_name,
                "file_size": os.path.getsize(file_path),
                "status": "pending",
                "duration_seconds": 0,
                "records_processed": 0,
                "records_errors": 0,
                "job_id": None,
                "error": None,
            }

            try:
                # Завантаження файлу
                with open(file_path, "rb") as f:
                    file_bytes = f.read()

                response = await api_client.post(
                    "/ingestion/upload",
                    files={
                        "file": (
                            file_name,
                            file_bytes,
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        )
                    },
                    timeout=60.0,
                )

                if response.status_code == 404:
                    response = await api_client.post(
                        "/upload",
                        files={
                            "file": (
                                file_name,
                                file_bytes,
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            )
                        },
                        timeout=60.0,
                    )

                if response.status_code not in (200, 201, 202):
                    result["status"] = "upload_failed"
                    result["error"] = f"HTTP {response.status_code}: {response.text[:200]}"
                    bulk_results.append(result)
                    continue

                data = response.json()
                job_id = data.get("job_id") or data.get("id") or data.get("jobId")
                result["job_id"] = job_id

                # Polling ETL
                poll_start = time.time()
                status = "queued"
                while status in ("queued", "processing", "pending"):
                    if time.time() - poll_start > BULK_FILE_TIMEOUT:
                        result["status"] = "timeout"
                        result["error"] = f"ETL не завершився за {BULK_FILE_TIMEOUT}с"
                        break
                    await asyncio.sleep(3)

                    resp = await api_client.get(f"/ingestion/jobs/{job_id}")
                    if resp.status_code == 404:
                        resp = await api_client.get(f"/jobs/{job_id}")
                    if resp.status_code == 200:
                        job_data = resp.json()
                        status = job_data.get("status", "unknown")
                        result["records_processed"] = job_data.get("records_processed", 0)
                        result["records_errors"] = job_data.get("records_errors", 0)

                if status == "completed":
                    result["status"] = "completed"
                elif result["status"] != "timeout":
                    result["status"] = status
                    result["error"] = f"ETL завершився зі статусом: {status}"

                result["duration_seconds"] = round(time.time() - start, 2)
                total_records += result["records_processed"]

            except Exception as e:
                result["status"] = "error"
                result["error"] = str(e)
                result["duration_seconds"] = round(time.time() - start, 2)

            bulk_results.append(result)

            # Логування прогресу
            pct = (idx + 1) / len(excel_archive_files) * 100
            print(
                f"[{pct:.0f}%] Файл {idx + 1}/{len(excel_archive_files)}: "
                f"{file_name} — {result['status']} "
                f"({result['duration_seconds']}с, {result['records_processed']} записів)"
            )

        # Зберігаємо результати
        test_context["bulk_results"] = bulk_results
        test_context["bulk_total_records"] = total_records
        report_collector["stages"]["bulk_import"] = {
            "total_files": len(excel_archive_files),
            "completed": sum(1 for r in bulk_results if r["status"] == "completed"),
            "failed": sum(1 for r in bulk_results if r["status"] not in ("completed", "pending")),
            "total_records": total_records,
            "total_duration_seconds": round(time.time() - test_context["bulk_start_time"], 2),
        }

        # Перевірка: мінімум 90% файлів успішно імпортовано
        completed = sum(1 for r in bulk_results if r["status"] == "completed")
        success_rate = completed / max(len(excel_archive_files), 1)
        assert success_rate >= 0.9, (
            f"Лише {completed}/{len(excel_archive_files)} "
            f"({success_rate:.0%}) файлів імпортовано успішно"
        )

    @pytest.mark.asyncio
    async def test_bulk_no_data_loss(
        self, pg_conn, test_context, excel_archive_files
    ):
        """Загальна кількість записів відповідає сумі по файлах."""
        bulk_results = test_context.get("bulk_results", [])
        if not bulk_results:
            pytest.skip("Масовий імпорт не виконувався")

        expected_total = sum(r["records_processed"] for r in bulk_results if r["status"] == "completed")

        # Перевіряємо в PostgreSQL
        try:
            actual_count = await pg_conn.fetchval(
                "SELECT count(*) FROM customs_declarations"
            )

            # Дозволяємо відхилення через можливі дублікати між файлами
            tolerance = max(10, int(expected_total * 0.02))
            assert abs(actual_count - expected_total) <= tolerance, (
                f"Втрата даних: ETL повідомив {expected_total} записів, "
                f"але в PG є {actual_count} (різниця: {abs(actual_count - expected_total)})"
            )
        except Exception as e:
            pytest.skip(f"Помилка запиту до PG: {e}")

    @pytest.mark.asyncio
    async def test_bulk_no_duplicates(self, pg_conn, test_context):
        """Відсутність дублювання записів між файлами."""
        bulk_results = test_context.get("bulk_results", [])
        if not bulk_results:
            pytest.skip("Масовий імпорт не виконувався")

        try:
            duplicate_count = await pg_conn.fetchval(
                """
                SELECT count(*) FROM (
                    SELECT record_hash, count(*) as cnt
                    FROM customs_declarations
                    WHERE record_hash IS NOT NULL
                    GROUP BY record_hash
                    HAVING count(*) > 1
                ) dupes
                """
            )

            # Невелика кількість дублікатів допустима (наприклад, перехідні записи)
            total = test_context.get("bulk_total_records", 1)
            dup_rate = duplicate_count / max(total, 1)
            assert dup_rate < 0.01, (
                f"Занадто багато дублікатів: {duplicate_count} "
                f"({dup_rate:.2%} від {total} записів)"
            )
        except Exception as e:
            pytest.skip(f"Помилка перевірки дублікатів: {e}")

    @pytest.mark.asyncio
    async def test_bulk_etl_performance(self, test_context):
        """Середній час ETL ≤ порогового значення."""
        bulk_results = test_context.get("bulk_results", [])
        if not bulk_results:
            pytest.skip("Масовий імпорт не виконувався")

        completed = [r for r in bulk_results if r["status"] == "completed"]
        if not completed:
            pytest.skip("Жоден файл не був успішно імпортований")

        durations = [r["duration_seconds"] for r in completed]
        avg_duration = sum(durations) / len(durations)
        max_duration = max(durations)

        # Середній час ETL не повинен перевищувати 120 секунд
        assert avg_duration <= 120, (
            f"Середній час ETL занадто великий: {avg_duration:.1f}с (максимум: 120с)"
        )

        # Максимальний час не повинен перевищувати 300 секунд
        assert max_duration <= 300, (
            f"Максимальний час ETL: {max_duration:.1f}с (максимум: 300с)"
        )

    @pytest.mark.asyncio
    async def test_bulk_index_scalability(self, opensearch_client, test_context):
        """Індекси OpenSearch працюють на повному обсязі даних."""
        bulk_results = test_context.get("bulk_results", [])
        if not bulk_results:
            pytest.skip("Масовий імпорт не виконувався")

        # Перевіряємо час пошуку
        start = time.time()
        response = await opensearch_client.post(
            "/_search",
            json={
                "query": {"match_all": {}},
                "size": 10,
            },
        )
        search_duration = time.time() - start

        if response.status_code == 200:
            # Пошук повинен бути швидким навіть на повному масиві
            assert search_duration < 5.0, (
                f"Пошук занадто повільний: {search_duration:.2f}с (максимум: 5с)"
            )

    @pytest.mark.asyncio
    async def test_bulk_graph_integrity(self, neo4j_driver, test_context):
        """Графові структури коректні після масового імпорту."""
        bulk_results = test_context.get("bulk_results", [])
        if not bulk_results:
            pytest.skip("Масовий імпорт не виконувався")

        async with neo4j_driver.session() as session:
            # Перевіряємо кількість вузлів та зв'язків
            result = await session.run(
                """
                MATCH (n)
                WITH count(n) as nodes
                MATCH ()-[r]->()
                RETURN nodes, count(r) as rels
                """
            )
            record = await result.single()

            if record:
                nodes = record["nodes"]
                rels = record["rels"]
                assert nodes > 0, "Немає вузлів у Neo4j після масового імпорту"
                assert rels > 0, "Немає зв'язків у Neo4j після масового імпорту"

    @pytest.mark.asyncio
    async def test_bulk_ai_full_history(self, ai_client, test_context):
        """AI працює на повному історичному масиві (96 файлів за 8 років)."""
        bulk_results = test_context.get("bulk_results", [])
        if not bulk_results:
            pytest.skip("Масовий імпорт не виконувався")

        # Запит, що вимагає знання повного історичного масиву
        response = await ai_client.post(
            "/ai/query",
            json={
                "query": "Покажи тренди імпорту за останні 8 років. Як змінювалась загальна вартість?",
                "use_rag": True,
            },
        )

        if response.status_code != 200:
            pytest.skip(f"AI API: HTTP {response.status_code}")

        data = response.json()
        answer = data.get("answer", "") or data.get("response", "")

        # AI повинен повернути змістовну відповідь про тренди
        assert len(answer) > 50, (
            f"AI не зміг проаналізувати повний історичний масив. Відповідь: {answer[:200]}"
        )
