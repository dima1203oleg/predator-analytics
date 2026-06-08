"""Інтеграція з Neo4j для графової аналітики.

Модуль для створення графів власності, фрод-ланцюжків, multi-hop аналізу.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
import os
from typing import Any

from neo4j import GraphDatabase

logger = logging.getLogger(__name__)


@dataclass
class Neo4jConfig:
    """Конфігурація Neo4j."""

    uri: str = "bolt://localhost:7687"
    user: str = "neo4j"
    password: str = "neo4j"


class Neo4jIntegration:
    """Інтеграція з Neo4j."""

    def __init__(self, config: Neo4jConfig):
        self.config = config
        self.driver = GraphDatabase.driver(
            config.uri,
            auth=(config.user, config.password)
        )

    def create_constraints(self):
        """Створити constraints для оптимізації."""
        constraints = [
            "CREATE CONSTRAINT IF NOT EXISTS FOR (c:Company) REQUIRE c.ueid IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (p:Person) REQUIRE p.ueid IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (d:Declaration) REQUIRE d.id IS UNIQUE",
            "CREATE INDEX IF NOT EXISTS FOR (c:Company) ON (c.edrpou)",
            "CREATE INDEX IF NOT EXISTS FOR (d:Declaration) ON (d.declaration_date)",
        ]

        with self.driver.session() as session:
            for constraint in constraints:
                try:
                    session.run(constraint)
                    logger.info(f"Constraint створено: {constraint}")
                except Exception as e:
                    logger.warning(f"Constraint може вже існувати: {e}")

    def create_company_node(self, ueid: str, edrpou: str | None = None, name: str | None = None) -> int:
        """Створити вузол компанії.
        
        Args:
            ueid: UEID компанії
            edrpou: ЄДРПОУ
            name: Назва компанії
            
        Returns:
            Кількість створених вузлів

        """
        with self.driver.session() as session:
            query = """
            MERGE (c:Company {ueid: $ueid})
            SET c.edrpou = $edrpou, c.name = $name, c.updated_at = datetime()
            RETURN c
            """

            result = session.run(
                query,
                ueid=ueid,
                edrpou=edrpou,
                name=name
            )

            logger.debug(f"Створено вузол компанії: {ueid}")
            return 1

    def create_declaration_node(self, declaration_data: dict[str, Any]) -> int:
        """Створити вузол декларації.
        
        Args:
            declaration_data: Дані декларації
            
        Returns:
            Кількість створених вузлів

        """
        with self.driver.session() as session:
            query = """
            MERGE (d:Declaration {id: $id})
            SET d.declaration_number = $declaration_number,
                d.declaration_date = $declaration_date,
                d.uktzed_code = $uktzed_code,
                d.value_usd = $value_usd,
                d.weight_kg = $weight_kg,
                d.origin_country = $origin_country,
                d.customs_post = $customs_post,
                d.updated_at = datetime()
            RETURN d
            """

            result = session.run(
                query,
                id=str(declaration_data.get('id')),
                declaration_number=declaration_data.get('declaration_number'),
                declaration_date=declaration_data.get('declaration_date'),
                uktzed_code=declaration_data.get('uktzed_code'),
                value_usd=declaration_data.get('value_usd'),
                weight_kg=declaration_data.get('weight_kg'),
                origin_country=declaration_data.get('origin_country'),
                customs_post=declaration_data.get('customs_post'),
            )

            logger.debug(f"Створено вузол декларації: {declaration_data.get('id')}")
            return 1

    def create_imported_relationship(self, company_ueid: str, declaration_id: str) -> int:
        """Створити зв'язок імпорту між компанією та декларацією.
        
        Args:
            company_ueid: UEID компанії
            declaration_id: ID декларації
            
        Returns:
            Кількість створених зв'язків

        """
        with self.driver.session() as session:
            query = """
            MATCH (c:Company {ueid: $company_ueid})
            MATCH (d:Declaration {id: $declaration_id})
            MERGE (c)-[r:IMPORTED]->(d)
            SET r.created_at = datetime()
            RETURN r
            """

            result = session.run(
                query,
                company_ueid=company_ueid,
                declaration_id=str(declaration_id)
            )

            logger.debug(f"Створено зв'язок імпорту: {company_ueid} -> {declaration_id}")
            return 1

    def create_exported_relationship(self, exporter_name: str, declaration_id: str) -> int:
        """Створити зв'язок експорту між експортером та декларацією.
        
        Args:
            exporter_name: Назва експортера
            declaration_id: ID декларації
            
        Returns:
            Кількість створених зв'язків

        """
        with self.driver.session() as session:
            query = """
            MERGE (e:Exporter {name: $exporter_name})
            MATCH (d:Declaration {id: $declaration_id})
            MERGE (e)-[r:EXPORTED]->(d)
            SET r.created_at = datetime()
            RETURN r
            """

            result = session.run(
                query,
                exporter_name=exporter_name,
                declaration_id=str(declaration_id)
            )

            logger.debug(f"Створено зв'язок експорту: {exporter_name} -> {declaration_id}")
            return 1

    def process_declaration_graph(self, declaration_data: dict[str, Any]) -> tuple[int, int]:
        """Обробити декларацію та створити граф.
        
        Args:
            declaration_data: Дані декларації
            
        Returns:
            Кількість вузлів, кількість зв'язків

        """
        nodes = 0
        relationships = 0

        # Створити вузол декларації
        nodes += self.create_declaration_node(declaration_data)

        # Створити вузол компанії-імпортера
        importer_ueid = declaration_data.get('importer_ueid')
        if importer_ueid:
            nodes += self.create_company_node(
                ueid=importer_ueid,
                edrpou=declaration_data.get('importer_edrpou'),
            )
            # Створити зв'язок імпорту
            relationships += self.create_imported_relationship(
                importer_ueid,
                declaration_data.get('id')
            )

        # Створити вузол експортера та зв'язок
        exporter_name = declaration_data.get('exporter_name')
        if exporter_name:
            relationships += self.create_exported_relationship(
                exporter_name,
                declaration_data.get('id')
            )

        return nodes, relationships

    def find_company_connections(self, company_ueid: str, max_depth: int = 3) -> list[dict[str, Any]]:
        """Знайти зв'язки компанії в графі.
        
        Args:
            company_ueid: UEID компанії
            max_depth: Максимальна глибина пошуку
            
        Returns:
            Список зв'язків

        """
        with self.driver.session() as session:
            query = f"""
            MATCH path = (c:Company {{ueid: $ueid}})-[*1..{max_depth}]-(other:Company)
            RETURN path
            LIMIT 100
            """

            result = session.run(query, ueid=company_ueid)

            connections = []
            for record in result:
                path = record["path"]
                connections.append({
                    "nodes": [node["ueid"] for node in path.nodes],
                    "relationships": [rel.type for rel in path.relationships]
                })

            return connections

    def close(self):
        """Закрити з'єднання з Neo4j."""
        self.driver.close()
        logger.info("З'єднання з Neo4j закрито")


def get_neo4j_integration(config: Neo4jConfig | None = None) -> Neo4jIntegration:
    """Отримати інстанс інтеграції з Neo4j."""
    if config is None:
        config = Neo4jConfig(
            uri=os.getenv("NEO4J_URI", "bolt://localhost:7687"),
            user=os.getenv("NEO4J_USER", "neo4j"),
            password=os.getenv("NEO4J_PASSWORD", "neo4j"),
        )
    return Neo4jIntegration(config)
