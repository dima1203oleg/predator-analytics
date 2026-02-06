from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

from neo4j import AsyncGraphDatabase, GraphDatabase


logger = logging.getLogger("predator.core.graph")

class Neo4jGraph:
    """Neo4j Graph Database Manager (Serious Mode v1.0)
    Implements Section 5.3: Graph DB Schema and Relationships.
    """

    def __init__(self, uri: str | None = None, user: str | None = None, password: str | None = None):
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://neo4j:7687")
        self.user = user or os.getenv("NEO4J_USER", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD", "666666")
        self._driver = AsyncGraphDatabase.driver(self.uri, auth=(self.user, self.password))

    async def close(self):
        await self._driver.close()

    async def sync_company(self, name: str, code: str, country: str = "UA") -> str:
        """Create or update a Company node."""
        async with self._driver.session() as session:
            result = await session.execute_write(
                self._merge_company, name, code, country
            )
            return result

    @staticmethod
    async def _merge_company(tx, name, code, country):
        query = """
        MERGE (c:Company {code: $code})
        SET c.name = $name, c.country = $country, c.updated_at = datetime()
        RETURN c.code
        """
        result = await tx.run(query, code=code, name=name, country=country)
        record = await result.single()
        return record[0]

    async def sync_declaration(self, decl_data: dict[str, Any]):
        """Create Declaration node and link to participants and goods."""
        async with self._driver.session() as session:
            await session.execute_write(self._merge_declaration_complex, decl_data)

    @staticmethod
    async def _merge_declaration_complex(tx, data):
        # 1. Merge Declaration
        query = """
        MERGE (d:Declaration {number: $number})
        SET d.date = date($date),
            d.regime = $regime,
            d.total_value = $value,
            d.currency = $currency,
            d.updated_at = datetime()

        // 2. Link to Customs Office
        MERGE (co:CustomsOffice {name: $office})
        MERGE (d)-[:FILED_AT]->(co)

        // 3. Link Participants
        WITH d
        UNWIND $participants as p
        MERGE (c:Company {code: p.code})
        SET c.name = p.name

        // Dynamic Relationship creation
        WITH d, c, p
        CALL apoc.merge.relationship(c, p.role, {}, {}, d, {}) YIELD rel

        RETURN d.number
        """
        # Note: apoc is needed for dynamic relationship types, or use CASE/conditional
        await tx.run(query,
            number=data['number'],
            date=data['date'],
            regime=data['regime'],
            value=data['value'],
            currency=data['currency'],
            office=data['office'],
            participants=data['participants']
        )

    async def link_telegram_post(self, post_id: str, content: str, mentions: list[dict[str, str]]):
        """Link a Telegram post to entities in the graph."""
        async with self._driver.session() as session:
            query = """
            MERGE (p:TelegramPost {id: $id})
            SET p.content = $content, p.created_at = datetime()
            WITH p
            UNWIND $mentions as m
            MATCH (e) WHERE m.label IN labels(e) AND (e.code = m.key OR e.number = m.key)
            MERGE (p)-[r:MENTIONS]->(e)
            SET r.type = m.type
            """
            await session.run(query, id=post_id, content=content, mentions=mentions)

# Singleton
graph_db = Neo4jGraph()
