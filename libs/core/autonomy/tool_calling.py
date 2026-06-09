"""
Tool Calling API для PREDATOR Analytics v56.5-ELITE
Набір жорстко зашитих функцій (Tools), які агент може викликати для виконання специфічних завдань.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from abc import ABC, abstractmethod
from pydantic import BaseModel, Field

logger = logging.getLogger("predator_tool_calling")


class ToolCall(BaseModel):
    """Базовий клас для інструментів агента."""
    name: str
    description: str
    
    @abstractmethod
    async def execute(self, **kwargs) -> Any:
        """Виконання інструмента."""
        pass


class SearchGraphAnomalyTool(ToolCall):
    """
    Пошук аномалій в графі за заданим патерном.
    
    Інструмент для пошуку аномалій в графі за заданим патерном.
    """
    
    name = "search_graph_anomaly"
    description = "Пошук аномалій в графі за заданим патерном (наприклад, 'Бум за ніч', 'Брокер-невидимка')"
    
    pattern: str = Field(description="Назва патерну")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Параметри патерну")
    
    # Мапінг патернів на Cypher запити
    PATTERN_QUERIES = {
        "Бум за ніч": """
            MATCH (c:Company)-[:FILED]->(d:Declaration)
            WITH c, MIN(d.date) AS first_decl_date
            WHERE duration.inDays(date(c.registration_date), date(first_decl_date)).days < {days}
            RETURN c.name, c.registration_date, first_decl_date
        """,
        "Брокер-невидимка": """
            MATCH (b:Broker)-[:PROCESSED]->(d:Declaration)<-[:FILED]-(c:Company)
            WITH b, COUNT(DISTINCT c) AS client_count, COLLECT(DISTINCT c.name) AS clients
            WHERE client_count = 1
            RETURN b.name AS Broker, clients[0] AS Exclusive_Client
        """,
        "Двоє в кімнаті — одна декларація": """
            MATCH (c1:Company)-[:REGISTERED_AT]->(a:Address)<-[:REGISTERED_AT]-(c2:Company)
            WHERE c1.edrpou <> c2.edrpou
            MATCH (c1)-[:FILED]->(:Declaration)-[:CONTAINS]->(p:Product)<-[:CONTAINS]-(:Declaration)<-[:FILED]-(c2)
            RETURN a.full_address, c1.name, c2.name, p.hs_code
        """,
        "Ланцюг прихованого гіганта": """
            MATCH (p:Person)-[:OWNS|DIRECTS]->(c:Company)-[:FILED]->(:Declaration)-[:CONTAINS]->(prod:Product)
            WITH p, prod, COUNT(DISTINCT c) AS shell_companies, SUM(d.total_invoice_value) AS total_empire_value
            WHERE shell_companies >= {min_companies}
            RETURN p.full_name, prod.hs_code, shell_companies, total_empire_value
            ORDER BY total_empire_value DESC
        """
    }
    
    async def execute(self, neo4j_client: Any, **kwargs) -> List[Dict[str, Any]]:
        """
        Виконання пошуку аномалії.
        
        Args:
            neo4j_client: Клієнт Neo4j
            
        Returns:
            list: Результат пошуку аномалії
        """
        
        pattern = self.pattern
        parameters = self.parameters
        
        cypher_query = self.PATTERN_QUERIES.get(pattern)
        if not cypher_query:
            raise ValueError(f"Невідомий патерн: {pattern}")
        
        # Підстановка параметрів
        try:
            formatted_query = cypher_query.format(**parameters)
        except KeyError as e:
            raise ValueError(f"Відсутній параметр для патерну: {e}")
        
        # Виконання запиту
        result = await neo4j_client.execute(formatted_query)
        
        return result


class GetEntityDetailsTool(ToolCall):
    """
    Отримання деталей сутності.
    
    Інструмент для отримання детальної інформації про сутність (компанію, особу, декларацію).
    """
    
    name = "get_entity_details"
    description = "Отримання детальної інформації про сутність (компанію, особу, декларацію)"
    
    entity_type: str = Field(description="Тип сутності (company, person, declaration)")
    entity_id: str = Field(description="ID сутності")
    
    ENTITY_QUERIES = {
        "company": """
            MATCH (c:Company {edrpou: $entity_id})
            OPTIONAL MATCH (c)-[:DIRECTS]-(p:Person)
            OPTIONAL MATCH (c)-[:FILED]->(d:Declaration)
            RETURN c, p, d
        """,
        "person": """
            MATCH (p:Person {inn: $entity_id})
            OPTIONAL MATCH (p)-[:DIRECTS|OWNS]->(c:Company)
            RETURN p, c
        """,
        "declaration": """
            MATCH (d:Declaration {decl_id: $entity_id})
            OPTIONAL MATCH (d)<-[:FILED]-(c:Company)
            OPTIONAL MATCH (d)-[:CONTAINS]->(pr:Product)
            RETURN d, c, pr
        """
    }
    
    async def execute(self, neo4j_client: Any, **kwargs) -> Dict[str, Any]:
        """
        Виконання отримання деталей сутності.
        
        Args:
            neo4j_client: Клієнт Neo4j
            
        Returns:
            dict: Деталі сутності
        """
        
        entity_type = self.entity_type
        entity_id = self.entity_id
        
        cypher_query = self.ENTITY_QUERIES.get(entity_type)
        if not cypher_query:
            raise ValueError(f"Невідомий тип сутності: {entity_type}")
        
        # Виконання запиту
        result = await neo4j_client.execute(cypher_query, {"entity_id": entity_id})
        
        return result


class AnalyzeRiskScoreTool(ToolCall):
    """
    Аналіз ризик-скорингу.
    
    Інструмент для аналізу ризик-скорингу компанії або особи.
    """
    
    name = "analyze_risk_score"
    description = "Аналіз ризик-скорингу компанії або особи"
    
    entity_type: str = Field(description="Тип сутності (company, person)")
    entity_id: str = Field(description="ID сутності")
    
    async def execute(self, postgres_client: Any, **kwargs) -> Dict[str, Any]:
        """
        Виконання аналізу ризик-скорингу.
        
        Args:
            postgres_client: Клієнт PostgreSQL
            
        Returns:
            dict: Ризик-скоринг
        """
        
        entity_type = self.entity_type
        entity_id = self.entity_id
        
        if entity_type == "company":
            query = """
                SELECT * FROM gold.risk_assessments 
                WHERE company_edrpou = $entity_id
                ORDER BY assessed_at DESC 
                LIMIT 1
            """
        elif entity_type == "person":
            query = """
                SELECT * FROM gold.person_risk_assessments 
                WHERE person_inn = $entity_id
                ORDER BY assessed_at DESC 
                LIMIT 1
            """
        else:
            raise ValueError(f"Невідомий тип сутності: {entity_type}")
        
        # Виконання запиту
        result = await postgres_client.execute(query, {"entity_id": entity_id})
        
        return result


class ToolRegistry:
    """
    Реєстр інструментів агента.
    
    Клас для управління доступними інструментами та їх викликом.
    """
    
    def __init__(self):
        """Ініціалізація реєстру інструментів."""
        self.tools: Dict[str, ToolCall] = {}
        self._register_default_tools()
    
    def _register_default_tools(self):
        """Реєстрація стандартних інструментів."""
        self.register(SearchGraphAnomalyTool)
        self.register(GetEntityDetailsTool)
        self.register(AnalyzeRiskScoreTool)
    
    def register(self, tool_class: type[ToolCall]):
        """
        Реєстрація інструмента.
        
        Args:
            tool_class: Клас інструмента
        """
        tool = tool_class()
        self.tools[tool.name] = tool
        logger.info(f"Зареєстровано інструмент: {tool.name}")
    
    def get_tool(self, tool_name: str) -> Optional[ToolCall]:
        """
        Отримання інструмента за назвою.
        
        Args:
            tool_name: Назва інструмента
            
        Returns:
            ToolCall: Інструмент або None
        """
        return self.tools.get(tool_name)
    
    def list_tools(self) -> List[str]:
        """
        Список доступних інструментів.
        
        Returns:
            list: Список назв інструментів
        """
        return list(self.tools.keys())
    
    async def call_tool(
        self, 
        tool_name: str, 
        parameters: Dict[str, Any],
        neo4j_client: Optional[Any] = None,
        postgres_client: Optional[Any] = None
    ) -> Any:
        """
        Виклик інструмента агента.
        
        Args:
            tool_name: Назва інструмента
            parameters: Параметри інструмента
            neo4j_client: Клієнт Neo4j (для графових інструментів)
            postgres_client: Клієнт PostgreSQL (для ризик-інструментів)
            
        Returns:
            Any: Результат виконання інструмента
        """
        
        tool = self.get_tool(tool_name)
        if not tool:
            raise ValueError(f"Невідомий інструмент: {tool_name}")
        
        # Підстановка параметрів
        for key, value in parameters.items():
            if hasattr(tool, key):
                setattr(tool, key, value)
        
        # Виконання інструмента з відповідним клієнтом
        if tool_name == "analyze_risk_score":
            if not postgres_client:
                raise ValueError("Потрібен postgres_client для analyze_risk_score")
            result = await tool.execute(postgres_client=postgres_client)
        else:
            if not neo4j_client:
                raise ValueError("Потрібен neo4j_client для графових інструментів")
            result = await tool.execute(neo4j_client=neo4j_client)
        
        return result


# Глобальний реєстр інструментів
TOOL_REGISTRY = ToolRegistry()


def get_tool_registry() -> ToolRegistry:
    """
    Отримання глобального реєстру інструментів.
    
    Returns:
        ToolRegistry: Реєстр інструментів
    """
    return TOOL_REGISTRY
