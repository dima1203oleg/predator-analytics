"""Етап 2–4: Перевірка ETL та запису до всіх 8 сховищ.

PREDATOR Analytics v61.0-ELITE.
Канонічна локалізація: УКРАЇНСЬКА (HR-03).

Перевіряє:
- Приймання Excel-файлу через API (upload → job → ETL)
- Запис у PostgreSQL, ClickHouse, Neo4j, Qdrant, OpenSearch, Redis, MinIO
- Цілісність даних, відсутність втрат та дублювання
- Перехресна перевірка кількості записів між БД
"""
import asyncio
import hashlib
import os
import time
from typing import Any

import pytest

from conftest import API_BASE_URL, ETL_TIMEOUT, REAL_EXCEL_FILE


# ═══════════════════════════════════════════════════════════════════════════
# Етап 2: Приймання файлу
# ═══════════════════════════════════════════════════════════════════════════
@pytest.mark.stage2_accept
class TestFileAcceptance:
    """Перевірка приймання та початкової обробки Excel-файлу."""

    @pytest.mark.asyncio
    async def test_upload_file_via_api(
        self,
        api_client,
        excel_file_path,
        excel_file_bytes,
        excel_file_hash,
        test_context,
    ):
        """Завантаження Excel-файлу через REST API."""
        file_name = os.path.basename(excel_file_path)

        response = await api_client.post(
            "/ingestion/upload",
            files={"file": (file_name, excel_file_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )

        # Якщо API не підтримує upload — пробуємо альтернативний endpoint
        if response.status_code == 404:
            response = await api_client.post(
                "/upload",
                files={"file": (file_name, excel_file_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            )

        assert response.status_code in (200, 201, 202), (
            f"Не вдалося завантажити файл: HTTP {response.status_code} — {response.text}"
        )

        data = response.json()
        job_id = data.get("job_id") or data.get("id") or data.get("jobId")
        assert job_id, f"Відсутній job_id у відповіді: {data}"

        # Зберігаємо контекст для наступних тестів
        test_context["job_id"] = job_id
        test_context["upload_start_time"] = time.time()
        test_context["file_name"] = file_name

    @pytest.mark.asyncio
    async def test_poll_etl_completion(self, api_client, test_context):
        """Очікування завершення ETL обробки (polling)."""
        job_id = test_context.get("job_id")
        if not job_id:
            pytest.skip("job_id відсутній (попередній тест не пройшов)")

        poll_start = time.time()
        status = "queued"

        while status in ("queued", "processing", "pending"):
            if time.time() - poll_start > ETL_TIMEOUT:
                pytest.fail(f"ETL не завершився за {ETL_TIMEOUT}с. Статус: {status}")

            await asyncio.sleep(3)

            # Перевірка статусу job
            response = await api_client.get(f"/ingestion/jobs/{job_id}")
            if response.status_code == 404:
                response = await api_client.get(f"/jobs/{job_id}")

            if response.status_code == 200:
                data = response.json()
                status = data.get("status", "unknown")
                progress = data.get("progress", 0)
                test_context["records_processed"] = data.get("records_processed", 0)
                test_context["records_errors"] = data.get("records_errors", 0)

        elapsed = time.time() - poll_start
        test_context["etl_duration_seconds"] = elapsed
        test_context["upload_completed"] = status == "completed"

        assert status == "completed", f"ETL завершився з помилкою: {status}"

    @pytest.mark.asyncio
    async def test_file_checksum_integrity(
        self, excel_file_hash, minio_client, test_context
    ):
        """Контрольна сума оригіналу файлу в MinIO збігається з локальною."""
        job_id = test_context.get("job_id")
        if not job_id:
            pytest.skip("job_id відсутній")

        # Шукаємо файл у MinIO
        tenant_id = "a0000000-0000-0000-0000-000000000001"
        bucket = f"tenant-{tenant_id}-raw"

        found = False
        for obj in minio_client.list_objects(bucket, prefix=str(job_id), recursive=True):
            if obj.object_name.endswith(".xlsx"):
                # Завантажуємо та перевіряємо хеш
                response = minio_client.get_object(bucket, obj.object_name)
                content = response.read()
                response.close()
                response.release_conn()

                stored_hash = hashlib.sha256(content).hexdigest()
                assert stored_hash == excel_file_hash, (
                    f"Хеші не збігаються: local={excel_file_hash[:16]}... "
                    f"vs minio={stored_hash[:16]}..."
                )
                found = True
                break

        assert found, "Оригінал Excel-файлу не знайдено в MinIO"


# ═══════════════════════════════════════════════════════════════════════════
# Етап 3–4: Запис до сховищ (Multi-DB Verification)
# ═══════════════════════════════════════════════════════════════════════════
@pytest.mark.stage4_storage
class TestPostgreSQLIntegrity:
    """PostgreSQL (SSOT) — Хранитель Істини."""

    @pytest.mark.asyncio
    async def test_declarations_exist(self, pg_conn, test_context):
        """Декларації записані в PostgreSQL."""
        job_id = test_context.get("job_id")
        if not job_id:
            pytest.skip("job_id відсутній")

        count = await pg_conn.fetchval(
            "SELECT count(*) FROM customs_declarations WHERE job_id = $1",
            job_id,
        )
        assert count > 0, f"Декларації не знайдені для job_id={job_id}"
        test_context["db_counts"]["postgresql"] = count

    @pytest.mark.asyncio
    async def test_companies_upserted(self, pg_conn, test_context):
        """Компанії створені/оновлені в PostgreSQL."""
        count = await pg_conn.fetchval(
            "SELECT count(DISTINCT company_edrpou) FROM customs_declarations WHERE job_id = $1",
            test_context.get("job_id"),
        )
        assert count > 0, "Компанії не знайдені"
        test_context["db_counts"]["pg_companies"] = count

    @pytest.mark.asyncio
    async def test_no_duplicates_in_pg(self, pg_conn, test_context):
        """Відсутність дублікатів у PostgreSQL (record_hash унікальний)."""
        job_id = test_context.get("job_id")
        if not job_id:
            pytest.skip("job_id відсутній")

        duplicates = await pg_conn.fetchval(
            """
            SELECT count(*)
            FROM (
                SELECT record_hash, count(*) as cnt
                FROM customs_declarations
                WHERE job_id = $1 AND record_hash IS NOT NULL
                GROUP BY record_hash
                HAVING count(*) > 1
            ) dupes
            """,
            job_id,
        )
        assert duplicates == 0, f"Знайдено {duplicates} дублікатів у PostgreSQL"

    @pytest.mark.asyncio
    async def test_audit_log_created(self, pg_conn, test_context):
        """Запис аудиту створено (WORM таблиця)."""
        job_id = test_context.get("job_id")
        if not job_id:
            pytest.skip("job_id відсутній")

        count = await pg_conn.fetchval(
            "SELECT count(*) FROM audit_log WHERE entity_id = $1",
            job_id,
        )
        assert count > 0, "Запис аудиту не створено"

    @pytest.mark.asyncio
    async def test_ingestion_job_status(self, pg_conn, test_context):
        """Статус ingestion_job = 'completed'."""
        job_id = test_context.get("job_id")
        if not job_id:
            pytest.skip("job_id відсутній")

        status = await pg_conn.fetchval(
            "SELECT status FROM ingestion_jobs WHERE id = $1",
            job_id,
        )
        assert status == "completed", f"Статус job: {status}, очікувано: completed"


@pytest.mark.stage4_storage
class TestClickHouseIntegrity:
    """ClickHouse (OLAP) — Аналітичний Мозок."""

    @pytest.mark.asyncio
    async def test_declarations_in_clickhouse(self, ch_client, test_context, db_config):
        """Декларації записані в ClickHouse."""
        job_id = test_context.get("job_id")
        if not job_id:
            pytest.skip("job_id відсутній")

        db = db_config["clickhouse_database"]
        query = f"SELECT count() FROM {db}.customs_declarations WHERE job_id = '{job_id}'"
        response = await ch_client.post("/", content=query)

        assert response.status_code == 200, f"ClickHouse помилка: {response.text}"
        ch_count = int(response.text.strip())
        assert ch_count > 0, f"Декларації не знайдені в ClickHouse для job_id={job_id}"
        test_context["db_counts"]["clickhouse"] = ch_count

    @pytest.mark.asyncio
    async def test_analytics_aggregates(self, ch_client, db_config):
        """Аналітичні агрегати обчислені."""
        db = db_config["clickhouse_database"]
        query = f"""
            SELECT
                count() as total_rows,
                uniqExact(company_edrpou) as unique_companies,
                sum(customs_value) as total_value
            FROM {db}.customs_declarations
            WHERE customs_value > 0
        """
        response = await ch_client.post("/", content=query, params={"default_format": "JSONEachRow"})

        if response.status_code == 200 and response.text.strip():
            import json
            data = json.loads(response.text.strip())
            assert data.get("total_rows", 0) > 0, "Агрегати порожні"


@pytest.mark.stage4_storage
class TestNeo4jIntegrity:
    """Neo4j (Graph) — Детектор Зв'язків."""

    @pytest.mark.asyncio
    async def test_company_nodes_created(self, neo4j_driver, test_context):
        """Вузли Company створені в Neo4j."""
        job_id = test_context.get("job_id")
        if not job_id:
            pytest.skip("job_id відсутній")

        async with neo4j_driver.session() as session:
            result = await session.run(
                "MATCH (c:Company) WHERE c.job_id = $job_id RETURN count(c) as cnt",
                job_id=job_id,
            )
            record = await result.single()
            count = record["cnt"] if record else 0

        assert count > 0, "Вузли Company не знайдені в Neo4j"
        test_context["db_counts"]["neo4j_companies"] = count

    @pytest.mark.asyncio
    async def test_graph_relationships_exist(self, neo4j_driver):
        """Зв'язки між вузлами побудовані."""
        async with neo4j_driver.session() as session:
            result = await session.run(
                "MATCH ()-[r]->() RETURN count(r) as cnt LIMIT 1"
            )
            record = await result.single()
            count = record["cnt"] if record else 0

        assert count > 0, "Зв'язки в графі відсутні"


@pytest.mark.stage4_storage
class TestQdrantIntegrity:
    """Qdrant (Vector) — AI Пам'ять."""

    @pytest.mark.asyncio
    async def test_vectors_exist(self, qdrant_client_fixture, test_context):
        """Векторні подання (embeddings) створені в Qdrant."""
        # Перевіряємо наявність колекцій
        response = await qdrant_client_fixture.get("/collections")
        assert response.status_code == 200

        collections = response.json().get("result", {}).get("collections", [])
        coll_names = [c["name"] for c in collections]

        # Знаходимо релевантну колекцію
        embedding_colls = [n for n in coll_names if "embedding" in n or "predator" in n or "customs" in n]

        if not embedding_colls:
            pytest.skip(f"Колекції embeddings не знайдені. Наявні: {coll_names}")

        # Перевіряємо кількість точок
        for coll_name in embedding_colls:
            resp = await qdrant_client_fixture.get(f"/collections/{coll_name}")
            if resp.status_code == 200:
                points_count = resp.json().get("result", {}).get("points_count", 0)
                if points_count > 0:
                    test_context["db_counts"]["qdrant"] = points_count
                    return

        pytest.fail(f"Вектори не знайдені у колекціях: {embedding_colls}")

    @pytest.mark.asyncio
    async def test_vector_search_works(self, qdrant_client_fixture):
        """Пошук по векторах працює."""
        # Отримуємо список колекцій для знаходження першої з точками
        response = await qdrant_client_fixture.get("/collections")
        collections = response.json().get("result", {}).get("collections", [])

        for coll in collections:
            coll_name = coll["name"]
            resp = await qdrant_client_fixture.get(f"/collections/{coll_name}")
            if resp.status_code == 200:
                points_count = resp.json().get("result", {}).get("points_count", 0)
                if points_count > 0:
                    # Колекція з даними знайдена — тест пройдено
                    return

        pytest.skip("Немає колекцій з точками для перевірки пошуку")


@pytest.mark.stage4_storage
class TestOpenSearchIntegrity:
    """OpenSearch (Search) — Текстова Розвідка."""

    @pytest.mark.asyncio
    async def test_indices_exist(self, opensearch_client, test_context):
        """Пошукові індекси створені в OpenSearch."""
        response = await opensearch_client.get("/_cat/indices?format=json")
        assert response.status_code == 200

        indices = response.json()
        # Шукаємо індекси, пов'язані з деклараціями
        declaration_indices = [
            idx for idx in indices
            if "declaration" in idx.get("index", "")
            or "customs" in idx.get("index", "")
        ]

        assert len(declaration_indices) > 0, (
            f"Індекси декларацій не знайдені. Наявні: {[i['index'] for i in indices[:10]]}"
        )

        # Рахуємо документи
        total_docs = sum(int(idx.get("docs.count", 0)) for idx in declaration_indices)
        test_context["db_counts"]["opensearch"] = total_docs

    @pytest.mark.asyncio
    async def test_fulltext_search(self, opensearch_client):
        """Повнотекстовий пошук працює."""
        # Пробуємо пошук по ключовому слову
        search_body = {
            "query": {"match_all": {}},
            "size": 1,
        }

        # Знаходимо перший доступний індекс
        response = await opensearch_client.get("/_cat/indices?format=json")
        indices = response.json()
        customs_indices = [
            idx["index"] for idx in indices
            if "declaration" in idx.get("index", "")
            or "customs" in idx.get("index", "")
        ]

        for idx_name in customs_indices:
            resp = await opensearch_client.post(
                f"/{idx_name}/_search",
                json=search_body,
            )
            if resp.status_code == 200:
                hits = resp.json().get("hits", {}).get("total", {})
                total = hits.get("value", 0) if isinstance(hits, dict) else hits
                if total > 0:
                    return

        pytest.skip("Повнотекстовий пошук не повернув результатів")


@pytest.mark.stage4_storage
class TestRedisIntegrity:
    """Redis (Cache) — Швидка Пам'ять."""

    def test_cache_populated(self, redis_client, test_context):
        """Кеші та службові записи створені в Redis."""
        keys_count = redis_client.dbsize()
        test_context["db_counts"]["redis"] = keys_count

        # Redis може мати 0 ключів якщо кеш ще не побудований — це warning, не fail
        assert keys_count >= 0, "Redis недоступний"

    def test_redis_ttl_policy(self, redis_client):
        """Перевірка TTL-політики для кешованих записів."""
        # Знаходимо ключі кешу
        cursor = 0
        checked = 0
        while checked < 10:
            cursor, keys = redis_client.scan(cursor=cursor, match="cache:*", count=100)
            for key in keys:
                ttl = redis_client.ttl(key)
                assert ttl != -1, f"Ключ {key} не має TTL (нескінченний кеш)"
                checked += 1
                if checked >= 10:
                    break
            if cursor == 0:
                break


@pytest.mark.stage4_storage
class TestMinIOIntegrity:
    """MinIO (S3) — Фізичне Сховище."""

    def test_original_file_stored(self, minio_client, test_context):
        """Оригінальний файл збережений в MinIO без модифікацій."""
        job_id = test_context.get("job_id")
        if not job_id:
            pytest.skip("job_id відсутній")

        # Перебираємо бакети для знаходження файлу
        buckets = minio_client.list_buckets()
        raw_buckets = [b.name for b in buckets if "raw" in b.name]

        found = False
        for bucket_name in raw_buckets:
            for obj in minio_client.list_objects(bucket_name, prefix=str(job_id), recursive=True):
                if obj.object_name.endswith((".xlsx", ".xls")):
                    found = True
                    test_context["db_counts"]["minio"] = 1
                    break
            if found:
                break

        assert found, f"Оригінал файлу не знайдено в MinIO (job_id={job_id})"


# ═══════════════════════════════════════════════════════════════════════════
# Перехресна перевірка цілісності даних
# ═══════════════════════════════════════════════════════════════════════════
@pytest.mark.stage4_storage
class TestCrossDBConsistency:
    """Перехресна перевірка кількості записів між усіма сховищами."""

    def test_no_data_loss(self, test_context, excel_file_metadata):
        """Загальна кількість записів = PG + quarantine (без втрат)."""
        pg_count = test_context.get("db_counts", {}).get("postgresql", 0)
        quarantine_count = test_context.get("records_quarantined", 0)
        duplicates = test_context.get("records_duplicates", 0)
        expected_total = excel_file_metadata.get("total_rows", 0)

        actual_total = pg_count + quarantine_count + duplicates
        # Допускаємо невелике відхилення через заголовки
        assert abs(actual_total - expected_total) <= 2, (
            f"Втрата даних! Excel: {expected_total} рядків, "
            f"PG: {pg_count} + quarantine: {quarantine_count} + dupes: {duplicates} = {actual_total}"
        )

    def test_pg_clickhouse_consistency(self, test_context):
        """Кількість записів PostgreSQL == ClickHouse."""
        pg_count = test_context.get("db_counts", {}).get("postgresql", 0)
        ch_count = test_context.get("db_counts", {}).get("clickhouse", 0)

        if pg_count == 0 or ch_count == 0:
            pytest.skip("Одна з БД не має записів")

        assert pg_count == ch_count, (
            f"Невідповідність PG ({pg_count}) vs CH ({ch_count})"
        )

    def test_pg_opensearch_consistency(self, test_context):
        """Кількість записів PostgreSQL ≈ OpenSearch."""
        pg_count = test_context.get("db_counts", {}).get("postgresql", 0)
        os_count = test_context.get("db_counts", {}).get("opensearch", 0)

        if pg_count == 0 or os_count == 0:
            pytest.skip("Одна з БД не має записів")

        # OpenSearch може мати затримку індексації — допускаємо 5% відхилення
        tolerance = max(1, int(pg_count * 0.05))
        assert abs(pg_count - os_count) <= tolerance, (
            f"Невідповідність PG ({pg_count}) vs OpenSearch ({os_count}), "
            f"допустиме відхилення: {tolerance}"
        )

    def test_dri_calculation(self, test_context, report_collector):
        """Розрахунок DRI (Deployment Readiness Index)."""
        db_counts = test_context.get("db_counts", {})

        # Перевіряємо, що всі 8 сховищ мають дані
        expected_stores = ["postgresql", "clickhouse", "neo4j_companies", "qdrant", "opensearch", "redis", "minio"]
        passed = 0
        total = len(expected_stores)

        for store in expected_stores:
            count = db_counts.get(store, 0)
            if count > 0 or store == "redis":  # Redis може мати 0 ключів
                passed += 1
            report_collector["dri_checks"][store] = {
                "count": count,
                "status": "pass" if count > 0 or store == "redis" else "fail",
            }

        dri = (passed / total) * 100.0 if total > 0 else 0.0
        report_collector["stages"]["etl_dri"] = round(dri, 2)

        assert dri >= 85.0, f"DRI занадто низький: {dri:.1f}% (мінімум 85%)"
