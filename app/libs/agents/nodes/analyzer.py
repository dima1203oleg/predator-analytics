from __future__ import annotations


"""E2E Analyzer Node - Executes multi-database analysis and generates cases
Part of Predator Analytics v45.1 Agent System.
"""
import asyncio
import logging
import time
from typing import Any
import uuid

from app.libs.agents.state import AgentState, AnalysisResult, CaseTemplate, QueryResult


logger = logging.getLogger("agents.analyzer")


async def analyzer_node(state: AgentState) -> dict[str, Any]:
    """E2E Analysis Node - Queries all databases and generates insights.

    Pipeline:
    1. Identify data sources from context
    2. Execute parallel queries across PostgreSQL, OpenSearch, Qdrant
    3. Fuse results using semantic analysis
    4. Detect anomalies and patterns
    5. Generate case templates for findings
    """
    logger.info("🔍 E2E Analyzer Node: Starting multi-database analysis")

    start_time = time.time()
    updates = []

    try:
        query = state.get("context", {}).get("query", "")
        tenant_id = state.get("session", {}).get("tenant_id", "default")

        if not query:
            # Extract query from last user message
            messages = state.get("messages", [])
            for msg in reversed(messages):
                if msg.get("role") == "user":
                    query = msg.get("content", "")
                    break

        updates.append(f"📝 Отримано запит: {query[:50]}...")

        # 1. Query all databases in parallel
        query_results = await _execute_multi_db_query(query, tenant_id)
        updates.append(f"✅ Отримано результати з {len(query_results)} баз даних")

        # 2. Analyze and fuse results
        analysis_results = await _analyze_results(query_results, query)
        updates.append(f"🧠 Знайдено {len(analysis_results)} аналітичних знахідок")

        # 3. Generate cases if significant findings
        generated_cases = []
        for result in analysis_results:
            if result.get("confidence", 0) > 0.7:
                case = await _generate_case_from_analysis(result)
                if case:
                    generated_cases.append(case)

        if generated_cases:
            updates.append(f"📋 Створено {len(generated_cases)} кейсів")

        # 4. Prepare fusion summary
        fusion_results = {
            "query": query,
            "databases_queried": list(query_results.keys()),
            "total_records": sum(len(r.get("results", [])) for r in query_results.values()),
            "analysis_count": len(analysis_results),
            "cases_generated": len(generated_cases),
            "execution_time_ms": (time.time() - start_time) * 1000,
        }

        updates.append(f"✨ Аналіз завершено за {fusion_results['execution_time_ms']:.0f}мс")

        return {
            "query_results": query_results,
            "analysis_results": analysis_results,
            "generated_cases": generated_cases,
            "fusion_results": fusion_results,
            "stream_updates": updates,
            "processing_stats": {
                "analyzer_execution_ms": fusion_results["execution_time_ms"],
                "databases_count": len(query_results),
                "findings_count": len(analysis_results),
            },
        }

    except Exception as e:
        logger.exception(f"E2E Analyzer failed: {e}")
        return {"error": f"Помилка аналізу: {e!s}", "stream_updates": [*updates, f"❌ Помилка: {e!s}"]}


async def _execute_multi_db_query(query: str, tenant_id: str) -> dict[str, QueryResult]:
    """Execute query across all databases in parallel."""
    results = {}

    async def query_postgres():
        try:
            from sqlalchemy import text

            from app.libs.core.database import get_db_ctx

            start = time.time()
            async with get_db_ctx() as db:
                # Full-text search in PostgreSQL using pg_trgm
                result = await db.execute(
                    text("""
                    SELECT id, title, content, source_type, created_at
                    FROM gold.documents
                    WHERE similarity(content, :query) > 0.1
                    ORDER BY similarity(content, :query) DESC
                    LIMIT 20
                """),
                    {"query": query},
                )
                rows = result.fetchall()

                return QueryResult(
                    database="postgresql",
                    query=query,
                    results=[dict(r._mapping) for r in rows] if rows else [],
                    execution_time_ms=(time.time() - start) * 1000,
                    error=None,
                )
        except Exception as e:
            logger.warning(f"PostgreSQL query failed: {e}")
            return QueryResult(database="postgresql", query=query, results=[], execution_time_ms=0, error=str(e))

    async def query_opensearch():
        try:
            from app.services.opensearch_indexer import OpenSearchIndexer

            start = time.time()
            indexer = OpenSearchIndexer()

            response = await indexer.search(index_name="documents_safe", query=query, size=20, tenant_id=tenant_id)

            hits = response.get("hits", {}).get("hits", [])

            await indexer.close()

            return QueryResult(
                database="opensearch",
                query=query,
                results=[{"id": h["_id"], **h["_source"]} for h in hits],
                execution_time_ms=(time.time() - start) * 1000,
                error=None,
            )
        except Exception as e:
            logger.warning(f"OpenSearch query failed: {e}")
            return QueryResult(database="opensearch", query=query, results=[], execution_time_ms=0, error=str(e))

    async def query_qdrant():
        try:
            from app.services.embedding_service import EmbeddingService
            from app.services.qdrant_service import QdrantService

            start = time.time()
            qdrant = QdrantService()
            embedder = EmbeddingService()

            # Generate embedding for semantic search
            query_vector = await embedder.generate_embedding_async(query)

            hits = await qdrant.search(query_vector=query_vector, limit=20, tenant_id=tenant_id)

            return QueryResult(
                database="qdrant", query=query, results=hits, execution_time_ms=(time.time() - start) * 1000, error=None
            )
        except Exception as e:
            logger.warning(f"Qdrant query failed: {e}")
            return QueryResult(database="qdrant", query=query, results=[], execution_time_ms=0, error=str(e))

    # Execute all queries in parallel
    pg_result, os_result, qd_result = await asyncio.gather(query_postgres(), query_opensearch(), query_qdrant())

    results["postgresql"] = pg_result
    results["opensearch"] = os_result
    results["qdrant"] = qd_result

    return results


async def _analyze_results(query_results: dict[str, QueryResult], query: str) -> list[AnalysisResult]:
    """Analyze and cross-reference results from all databases."""
    analysis = []

    all_results = []
    for db_name, qr in query_results.items():
        for item in qr.get("results", []):
            all_results.append({"source_db": db_name, **item})

    if not all_results:
        return []

    # 1. Count frequency of patterns
    pattern_counts = {}
    for item in all_results:
        # Extract patterns (simplified - real impl would use NLP)
        content = str(item.get("content", "") or item.get("snippet", "") or "")
        words = content.lower().split()[:20]
        for word in words:
            if len(word) > 4:
                pattern_counts[word] = pattern_counts.get(word, 0) + 1

    # 2. Identify high-frequency patterns as potential findings
    high_freq = [(k, v) for k, v in pattern_counts.items() if v > 2]
    high_freq.sort(key=lambda x: -x[1])

    for pattern, count in high_freq[:5]:
        analysis.append(
            AnalysisResult(
                id=str(uuid.uuid4()),
                type="pattern",
                confidence=min(0.5 + count * 0.1, 0.95),
                description=f"Виявлено повторюваний патерн: '{pattern}' ({count} входжень)",
                data_points=[{"pattern": pattern, "count": count}],
                recommendations=[
                    f"Перевірити контекст використання '{pattern}'",
                    "Провести додатковий аналіз пов'язаних записів",
                ],
            )
        )

    # 3. Check for anomalies (high values, unusual distributions)
    for item in all_results[:10]:
        # Check for high monetary values
        content = str(item.get("content", "") or item.get("snippet", ""))
        if any(kw in content.lower() for kw in ["$", "usd", "eur", "грн"]):
            # Extract numbers
            import re

            numbers = re.findall(r"[\d,]+(?:\.\d+)?", content)
            for num_str in numbers:
                try:
                    num = float(num_str.replace(",", ""))
                    if num > 100000:  # High value threshold
                        analysis.append(
                            AnalysisResult(
                                id=str(uuid.uuid4()),
                                type="anomaly",
                                confidence=0.75,
                                description=f"Виявлено операцію з високою вартістю: {num:,.0f}",
                                data_points=[item],
                                recommendations=[
                                    "Перевірити джерело та легітимність транзакції",
                                    "Порівняти з типовими операціями в цьому секторі",
                                ],
                            )
                        )
                        break
                except:
                    pass

    return analysis


async def _generate_case_from_analysis(result: AnalysisResult) -> CaseTemplate:
    """Generate a case template from analysis result."""
    risk_score = int(result.get("confidence", 0.5) * 100)

    if risk_score >= 80:
        status = "КРИТИЧНО"
    elif risk_score >= 50:
        status = "УВАГА"
    else:
        status = "БЕЗПЕЧНО"

    return CaseTemplate(
        title=f"Аналіз: {result.get('type', 'unknown').upper()}",
        situation=result.get("description", "Виявлено підозрілу активність"),
        conclusion=f"Автоматичний аналіз виявив патерн з впевненістю {result.get('confidence', 0) * 100:.0f}%",
        status=status,
        risk_score=risk_score,
        sector="BIZ",  # Default sector
        evidence=result.get("data_points", []),
        ai_insight=". ".join(result.get("recommendations", [])),
    )
