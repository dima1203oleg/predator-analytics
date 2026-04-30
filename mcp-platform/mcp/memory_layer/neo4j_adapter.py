"""Neo4j adapter для управління графом залежностей."""
from __future__ import annotations

from typing import Any, Optional


class Neo4jError(Exception):
    """Базова помилка для Neo4j операцій."""

    pass


class Neo4jAdapter:
    """Adapter для Neo4j graph database."""

    def __init__(
        self,
        uri: str = "bolt://localhost:7687",
        auth: tuple[str, str] = ("neo4j", "password"),
    ) -> None:
        """Ініціалізувати Neo4j adapter.

        Args:
            uri: Connection URI (bolt://host:port)
            auth: Кортеж (username, password)
        """
        self.uri = uri
        self.auth = auth
        self.driver = None
        self._is_connected = False

    async def connect(self) -> bool:
        """Підключитися до Neo4j."""
        try:
            from neo4j import AsyncGraphDatabase

            self.driver = AsyncGraphDatabase.driver(self.uri, auth=self.auth)
            self._is_connected = True
            return True
        except ImportError:
            raise Neo4jError("neo4j-python-driver не встановлено")
        except Exception as e:
            raise Neo4jError(f"Помилка підключення: {str(e)}") from e

    async def disconnect(self) -> bool:
        """Відключитися від Neo4j."""
        if self.driver:
            await self.driver.close()
            self._is_connected = False
        return True

    async def create_node(
        self,
        label: str,
        properties: dict[str, Any],
    ) -> dict[str, Any]:
        """Створити вузол.

        Args:
            label: Label вузла (Entity, Code, File, etc)
            properties: Словник властивостей

        Returns:
            Дані створеного вузла
        """
        if not self._is_connected:
            await self.connect()

        try:
            async with self.driver.session() as session:
                query = f"""
                CREATE (n:{label} $props)
                RETURN n
                """
                result = await session.run(query, props=properties)
                records = await result.data()
                return records[0]["n"] if records else {}
        except Exception as e:
            raise Neo4jError(f"Помилка створення вузла: {str(e)}") from e

    async def create_relationship(
        self,
        source_id: str,
        target_id: str,
        relationship_type: str,
        properties: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """Створити ребро між вузлами.

        Args:
            source_id: ID початкового вузла
            target_id: ID цільового вузла
            relationship_type: Тип ребра
            properties: Властивості ребра

        Returns:
            Дані створеного ребра
        """
        if not self._is_connected:
            await self.connect()

        try:
            async with self.driver.session() as session:
                query = f"""
                MATCH (a {{id: $source_id}}), (b {{id: $target_id}})
                CREATE (a)-[r:{relationship_type} $props]->(b)
                RETURN r
                """
                result = await session.run(
                    query,
                    source_id=source_id,
                    target_id=target_id,
                    props=properties or {},
                )
                records = await result.data()
                return records[0]["r"] if records else {}
        except Exception as e:
            raise Neo4jError(f"Помилка створення ребра: {str(e)}") from e

    async def get_neighbors(
        self,
        node_id: str,
        depth: int = 1,
    ) -> dict[str, Any]:
        """Отримати сусідні вузли.

        Args:
            node_id: ID вузла
            depth: Глибина пошуку

        Returns:
            Словник з вузлами та ребрами
        """
        if not self._is_connected:
            await self.connect()

        try:
            async with self.driver.session() as session:
                query = f"""
                MATCH (n {{id: $node_id}})-[r*0..{depth}]-(m)
                RETURN n, COLLECT(DISTINCT m) as neighbors, COLLECT(DISTINCT r) as edges
                """
                result = await session.run(query, node_id=node_id)
                records = await result.data()
                return records[0] if records else {}
        except Exception as e:
            raise Neo4jError(f"Помилка отримання сусідів: {str(e)}") from e

    async def find_shortest_path(
        self,
        source_id: str,
        target_id: str,
    ) -> list[dict[str, Any]]:
        """Знайти найкоротший шлях.

        Args:
            source_id: ID початкового вузла
            target_id: ID цільового вузла

        Returns:
            Список вузлів на шляху
        """
        if not self._is_connected:
            await self.connect()

        try:
            async with self.driver.session() as session:
                query = """
                MATCH path = shortestPath(
                    (a {id: $source_id})-[*]->(b {id: $target_id})
                )
                RETURN [node in nodes(path) | node {.id, .name}] as path
                """
                result = await session.run(
                    query,
                    source_id=source_id,
                    target_id=target_id,
                )
                records = await result.data()
                return records[0]["path"] if records else []
        except Exception as e:
            raise Neo4jError(f"Помилка пошуку шляху: {str(e)}") from e

    async def query(self, cypher: str, **params: Any) -> list[dict[str, Any]]:
        """Виконати произвільний Cypher запит.

        Args:
            cypher: Cypher запит
            **params: Параметри запиту

        Returns:
            Результати запиту
        """
        if not self._is_connected:
            await self.connect()

        try:
            async with self.driver.session() as session:
                result = await session.run(cypher, **params)
                return await result.data()
        except Exception as e:
            raise Neo4jError(f"Помилка виконання запиту: {str(e)}") from e

    async def clear_all(self) -> bool:
        """Видалити всі вузли та ребра."""
        if not self._is_connected:
            await self.connect()

        try:
            async with self.driver.session() as session:
                await session.run("MATCH (n) DETACH DELETE n")
            return True
        except Exception as e:
            raise Neo4jError(f"Помилка очищення: {str(e)}") from e

    async def get_stats(self) -> dict[str, Any]:
        """Отримати статистику графу."""
        if not self._is_connected:
            await self.connect()

        try:
            async with self.driver.session() as session:
                nodes_result = await session.run("MATCH (n) RETURN count(n) as count")
                nodes_records = await nodes_result.data()
                node_count = nodes_records[0]["count"] if nodes_records else 0

                edges_result = await session.run("MATCH ()-[r]->() RETURN count(r) as count")
                edges_records = await edges_result.data()
                edge_count = edges_records[0]["count"] if edges_records else 0

                return {
                    "nodes": node_count,
                    "edges": edge_count,
                    "connected": self._is_connected,
                }
        except Exception as e:
            return {"error": str(e)}
