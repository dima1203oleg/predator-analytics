"""ADV DVS: PostgreSQL Check."""
import os
from predator_common.logging import get_logger

logger = get_logger("adv_dvs.checks.postgres")

async def check_postgres() -> dict:
    """
    Перевіряє з'єднання з PostgreSQL.
    Згідно з HR-18, PostgreSQL є Single Source of Truth (SSOT).
    """
    try:
        import asyncpg
    except ImportError:
        return {"status": "fail", "component": "postgres", "message": "asyncpg is not installed"}

    pg_dsn = os.getenv("POSTGRES_DSN", "postgresql://predator:password@postgres:5432/predator_db")
    logger.info("Перевірка підключення до PostgreSQL (SSOT)")
    try:
        conn = await asyncpg.connect(pg_dsn, timeout=5.0)
        await conn.execute("SELECT 1")
        await conn.close()
        return {"status": "passed", "component": "postgres", "message": "Підключення успішне. SSOT доступний."}
    except Exception as e:
        logger.error(f"Помилка PostgreSQL: {e}")
        return {"status": "fail", "component": "postgres", "message": str(e)}
