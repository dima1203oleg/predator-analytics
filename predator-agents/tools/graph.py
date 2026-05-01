"""
Predator Agents OS — Graph Tools
Інструменти для взаємодії з Neo4j.
"""

import os
from neo4j import GraphDatabase
from typing import List, Dict, Any

class GraphTools:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URL", "bolt://194.177.1.240:7687")
        self.user = "neo4j"
        self.password = os.getenv("NEO4J_PASSWORD", "predator_password")
        self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))

    def close(self):
        self.driver.close()

    def query(self, cypher: str, parameters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Виконує Cypher-запит до Neo4j.
        """
        with self.driver.session() as session:
            result = session.run(cypher, parameters)
            return [record.data() for record in result]

    def get_company_connections(self, ueid: str) -> List[Dict[str, Any]]:
        """
        Знаходить усіх пов'язаних контрагентів для компанії за її ЄДРПОУ (ueid).
        """
        cypher = """
        MATCH (c:Company {ueid: $ueid})-[r]-(connected)
        RETURN c.name as source, type(r) as relationship, connected.name as target
        LIMIT 50
        """
        return self.query(cypher, {"ueid": ueid})
