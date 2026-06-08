"""Omniverse Autonomous Watchdog — OMNIVERSE v70.0.

Фонова служба для періодичного сканування динамічних таблиць на наявність аномалій.
"""
import asyncio
import json
import uuid

from app.services.ai_service_client import AIServiceClient  # Припускаємо наявність клієнта
from app.sinks.clickhouse_sink import ClickHouseSink
from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.watchdog")

class OmniverseWatchdog:
    def __init__(self, interval_seconds: int = 300):
        self.interval = interval_seconds
        self.clickhouse = ClickHouseSink()
        self.ai_client = AIServiceClient() # Клієнт для виклику core-api AI методів або прямий виклик LLM
        self.running = False

    async def start(self):
        self.running = True
        logger.info(f"Omniverse Watchdog started with interval {self.interval}s")

        while self.running:
            try:
                await self._run_cycle()
            except Exception as e:
                logger.error(f"Watchdog cycle error: {e}", exc_info=True)

            await asyncio.sleep(self.interval)

    async def stop(self):
        self.running = False

    async def _run_cycle(self):
        """Один цикл сканування всіх доступних OMNIVERSE таблиць."""
        # 1. Отримуємо список таблиць
        tables_query = "SHOW TABLES LIKE 'omniverse_%'"
        res = self.clickhouse.execute_query(tables_query)
        if res is None:
            logger.debug("ClickHouse недоступний — watchdog cycle skipped")
            return
        tables = [row[0] for row in res]

        for table in tables:
            logger.info(f"Watchdog scanning table: {table}")
            await self._scan_table(table)

    async def _scan_table(self, table: str):
        # 1. Отримуємо останні дані та статистику
        stats_query = f"SELECT count(), max(_ingested_at) FROM {table}"
        stats_res = self.clickhouse.execute_query(stats_query)
        if stats_res is None:
            logger.debug(f"ClickHouse недоступний — scan {table} skipped")
            return
        count, last_ingested = stats_res[0]

        # 2. Якщо таблиця оновилася нещодавно (або ми її ще не сканували)
        # Для спрощення MVP — просто беремо 10 підозрілих рядків
        # Шукаємо екстремальні значення (напр. по першій числовій колонці)
        schema_query = f"DESCRIBE TABLE {table}"
        schema_res = self.clickhouse.execute_query(schema_query)
        if schema_res is None:
            logger.debug(f"ClickHouse недоступний — schema scan {table} skipped")
            return
        num_cols = [row[0] for row in schema_res if "Int" in row[1] or "Float" in row[1]]

        if not num_cols:
            return

        suspicious_query = f"SELECT * EXCEPT(_tenant_id, _job_id) FROM {table} ORDER BY {num_cols[0]} DESC LIMIT 5"  # noqa
        suspicious_res = self.clickhouse.execute_query(suspicious_query)

        # 3. Аналізуємо через AI
        prompt = f"""
        Ти - Autonomous Watchdog платформи PREDATOR.
        Проаналізуй ці 5 потенційно аномальних записів з таблиці '{table}' та визнач рівень ризику (0-100).
        
        ДАНІ:
        {json.dumps(suspicious_res, ensure_ascii=False, default=str)}
        
        Надай відповідь у JSON:
        {{
            "risk_score": int,
            "reason": "коротке пояснення українською",
            "detected_at": "ISO timestamp"
        }}
        """

        # Виклик AI (через AIServiceClient)
        analysis_raw = await self.ai_client.generate_insight(prompt)
        try:
            analysis = json.loads(analysis_raw)
            if analysis.get("risk_score", 0) > 70:
                await self._trigger_alert(table, analysis)
        except:
            logger.warning(f"Failed to parse Watchdog AI response for {table}")

    async def _trigger_alert(self, table: str, analysis: dict):
        """Записує алерт у ClickHouse WORM таблицю `omniverse_alerts`."""
        alert_id = str(uuid.uuid4())
        tenant_id = table.split("_")[1] if "_" in table else "system"

        # Створюємо таблицю алертів якщо її немає
        create_query = """
        CREATE TABLE IF NOT EXISTS omniverse_alerts (
            alert_id String,
            tenant_id String,
            table_name String,
            risk_score Int32,
            reason String,
            detected_at DateTime
        ) ENGINE = MergeTree() ORDER BY detected_at
        """
        self.clickhouse.execute_query(create_query)

        insert_query = f"""
        INSERT INTO omniverse_alerts (alert_id, tenant_id, table_name, risk_score, reason, detected_at)
        VALUES ('{alert_id}', '{tenant_id}', '{table}', {analysis['risk_score']}, '{analysis['reason'].replace("'", "''")}', now())
        """
        self.clickhouse.execute_query(insert_query)
        logger.warning(f"🔥 OMNIVERSE ALERT: {table} - Risk {analysis['risk_score']}: {analysis['reason']}")
