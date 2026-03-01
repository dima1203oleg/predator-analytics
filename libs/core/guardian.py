"""Predator Analytics v45 - Self-Healing Guardian
Core module for system diagnostics, auto-recovery and schema integrity.
"""

import asyncio
import logging
import socket
from typing import Any, Dict, List

from libs.core.config import settings
from libs.core.database import get_db_ctx, init_db
from libs.core.mq import broker
from libs.core.redis import redis_client


logger = logging.getLogger("predator.guardian")


class GuardianService:
    def __init__(self):
        self.health_history = []
        self.last_fix_timestamp = None

    async def check_infrastructure(self) -> dict[str, Any]:
        """Check all critical backend dependencies."""
        results = {}

        # 1. Redis
        try:
            await redis_client.ping()
            results["redis"] = "UP"
        except:
            results["redis"] = "DOWN"

        # 2. RabbitMQ (Simple TCP check as fallback)
        try:
            mq_host = settings.RABBITMQ_URL.split("@")[-1].split(":")[0]
            mq_port = int(settings.RABBITMQ_URL.split(":")[-1].split("/")[0])
            with socket.create_connection((mq_host, mq_port), timeout=1):
                results["rabbitmq"] = "UP"
        except:
            results["rabbitmq"] = "DOWN"

        # 3. Vector DBs
        for svc in ["qdrant", "opensearch"]:
            try:
                url = getattr(settings, f"{svc.upper()}_URL", "")
                host = url.split("//")[-1].split(":")[0]
                port = int(url.split(":")[-1])
                with socket.create_connection((host, port), timeout=1):
                    results[svc] = "UP"
            except:
                results[svc] = "DOWN"

        return results

    async def check_database_health(self) -> dict[str, Any]:
        """Verify DB connectivity and extension availability."""
        from sqlalchemy import text

        status = {
            "status": "healthy",
            "checks": {"connectivity": "UNKNOWN", "extension_trgm": "UNKNOWN", "schema_gold": "UNKNOWN"},
        }
        try:
            async with get_db_ctx() as db:
                # 1. Connectivity
                await db.execute(text("SELECT 1"))
                status["checks"]["connectivity"] = "OK"

                # 2. Extensions
                res = await db.execute(text("SELECT extname FROM pg_extension WHERE extname = 'pg_trgm'"))
                status["checks"]["extension_trgm"] = "OK" if res.fetchone() else "MISSING"

                # 3. Schemas
                res = await db.execute(
                    text("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'gold'")
                )
                status["checks"]["schema_gold"] = "OK" if res.fetchone() else "MISSING"

        except Exception as e:
            logger.error(f"Помилка перевірки БД Guardian: {e}")
            status["status"] = "unhealthy"
            status["error"] = str(e)

        return status

    async def verify_schema_integrity(self) -> list[str]:
        """Detect missing tables or columns in the critical Gold Layer."""
        from sqlalchemy import text

        issues = []
        critical_tables = ["data_sources", "ml_datasets", "ml_jobs", "trinity_audit_logs"]

        try:
            async with get_db_ctx() as db:
                for table in critical_tables:
                    res = await db.execute(
                        text(
                            f"SELECT 1 FROM information_schema.tables WHERE table_schema = 'gold' AND table_name = '{table}'"
                        )
                    )
                    if not res.fetchone():
                        issues.append(f"MISSING_TABLE: gold.{table}")

                # Check for unique constraints in gold schema
                res = await db.execute(
                    text("""
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'data_sources_name_unique'
                    AND table_schema = 'gold'
                """)
                )
                if not res.fetchone():
                    issues.append("MISSING_CONSTRAINT: gold.data_sources.name_unique")

        except Exception as e:
            logger.error(f"Помилка верифікації схеми Guardian: {e}")
            issues.append(f"VERIFICATION_ERROR: {e!s}")

        return issues

    async def run_auto_recovery(self) -> dict[str, Any]:
        """Attempt to fix detected issues automatically."""
        results = {"status": "started", "fixed_issues": []}
        from sqlalchemy import text

        # 1. Run basic init_db (idempotent)
        try:
            await init_db()
            results["fixed_issues"].append("BASE_SCHEMA_SYNC")
        except Exception as e:
            results["fixed_issues"].append(f"FAILED_BASE_SYNC: {e}")

        # 2. Fix specific known issues
        try:
            async with get_db_ctx() as db:
                # Fix data_sources unique constraint in gold schema
                await db.execute(
                    text("""
                    DO $$
                    BEGIN
                        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'gold' AND table_name = 'data_sources') THEN
                            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'data_sources_name_unique' AND table_schema = 'gold') THEN
                                ALTER TABLE gold.data_sources ADD CONSTRAINT data_sources_name_unique UNIQUE (name);
                            END IF;
                        END IF;
                    END $$;
                """)
                )
                results["fixed_issues"].append("DATA_SOURCES_UNIQUE_CONSTRAINT_FIX")

                # Fix ml_datasets unique constraint in gold schema
                await db.execute(
                    text("""
                    DO $$
                    BEGIN
                        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'gold' AND table_name = 'ml_datasets') THEN
                            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'ml_datasets_name_unique' AND table_schema = 'gold') THEN
                                ALTER TABLE gold.ml_datasets ADD CONSTRAINT ml_datasets_name_unique UNIQUE (name);
                            END IF;
                        END IF;
                    END $$;
                """)
                )
                results["fixed_issues"].append("ML_DATASETS_UNIQUE_CONSTRAINT_FIX")

                await db.commit()
        except Exception as e:
            logger.error(f"Помилка авто-відновлення Guardian: {e}")
            results["error"] = str(e)

        results["status"] = "completed"
        return results

    async def start(self):
        """Start the background Guardian reconciliation loop."""
        logger.info("🛡️ Цикл моніторингу Guardian ЗАПУЩЕНО.")
        while True:
            try:
                # 1. Run diagnostics
                infra = await self.check_infrastructure()
                schema_issues = await self.verify_schema_integrity()

                # 2. Trigger auto-recovery if critical issues found
                if any(v == "DOWN" for v in infra.values()) or schema_issues:
                    logger.warning("⚠️ Guardian виявив деградацію системи. Запуск автоматичного відновлення...")
                    await self.run_auto_recovery()

                # 3. Heartbeat log
                logger.debug("Guardian: Перевірка системи завершена. Стан: ЗДОРОВИЙ")

            except Exception as e:
                logger.error(f"Помилка циклу Guardian: {e}")

            await asyncio.sleep(300)  # Reconcile every 5 minutes


guardian = GuardianService()
