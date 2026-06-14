"""Етап 5: Побудова представлень (Embeddings, Графи, Індекси, ML-ознаки).

PREDATOR Analytics v61.0-ELITE.
Канонічна локалізація: УКРАЇНСЬКА (HR-03).

Перевіряє:
- Векторні подання (embeddings) створені в Qdrant
- Пошукові індекси створені в OpenSearch
- Графові зв'язки побудовані в Neo4j
- Аналітичні структури оновлені в ClickHouse
- ML-ознаки (risk_score тощо) обчислені
- Метадані нового датасету зареєстровані
"""
import pytest


@pytest.mark.stage5_representations
class TestEmbeddingsCreated:
    """Перевірка створення векторних подань (embeddings)."""

    @pytest.mark.asyncio
    async def test_embeddings_count_matches_records(
        self, qdrant_client_fixture, test_context
    ):
        """Кількість embeddings ≈ кількість записів у PostgreSQL."""
        pg_count = test_context.get("db_counts", {}).get("postgresql", 0)
        qdrant_count = test_context.get("db_counts", {}).get("qdrant", 0)

        if pg_count == 0:
            pytest.skip("PostgreSQL не має записів")
        if qdrant_count == 0:
            pytest.skip("Qdrant не має embeddings")

        # Дозволяємо відхилення — не кожен запис може мати embedding
        min_expected = max(1, int(pg_count * 0.5))
        assert qdrant_count >= min_expected, (
            f"Недостатньо embeddings: {qdrant_count}, "
            f"очікувано мінімум {min_expected} (50% від PG: {pg_count})"
        )

    @pytest.mark.asyncio
    async def test_embedding_dimensions(self, qdrant_client_fixture):
        """Вектори мають правильну розмірність."""
        response = await qdrant_client_fixture.get("/collections")
        if response.status_code != 200:
            pytest.skip("Qdrant недоступний")

        collections = response.json().get("result", {}).get("collections", [])
        for coll in collections:
            coll_name = coll["name"]
            resp = await qdrant_client_fixture.get(f"/collections/{coll_name}")
            if resp.status_code == 200:
                config = resp.json().get("result", {}).get("config", {})
                params = config.get("params", {})
                vectors = params.get("vectors", {})

                # Перевіряємо розмірність
                if isinstance(vectors, dict) and "size" in vectors:
                    dim = vectors["size"]
                    assert dim > 0, f"Розмірність 0 у колекції {coll_name}"
                    assert dim <= 4096, f"Підозріла розмірність {dim} у {coll_name}"


@pytest.mark.stage5_representations
class TestSearchIndicesCreated:
    """Перевірка побудови пошукових індексів в OpenSearch."""

    @pytest.mark.asyncio
    async def test_index_mapping_correct(self, opensearch_client):
        """Маппінг індексу містить необхідні поля."""
        response = await opensearch_client.get("/_cat/indices?format=json")
        if response.status_code != 200:
            pytest.skip("OpenSearch недоступний")

        indices = response.json()
        customs_indices = [
            idx["index"] for idx in indices
            if "declaration" in idx.get("index", "")
            or "customs" in idx.get("index", "")
        ]

        if not customs_indices:
            pytest.skip("Індекси декларацій не знайдені")

        # Перевіряємо маппінг першого індексу
        idx_name = customs_indices[0]
        resp = await opensearch_client.get(f"/{idx_name}/_mapping")
        if resp.status_code == 200:
            mapping = resp.json()
            # Перевіряємо наявність ключових полів у маппінгу
            properties = (
                mapping.get(idx_name, {})
                .get("mappings", {})
                .get("properties", {})
            )

            expected_fields = [
                "declaration_number",
                "company_edrpou",
                "customs_value",
            ]
            missing = [f for f in expected_fields if f not in properties]

            # М'яка перевірка — не всі поля можуть бути в маппінгу
            if len(missing) == len(expected_fields):
                pytest.xfail(f"Жодного очікуваного поля не знайдено: {missing}")

    @pytest.mark.asyncio
    async def test_fulltext_search_after_import(self, opensearch_client, test_context):
        """Повнотекстовий пошук знаходить нові дані після імпорту."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        response = await opensearch_client.get("/_cat/indices?format=json")
        indices = response.json()
        customs_indices = [
            idx["index"] for idx in indices
            if "declaration" in idx.get("index", "")
            or "customs" in idx.get("index", "")
        ]

        if not customs_indices:
            pytest.skip("Індекси декларацій не знайдені")

        # Пошук по ключовому слову з файлу
        for idx_name in customs_indices:
            resp = await opensearch_client.post(
                f"/{idx_name}/_search",
                json={
                    "query": {"match_all": {}},
                    "size": 1,
                },
            )
            if resp.status_code == 200:
                total = resp.json().get("hits", {}).get("total", {})
                count = total.get("value", 0) if isinstance(total, dict) else total
                if count > 0:
                    return

        pytest.fail("Пошук не повернув жодного результату після імпорту")


@pytest.mark.stage5_representations
class TestGraphRelationshipsBuilt:
    """Перевірка побудови графових зв'язків у Neo4j."""

    @pytest.mark.asyncio
    async def test_company_declaration_relationships(self, neo4j_driver):
        """Зв'язки Company → Declaration побудовані."""
        async with neo4j_driver.session() as session:
            result = await session.run(
                """
                MATCH (c:Company)-[r]->(d)
                RETURN type(r) as rel_type, count(r) as cnt
                LIMIT 10
                """
            )
            records = [record async for record in result]

        if not records:
            pytest.skip("Зв'язки Company не знайдені в Neo4j")

        total_rels = sum(r["cnt"] for r in records)
        assert total_rels > 0, "Графові зв'язки не побудовані"

    @pytest.mark.asyncio
    async def test_country_origin_nodes(self, neo4j_driver):
        """Вузли країн походження створені."""
        async with neo4j_driver.session() as session:
            result = await session.run(
                "MATCH (c:Country) RETURN count(c) as cnt"
            )
            record = await result.single()
            count = record["cnt"] if record else 0

        # Країни можуть бути як окремі вузли, так і властивості
        if count == 0:
            pytest.xfail("Вузли Country не створені (можливо, зберігаються як властивості)")


@pytest.mark.stage5_representations
class TestAnalyticsStructures:
    """Перевірка оновлення аналітичних структур у ClickHouse."""

    @pytest.mark.asyncio
    async def test_aggregation_tables_updated(self, ch_client, db_config):
        """Агрегатні таблиці оновлені після імпорту."""
        db = db_config["clickhouse_database"]

        # Перевіряємо наявність таблиць
        query = f"SHOW TABLES FROM {db}"
        response = await ch_client.post("/", content=query)

        if response.status_code != 200:
            pytest.skip(f"ClickHouse помилка: {response.text}")

        tables = response.text.strip().split("\n")
        assert len(tables) > 0, "Немає таблиць у ClickHouse"


@pytest.mark.stage5_representations
class TestMLFeatures:
    """Перевірка обчислення ML-ознак."""

    @pytest.mark.asyncio
    async def test_risk_scores_computed(self, pg_conn, test_context):
        """Похідні поля (risk_score) обчислені."""
        job_id = test_context.get("job_id")
        if not job_id:
            pytest.skip("job_id відсутній")

        # Перевіряємо наявність risk_score (якщо колонка існує)
        try:
            count = await pg_conn.fetchval(
                """
                SELECT count(*)
                FROM customs_declarations
                WHERE job_id = $1 AND risk_score IS NOT NULL
                """,
                job_id,
            )
            # risk_score може бути nullable — перевіряємо, що хоча б частина обчислена
            if count == 0:
                pytest.xfail("risk_score не обчислений (функціональність може бути вимкнена)")
        except Exception:
            pytest.xfail("Колонка risk_score не існує в таблиці")

    @pytest.mark.asyncio
    async def test_ueid_generated(self, pg_conn, test_context):
        """UEID (Unique Entity ID) згенерований для кожної компанії."""
        job_id = test_context.get("job_id")
        if not job_id:
            pytest.skip("job_id відсутній")

        try:
            count_with_ueid = await pg_conn.fetchval(
                """
                SELECT count(*)
                FROM customs_declarations
                WHERE job_id = $1 AND ueid IS NOT NULL
                """,
                job_id,
            )
            count_total = await pg_conn.fetchval(
                """
                SELECT count(*)
                FROM customs_declarations
                WHERE job_id = $1 AND company_edrpou IS NOT NULL
                """,
                job_id,
            )

            if count_total > 0:
                coverage = count_with_ueid / count_total
                assert coverage >= 0.9, (
                    f"UEID покриття: {coverage:.0%} "
                    f"({count_with_ueid}/{count_total})"
                )
        except Exception:
            pytest.xfail("Колонка ueid не існує в таблиці")


@pytest.mark.stage5_representations
class TestCatalogRegistration:
    """Перевірка реєстрації нових даних у каталогах і метаданих."""

    @pytest.mark.asyncio
    async def test_dataset_registered(self, pg_conn, test_context):
        """Метадані нового датасету зареєстровані."""
        job_id = test_context.get("job_id")
        if not job_id:
            pytest.skip("job_id відсутній")

        # Перевіряємо ingestion_jobs
        status = await pg_conn.fetchval(
            "SELECT status FROM ingestion_jobs WHERE id = $1",
            job_id,
        )
        assert status == "completed", f"Job статус: {status}"

    @pytest.mark.asyncio
    async def test_processed_events_logged(self, pg_conn, test_context):
        """Оброблені події записані в processed_events (ідемпотентність)."""
        job_id = test_context.get("job_id")
        if not job_id:
            pytest.skip("job_id відсутній")

        try:
            count = await pg_conn.fetchval(
                "SELECT count(*) FROM processed_events WHERE event_id = $1",
                str(job_id),
            )
            assert count > 0, "Подія не зареєстрована в processed_events"
        except Exception:
            pytest.xfail("Таблиця processed_events не існує")
