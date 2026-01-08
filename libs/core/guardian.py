"""
Predator Analytics v25 - Self-Healing Guardian
Core module for system diagnostics, auto-recovery and schema integrity.
"""
import logging
import asyncio
from typing import Dict, List, Any
import socket
from .database import get_db_ctx, init_db
from .config import settings
from .redis import redis_client
from .mq import broker

logger = logging.getLogger("predator.guardian")

class GuardianService:
    def __init__(self):
        self.health_history = []
        self.last_fix_timestamp = None

    async def check_infrastructure(self) -> Dict[str, Any]:
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

    async def check_database_health(self) -> Dict[str, Any]:
        """Verify DB connectivity and extension availability."""
        from sqlalchemy import text
        status = {
            "status": "healthy",
            "checks": {
                "connectivity": "UNKNOWN",
                "extension_trgm": "UNKNOWN",
                "schema_gold": "UNKNOWN"
            }
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
                res = await db.execute(text("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'gold'"))
                status["checks"]["schema_gold"] = "OK" if res.fetchone() else "MISSING"

        except Exception as e:
            logger.error(f"Guardian DB Check Failed: {e}")
            status["status"] = "unhealthy"
            status["error"] = str(e)

        return status

    async def verify_schema_integrity(self) -> List[str]:
        """Detect missing tables or columns in the critical Gold Layer."""
        from sqlalchemy import text
        issues = []
        critical_tables = ["data_sources", "ml_datasets", "ml_jobs", "trinity_audit_logs"]

        try:
            async with get_db_ctx() as db:
                for table in critical_tables:
                    res = await db.execute(text(f"SELECT 1 FROM information_schema.tables WHERE table_schema = 'gold' AND table_name = '{table}'"))
                    if not res.fetchone():
                        issues.append(f"MISSING_TABLE: gold.{table}")

                # Check for unique constraints
                res = await db.execute(text("SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'data_sources_name_unique'"))
                if not res.fetchone():
                    issues.append("MISSING_CONSTRAINT: gold.data_sources.name_unique")

        except Exception as e:
            logger.error(f"Guardian Schema Verification Error: {e}")
            issues.append(f"VERIFICATION_ERROR: {str(e)}")

        return issues

    async def run_auto_recovery(self) -> Dict[str, Any]:
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
                # Fix data_sources unique constraint
                await db.execute(text("""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'data_sources_name_unique') THEN
                            ALTER TABLE gold.data_sources ADD CONSTRAINT data_sources_name_unique UNIQUE (name);
                        END IF;
                    END $$;
                """))
                results["fixed_issues"].append("DATA_SOURCES_UNIQUE_CONSTRAINT_FIX")

                # Fix ml_datasets unique constraint
                await db.execute(text("""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'ml_datasets_name_unique') THEN
                            ALTER TABLE gold.ml_datasets ADD CONSTRAINT ml_datasets_name_unique UNIQUE (name);
                        END IF;
                    END $$;
                """))
                results["fixed_issues"].append("ML_DATASETS_UNIQUE_CONSTRAINT_FIX")

                await db.commit()
        except Exception as e:
            logger.error(f"Guardian Auto-Recovery Error: {e}")
            results["error"] = str(e)

        results["status"] = "completed"
        return results

    async def start(self):
        """Start the background Guardian reconciliation loop."""
        logger.info("🛡️ Guardian Reconciliation Loop STARTED.")
        while True:
            try:
                # 1. Run diagnostics
                infra = await self.check_infrastructure()
                schema_issues = await self.verify_schema_integrity()

                # 2. Trigger auto-recovery if critical issues found
                if any(v == "DOWN" for v in infra.values()) or schema_issues:
                    logger.warning(f"⚠️ Guardian detected system degradation. Triggering Auto-Recovery...")
                    await self.run_auto_recovery()

                # 3. Heartbeat log
                logger.debug("Guardian: System check completed. Status: HEALTHY")

            except Exception as e:
                logger.error(f"Guardian Loop Error: {e}")

            await asyncio.sleep(300) # Reconcile every 5 minutes

guardian = GuardianService()
