import asyncio
from app.database import SessionLocal
from app.core.graph import graph_db

async def main():
    neo4j_query = """
    MATCH (n)
    WHERE coalesce(n.cers, n.risk_score, 0) >= 30
    OPTIONAL MATCH (n)-[r]->(m)
    RETURN n, r, m
    LIMIT 100
    """
    raw_results = await graph_db.run_query(neo4j_query, {})
    print(f"Graph nodes found: {len(raw_results) if raw_results else 0}")
    
asyncio.run(main())
