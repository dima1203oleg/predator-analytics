"""Memory Layer: Graph Storage (Neo4j) та Vector DB (Qdrant).

Модуль забезпечує:
- Зберігання залежностей та взаємозв'язків у Neo4j
- Семантичні вектори в Qdrant
- Контекстний пошук та retrieval
"""
from __future__ import annotations

from typing import Any, Optional

from mcp.memory_layer.neo4j_adapter import Neo4jAdapter
from mcp.memory_layer.qdrant_adapter import QdrantAdapter


class MemoryError(Exception):
    """Базова помилка для Memory Layer операцій."""

    pass


class MemoryManager:
    """Менеджер для управління Graph та Vector пам'яттю."""

    def __init__(
        self,
        neo4j_uri: str = "bolt://localhost:7687",
        neo4j_auth: tuple[str, str] = ("neo4j", "password"),
        qdrant_url: str = "http://localhost:6333",
        qdrant_collection: str = "predator_vectors",
    ) -> None:
        """Ініціалізувати Memory Manager.

        Args:
            neo4j_uri: URI для Neo4j сервера
            neo4j_auth: Кортеж (username, password)
            qdrant_url: URL Qdrant сервера
            qdrant_collection: Назва колекції у Qdrant
        """
        self.neo4j = Neo4jAdapter(neo4j_uri, neo4j_auth)
        self.qdrant = QdrantAdapter(qdrant_url, qdrant_collection)

    async def store_dependency_graph(
        self,
        nodes: list[dict[str, Any]],
        edges: list[dict[str, Any]],
    ) -> bool:
        """Зберегти граф залежностей у Neo4j.

        Args:
            nodes: Список вузлів {id, type, name, properties}
            edges: Список ребер {source, target, type, properties}

        Returns:
            True якщо успішно
        """
        try:
            # Створити вузли
            for node in nodes:
                await self.neo4j.create_node(
                    label=node.get("type", "Entity"),
                    properties={
                        "id": node["id"],
                        "name": node.get("name", ""),
                        **node.get("properties", {}),
                    },
                )

            # Створити ребра
            for edge in edges:
                await self.neo4j.create_relationship(
                    source_id=edge["source"],
                    target_id=edge["target"],
                    relationship_type=edge.get("type", "CONNECTS_TO"),
                    properties=edge.get("properties", {}),
                )

            return True
        except Exception as e:
            raise MemoryError(f"Помилка при збереженні графу: {str(e)}") from e

    async def search_context(
        self,
        query: str,
        k: int = 5,
        include_graph: bool = True,
    ) -> dict[str, Any]:
        """Пошук контексту через вектори та граф.

        Args:
            query: Текстовий запит
            k: Кількість результатів
            include_graph: Чи включати граф контекст

        Returns:
            Словник з результатами пошуку
        """
        try:
            # Пошук у векторній БД
            vector_results = await self.qdrant.search(query, k)

            context = {
                "vector_results": vector_results,
                "graph_context": None,
            }

            if include_graph and vector_results:
                # Отримати пов'язаний контекст з графу
                first_result = vector_results[0]
                graph_context = await self.neo4j.get_neighbors(
                    node_id=first_result.get("id"),
                    depth=2,
                )
                context["graph_context"] = graph_context

            return context
        except Exception as e:
            raise MemoryError(f"Помилка пошуку контексту: {str(e)}") from e

    async def store_code_embedding(
        self,
        code_id: str,
        code: str,
        metadata: Optional[dict[str, Any]] = None,
    ) -> bool:
        """Зберегти вектор коду.

        Args:
            code_id: Унікальний ID коду
            code: Текст коду
            metadata: Додаткові метадані

        Returns:
            True якщо успішно
        """
        try:
            # Генеруємо embedding (буде імплементовано з LLM)
            vector = await self._generate_embedding(code)

            return await self.qdrant.upsert(
                vector_id=code_id,
                vector=vector,
                payload={
                    "code": code,
                    "type": "code",
                    **(metadata or {}),
                },
            )
        except Exception as e:
            raise MemoryError(f"Помилка збереження embedding: {str(e)}") from e

    async def _generate_embedding(self, text: str) -> list[float]:
        """Генеруємо embedding для тексту.

        Args:
            text: Текст для embedding

        Returns:
            Вектор embedding
        """
        # TODO: Імплементувати з ollama/sentence-transformers
        # На теперішній час повертаємо mock вектор
        return [0.0] * 384  # 384-d вектор

    async def get_relationship_path(
        self,
        source_id: str,
        target_id: str,
    ) -> list[dict[str, Any]]:
        """Знайти шлях між двома вузлами.

        Args:
            source_id: ID початкового вузла
            target_id: ID цільового вузла

        Returns:
            Список вузлів на найкоротшому шляху
        """
        try:
            return await self.neo4j.find_shortest_path(source_id, target_id)
        except Exception as e:
            raise MemoryError(f"Помилка пошуку шляху: {str(e)}") from e

    async def clear_memory(self) -> bool:
        """Очистити всю пам'ять."""
        try:
            await self.neo4j.clear_all()
            await self.qdrant.clear_collection()
            return True
        except Exception as e:
            raise MemoryError(f"Помилка очищення пам'яті: {str(e)}") from e

    async def get_memory_stats(self) -> dict[str, Any]:
        """Отримати статистику пам'яті."""
        return {
            "neo4j": await self.neo4j.get_stats(),
            "qdrant": await self.qdrant.get_stats(),
        }
