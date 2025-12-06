"""
Maintenance Tasks
Cleanup and optimization tasks for the platform
"""
from celery import shared_task
import asyncio
import logging
from datetime import datetime, timedelta

logger = logging.getLogger("tasks.maintenance")


@shared_task(name="tasks.maintenance.cleanup_staging")
def cleanup_staging(days: int = 90):
    """
    Clean up old processed records from staging.raw_data
    
    Args:
        days: Delete records older than this many days
    
    Returns:
        {status, deleted_count}
    """
    import asyncpg
    import os
    
    logger.info(f"[CLEANUP] Starting cleanup of staging records older than {days} days")
    
    async def run_cleanup():
        db_url = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db")
        conn = await asyncpg.connect(db_url)
        
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Only delete processed records
            result = await conn.execute("""
                DELETE FROM staging.raw_data 
                WHERE processed = TRUE AND fetched_at < $1
            """, cutoff_date)
            
            # Parse result like "DELETE 42"
            deleted_count = int(result.split()[-1]) if result else 0
            
            logger.info(f"[CLEANUP] Deleted {deleted_count} old staging records")
            
            # Vacuum analyze for performance
            await conn.execute("VACUUM ANALYZE staging.raw_data")
            
            return {
                "status": "success",
                "deleted_count": deleted_count,
                "cutoff_date": cutoff_date.isoformat()
            }
            
        except Exception as e:
            logger.error(f"[CLEANUP] Failed: {e}")
            return {"status": "failed", "error": str(e)}
        finally:
            await conn.close()
    
    return asyncio.run(run_cleanup())


@shared_task(name="tasks.maintenance.cleanup_search_logs")
def cleanup_search_logs(days: int = 30):
    """
    Clean up old search logs
    
    Args:
        days: Delete logs older than this many days
    """
    import asyncpg
    import os
    
    logger.info(f"[CLEANUP] Cleaning search logs older than {days} days")
    
    async def run_cleanup():
        db_url = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db")
        conn = await asyncpg.connect(db_url)
        
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            result = await conn.execute("""
                DELETE FROM gold.search_logs WHERE created_at < $1
            """, cutoff_date)
            
            deleted_count = int(result.split()[-1]) if result else 0
            
            logger.info(f"[CLEANUP] Deleted {deleted_count} old search logs")
            
            return {"status": "success", "deleted_count": deleted_count}
            
        except Exception as e:
            logger.error(f"[CLEANUP] Failed: {e}")
            return {"status": "failed", "error": str(e)}
        finally:
            await conn.close()
    
    return asyncio.run(run_cleanup())


@shared_task(name="tasks.maintenance.optimize_indexes")
def optimize_indexes():
    """
    Reindex and optimize database indexes
    """
    import asyncpg
    import os
    
    logger.info("[OPTIMIZE] Starting index optimization")
    
    async def run_optimize():
        db_url = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db")
        conn = await asyncpg.connect(db_url)
        
        try:
            # Reindex main tables
            tables = [
                "gold.documents",
                "gold.users",
                "staging.raw_data"
            ]
            
            for table in tables:
                try:
                    await conn.execute(f"REINDEX TABLE {table}")
                    logger.info(f"[OPTIMIZE] Reindexed {table}")
                except Exception as e:
                    logger.warning(f"[OPTIMIZE] Failed to reindex {table}: {e}")
            
            # Analyze for query planner
            await conn.execute("ANALYZE")
            
            return {"status": "success", "tables_optimized": len(tables)}
            
        except Exception as e:
            logger.error(f"[OPTIMIZE] Failed: {e}")
            return {"status": "failed", "error": str(e)}
        finally:
            await conn.close()
    
    return asyncio.run(run_optimize())
