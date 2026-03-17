"""Стан/пам’ять: Neo4j + Qdrant (реальні клієнти з fallback)."""
from __future__ import annotations

import os
import json
try:
    from neo4j import GraphDatabase
except ImportError:
    GraphDatabase = None
try:
    from qdrant_client import QdrantClient, models
except ImportError:
    QdrantClient = None

class StateStore:
    def __init__(self) -> None:
        self.neo4j_uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
        self.neo4j_user = os.environ.get("NEO4J_USER", "neo4j")
        self.neo4j_pass = os.environ.get("NEO4J_PASSWORD", "test")
        self.qdrant_url = os.environ.get("QDRANT_URL", "http://localhost:6333")
        self.qdrant_api_key = os.environ.get("QDRANT_API_KEY")
        self.neo4j_driver = None
        self.qdrant_client = None

    async def connect(self) -> None:
        if GraphDatabase:
            self.neo4j_driver = GraphDatabase.driver(
                self.neo4j_uri,
                auth=(self.neo4j_user, self.neo4j_pass)
            )
            print("[STATE] Neo4j підключено")
        else:
            print("[STATE] Neo4j клієнт не встановлено")
        if QdrantClient:
            self.qdrant_client = QdrantClient(url=self.qdrant_url, api_key=self.qdrant_api_key)
            print("[STATE] Qdrant підключено")
        else:
            print("[STATE] Qdrant клієнт не встановлено")

    async def fetch_context(self, key: str) -> str:
        if self.neo4j_driver:
            with self.neo4j_driver.session() as sess:
                result = sess.run("MATCH (n {id: $id}) RETURN n", id=key)
                rec = result.single()
                if rec:
                    return json.dumps(rec["n"].properties, ensure_ascii=False)
        if self.qdrant_client:
            try:
                points = self.qdrant_client.retrieve(
                    collection_name="mcp_context",
                    ids=[key],
                    with_payload=True
                )
                if points:
                    return json.dumps(points[0].payload, ensure_ascii=False)
            except Exception as e:
                print(f"[STATE] Qdrant помилка: {e}")
        return f"{{'context': 'placeholder for {key}'}}"

    async def update_context(self, key: str, data: dict) -> None:
        payload = json.dumps(data, ensure_ascii=False)
        if self.neo4j_driver:
            with self.neo4j_driver.session() as sess:
                sess.run("MERGE (n {id: $id}) SET n += $props", id=key, props=data)
                print(f"[STATE] Neo4j оновлено {key}")
        if self.qdrant_client:
            try:
                self.qdrant_client.upsert(
                    collection_name="mcp_context",
                    points=[models.PointStruct(id=key, payload=data)]
                )
                print(f"[STATE] Qdrant оновлено {key}")
            except Exception as e:
                print(f"[STATE] Qdrant помилка: {e}")
        print(f"[STATE] Оновлено {key} даними: {payload}")
