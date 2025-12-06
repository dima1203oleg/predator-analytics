"""
Stats Router - TS-Compliant Analytics Endpoints
Provides statistics on ingestion, search, and system health
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import os
import asyncpg
import logging

logger = logging.getLogger("router.stats")

router = APIRouter(prefix="/stats", tags=["Analytics & Statistics"])

DB_URL = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db")


async def get_db_connection():
    """Get database connection"""
    return await asyncpg.connect(DB_URL)


# ============================================================================
# INGESTION STATISTICS
# ============================================================================

@router.get("/ingestion")
async def get_ingestion_stats(
    days: int = Query(7, ge=1, le=365, description="Number of days to look back")
):
    """
    Get data ingestion statistics.
    
    Returns:
        - Total documents in staging vs gold
        - Documents added in last N days
        - Last ingestion timestamp
        - Ingestion success rate
    """
    conn = await get_db_connection()
    
    try:
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Staging stats
        staging_total = await conn.fetchval("SELECT COUNT(*) FROM staging.raw_data")
        staging_unprocessed = await conn.fetchval(
            "SELECT COUNT(*) FROM staging.raw_data WHERE processed = FALSE"
        )
        staging_recent = await conn.fetchval(
            "SELECT COUNT(*) FROM staging.raw_data WHERE fetched_at > $1",
            cutoff_date
        )
        
        # Gold stats
        gold_total = await conn.fetchval("SELECT COUNT(*) FROM gold.documents")
        gold_recent = await conn.fetchval(
            "SELECT COUNT(*) FROM gold.documents WHERE created_at > $1",
            cutoff_date
        )
        
        # Last ingestion time
        last_ingestion = await conn.fetchval(
            "SELECT MAX(fetched_at) FROM staging.raw_data"
        )
        
        # Ingestion by source
        source_stats = await conn.fetch("""
            SELECT source, COUNT(*) as count, MAX(fetched_at) as last_fetch
            FROM staging.raw_data
            GROUP BY source
            ORDER BY count DESC
        """)
        
        # Calculate success rate
        total_processed = staging_total - staging_unprocessed
        success_rate = (total_processed / staging_total * 100) if staging_total > 0 else 0
        
        return {
            "staging": {
                "total": staging_total or 0,
                "unprocessed": staging_unprocessed or 0,
                "recent": staging_recent or 0,
                "last_ingestion": last_ingestion.isoformat() if last_ingestion else None
            },
            "gold": {
                "total": gold_total or 0,
                "recent": gold_recent or 0
            },
            "success_rate_percent": round(success_rate, 2),
            "by_source": [
                {
                    "source": row["source"],
                    "count": row["count"],
                    "last_fetch": row["last_fetch"].isoformat() if row["last_fetch"] else None
                }
                for row in source_stats
            ],
            "period_days": days
        }
        
    finally:
        await conn.close()


@router.get("/ingestion/timeline")
async def get_ingestion_timeline(
    days: int = Query(30, ge=1, le=365),
    granularity: str = Query("day", regex="^(hour|day|week)$")
):
    """
    Get ingestion timeline for charting.
    
    Returns documents ingested per time period.
    """
    conn = await get_db_connection()
    
    try:
        cutoff_date = datetime.now() - timedelta(days=days)
        
        if granularity == "hour":
            trunc = "hour"
        elif granularity == "week":
            trunc = "week"
        else:
            trunc = "day"
        
        # Staging timeline
        staging_timeline = await conn.fetch(f"""
            SELECT 
                date_trunc('{trunc}', fetched_at) as period,
                COUNT(*) as count
            FROM staging.raw_data
            WHERE fetched_at > $1
            GROUP BY period
            ORDER BY period
        """, cutoff_date)
        
        # Gold timeline
        gold_timeline = await conn.fetch(f"""
            SELECT 
                date_trunc('{trunc}', created_at) as period,
                COUNT(*) as count
            FROM gold.documents
            WHERE created_at > $1
            GROUP BY period
            ORDER BY period
        """, cutoff_date)
        
        return {
            "granularity": granularity,
            "period_days": days,
            "staging": [
                {"period": row["period"].isoformat(), "count": row["count"]}
                for row in staging_timeline
            ],
            "gold": [
                {"period": row["period"].isoformat(), "count": row["count"]}
                for row in gold_timeline
            ]
        }
        
    finally:
        await conn.close()


# ============================================================================
# SEARCH STATISTICS
# ============================================================================

@router.get("/search")
async def get_search_stats(
    days: int = Query(7, ge=1, le=365)
):
    """
    Get search statistics.
    
    Returns:
        - Total searches (if search_logs table exists)
        - Average response time
        - Popular queries
        - Search distribution by type
    """
    # Note: This requires a search_logs table to be created
    # For now, return placeholder data
    
    conn = await get_db_connection()
    
    try:
        # Check if search_logs table exists
        table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'gold' AND table_name = 'search_logs'
            )
        """)
        
        if not table_exists:
            return {
                "message": "Search logging not enabled",
                "hint": "Create gold.search_logs table to enable search statistics",
                "sample_schema": {
                    "id": "SERIAL PRIMARY KEY",
                    "query": "TEXT",
                    "search_type": "VARCHAR(20)",
                    "results_count": "INT",
                    "response_time_ms": "INT",
                    "user_id": "INT",
                    "created_at": "TIMESTAMP DEFAULT NOW()"
                }
            }
        
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Get stats from search_logs
        total_searches = await conn.fetchval(
            "SELECT COUNT(*) FROM gold.search_logs WHERE created_at > $1",
            cutoff_date
        )
        
        avg_response_time = await conn.fetchval(
            "SELECT AVG(response_time_ms) FROM gold.search_logs WHERE created_at > $1",
            cutoff_date
        )
        
        popular_queries = await conn.fetch("""
            SELECT query, COUNT(*) as count
            FROM gold.search_logs
            WHERE created_at > $1
            GROUP BY query
            ORDER BY count DESC
            LIMIT 10
        """, cutoff_date)
        
        by_type = await conn.fetch("""
            SELECT search_type, COUNT(*) as count
            FROM gold.search_logs
            WHERE created_at > $1
            GROUP BY search_type
        """, cutoff_date)
        
        return {
            "total_searches": total_searches or 0,
            "avg_response_time_ms": round(avg_response_time or 0, 2),
            "popular_queries": [
                {"query": row["query"], "count": row["count"]}
                for row in popular_queries
            ],
            "by_type": {row["search_type"]: row["count"] for row in by_type},
            "period_days": days
        }
        
    finally:
        await conn.close()


# ============================================================================
# SYSTEM STATISTICS
# ============================================================================

@router.get("/system")
async def get_system_stats():
    """
    Get overall system statistics.
    
    Returns:
        - Database sizes
        - Table counts
        - Index health
    """
    conn = await get_db_connection()
    
    try:
        # Get table sizes
        table_sizes = await conn.fetch("""
            SELECT 
                schemaname || '.' || relname as table_name,
                pg_size_pretty(pg_total_relation_size(relid)) as total_size,
                n_live_tup as row_count
            FROM pg_stat_user_tables
            WHERE schemaname IN ('staging', 'gold')
            ORDER BY pg_total_relation_size(relid) DESC
        """)
        
        # Get database size
        db_size = await conn.fetchval("""
            SELECT pg_size_pretty(pg_database_size(current_database()))
        """)
        
        # Get index stats
        index_stats = await conn.fetch("""
            SELECT 
                schemaname || '.' || indexrelname as index_name,
                idx_scan as scans,
                idx_tup_read as tuples_read,
                idx_tup_fetch as tuples_fetched
            FROM pg_stat_user_indexes
            WHERE schemaname IN ('staging', 'gold')
            ORDER BY idx_scan DESC
            LIMIT 10
        """)
        
        # Users count
        user_count = await conn.fetchval("SELECT COUNT(*) FROM gold.users")
        
        return {
            "database": {
                "size": db_size,
                "tables": [
                    {
                        "name": row["table_name"],
                        "size": row["total_size"],
                        "rows": row["row_count"]
                    }
                    for row in table_sizes
                ]
            },
            "indexes": [
                {
                    "name": row["index_name"],
                    "scans": row["scans"],
                    "tuples_read": row["tuples_read"]
                }
                for row in index_stats
            ],
            "users": {
                "total": user_count or 0
            }
        }
        
    finally:
        await conn.close()


@router.get("/categories")
async def get_category_stats():
    """
    Get document distribution by category.
    """
    conn = await get_db_connection()
    
    try:
        categories = await conn.fetch("""
            SELECT 
                COALESCE(category, 'uncategorized') as category,
                COUNT(*) as count,
                MAX(created_at) as last_updated
            FROM gold.documents
            GROUP BY category
            ORDER BY count DESC
        """)
        
        return {
            "categories": [
                {
                    "name": row["category"],
                    "count": row["count"],
                    "last_updated": row["last_updated"].isoformat() if row["last_updated"] else None
                }
                for row in categories
            ],
            "total_categories": len(categories)
        }
        
    finally:
        await conn.close()
