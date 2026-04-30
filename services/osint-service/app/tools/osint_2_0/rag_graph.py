"""RAG + Graph — Prompt-Guided Exploration.

Компоненти:
- RAGGraphEngine: Інтеграція LLM з графовою БД
- PromptGuidedExplorer: Природномовні запити до графа
"""
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class RAGResult:
    """Результат RAG запиту."""
    success: bool
    query: str
    answer: str = ""
    sources: list[dict] = field(default_factory=list)
    graph_context: dict[str, Any] = field(default_factory=dict)
    confidence: float = 0.0
    response_time_ms: float = 0.0


class RAGGraphEngine:
    """RAG + Graph Engine — Інтеграція LLM з Knowledge Graph.

    Архітектура:
    1. Отримує питання природною мовою
    2. Перетворює на запит до графової БД (Cypher/TypeQL)
    3. Отримує релевантний підграф
    4. Передає контекст LLM для формулювання відповіді

    Підтримує:
    - Neo4j (Cypher)
    - TypeDB (TypeQL)
    - LangChain інтеграція
    """

    def __init__(
        self,
        llm_provider: str = "claude",
        graph_db: str = "neo4j",
    ):
        self.llm_provider = llm_provider
        self.graph_db = graph_db

    async def query(
        self,
        question: str,
        context: dict[str, Any] | None = None,
    ) -> RAGResult:
        """Виконати RAG запит."""
        start_time = datetime.now(UTC)

        # 1. Аналіз питання та генерація запиту до графа
        graph_query = await self._generate_graph_query(question)

        # 2. Виконання запиту до графової БД
        graph_results = await self._execute_graph_query(graph_query)

        # 3. Формування контексту для LLM
        llm_context = self._build_llm_context(question, graph_results, context)

        # 4. Генерація відповіді LLM
        answer = await self._generate_answer(llm_context)

        return RAGResult(
            success=True,
            query=question,
            answer=answer,
            sources=graph_results.get("sources", []),
            graph_context={
                "query_generated": graph_query,
                "nodes_retrieved": graph_results.get("nodes_count", 0),
                "relations_retrieved": graph_results.get("relations_count", 0),
            },
            confidence=0.85,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def _generate_graph_query(self, question: str) -> str:
        """Генерація запиту до графової БД з природної мови."""
        # Симуляція — в реальності використовується LLM

        # Приклади перетворень:
        query_templates = {
            "пов'язані компанії": """
                MATCH (c:Identity {name: $company_name})-[r]-(related)
                RETURN c, r, related
                LIMIT 50
            """,
            "борги": """
                MATCH (c:Identity)-[:HAS_DEBT]->(d:Debt)
                WHERE c.name CONTAINS $search_term
                RETURN c, d
            """,
            "бенефіціари": """
                MATCH (c:Identity)<-[:CONTROLS]-(b:Identity)
                WHERE c.name CONTAINS $search_term
                RETURN c, b
            """,
            "тендери": """
                MATCH (c:Identity)-[:PARTICIPATED_IN]->(t:Tender)
                WHERE c.edrpou = $edrpou
                RETURN c, t
                ORDER BY t.date DESC
            """,
        }

        # Визначення типу запиту
        question_lower = question.lower()

        if "пов'язан" in question_lower:
            return query_templates["пов'язані компанії"]
        elif "борг" in question_lower:
            return query_templates["борги"]
        elif "бенефіціар" in question_lower:
            return query_templates["бенефіціари"]
        elif "тендер" in question_lower or "закупівл" in question_lower:
            return query_templates["тендери"]
        else:
            return f"// Generated query for: {question}\nMATCH (n) WHERE n.name CONTAINS $search_term RETURN n LIMIT 10"

    async def _execute_graph_query(self, query: str) -> dict[str, Any]:
        """Виконання запиту до графової БД."""
        # Симуляція результатів
        return {
            "nodes": [
                {"id": "1", "type": "Identity", "name": "ТОВ «Компанія А»", "edrpou": "12345678"},
                {"id": "2", "type": "Identity", "name": "ТОВ «Компанія Б»", "edrpou": "87654321"},
                {"id": "3", "type": "Identity", "name": "Іванов Іван Іванович", "type": "person"},
            ],
            "relations": [
                {"source": "1", "target": "2", "type": "RELATED_TO"},
                {"source": "3", "target": "1", "type": "CONTROLS"},
            ],
            "nodes_count": 3,
            "relations_count": 2,
            "sources": [
                {"registry": "ЄДР", "date": "2024-06-15"},
                {"registry": "Prozorro", "date": "2024-06-10"},
            ],
        }

    def _build_llm_context(
        self,
        question: str,
        graph_results: dict[str, Any],
        additional_context: dict[str, Any] | None,
    ) -> str:
        """Формування контексту для LLM."""
        context_parts = [
            f"Питання користувача: {question}",
            "",
            "Дані з Knowledge Graph:",
        ]

        # Додаємо вузли
        for node in graph_results.get("nodes", []):
            context_parts.append(f"- {node.get('type', 'Entity')}: {node.get('name', 'Unknown')}")

        # Додаємо зв'язки
        context_parts.append("")
        context_parts.append("Зв'язки:")
        for rel in graph_results.get("relations", []):
            context_parts.append(f"- {rel.get('source')} --[{rel.get('type')}]--> {rel.get('target')}")

        # Додаємо джерела
        context_parts.append("")
        context_parts.append("Джерела даних:")
        for source in graph_results.get("sources", []):
            context_parts.append(f"- {source.get('registry')}: {source.get('date')}")

        if additional_context:
            context_parts.append("")
            context_parts.append("Додатковий контекст:")
            context_parts.append(str(additional_context))

        return "\n".join(context_parts)

    async def _generate_answer(self, context: str) -> str:
        """Генерація відповіді LLM."""
        # Симуляція відповіді LLM
        return """На основі аналізу даних з Knowledge Graph:

**Знайдені зв'язки:**
- ТОВ «Компанія А» (ЄДРПОУ: 12345678) пов'язана з ТОВ «Компанія Б» (ЄДРПОУ: 87654321)
- Іванов Іван Іванович є контролюючою особою ТОВ «Компанія А»

**Джерела:**
- Єдиний державний реєстр (ЄДР)
- Prozorro

**Рекомендації:**
1. Перевірити додаткові зв'язки через реєстр бенефіціарів
2. Проаналізувати спільні тендери компаній
3. Перевірити наявність судових справ"""


class PromptGuidedExplorer:
    """Prompt-Guided Exploration — Дослідження графа природною мовою.

    Приклади запитів:
    - "Покажи всі компанії, пов'язані з Івановим"
    - "Знайди компанії з боргами, які вигравали тендери"
    - "Хто є кінцевим бенефіціаром ТОВ «Компанія»?"
    - "Покажи ланцюг володіння до офшору"
    """

    def __init__(self):
        self.rag_engine = RAGGraphEngine()
        self.query_history: list[dict] = []

    async def explore(
        self,
        question: str,
        follow_up: bool = False,
    ) -> RAGResult:
        """Дослідження графа за питанням."""
        datetime.now(UTC)

        # Якщо це follow-up, додаємо контекст попередніх запитів
        context = None
        if follow_up and self.query_history:
            context = {
                "previous_queries": [q["question"] for q in self.query_history[-3:]],
                "previous_entities": self._extract_entities_from_history(),
            }

        # Виконуємо RAG запит
        result = await self.rag_engine.query(question, context)

        # Зберігаємо в історію
        self.query_history.append({
            "question": question,
            "timestamp": datetime.now(UTC).isoformat(),
            "entities_found": result.graph_context.get("nodes_retrieved", 0),
        })

        return result

    def _extract_entities_from_history(self) -> list[str]:
        """Витягування сутностей з історії запитів."""
        # Спрощена реалізація
        return []

    async def suggest_queries(self, current_context: dict[str, Any]) -> list[str]:
        """Пропозиція наступних запитів на основі контексту."""
        suggestions = [
            "Покажи всіх бенефіціарів цієї компанії",
            "Чи є судові справи за участю цих осіб?",
            "Знайди спільні тендери цих компаній",
            "Перевір наявність боргів",
            "Покажи історію змін власників",
        ]

        return suggestions

    async def explain_connection(
        self,
        entity1: str,
        entity2: str,
    ) -> RAGResult:
        """Пояснення зв'язку між двома сутностями."""
        question = f"Поясни зв'язок між {entity1} та {entity2}"
        return await self.explore(question)

    async def find_risk_factors(self, entity: str) -> RAGResult:
        """Пошук факторів ризику для сутності."""
        question = f"Знайди всі фактори ризику для {entity}: борги, судові справи, санкції, пов'язані особи"
        return await self.explore(question)

    async def trace_ownership(self, company: str) -> RAGResult:
        """Відстеження ланцюга володіння."""
        question = f"Покажи повний ланцюг володіння для {company} до кінцевого бенефіціара"
        return await self.explore(question)

    async def analyze_network(
        self,
        center_entity: str,
        depth: int = 2,
    ) -> RAGResult:
        """Аналіз мережі зв'язків."""
        question = f"Проаналізуй мережу зв'язків {center_entity} на глибину {depth} рівнів"

        result = await self.explore(question)

        # Додаємо мережевий аналіз
        result.graph_context["network_analysis"] = {
            "center_entity": center_entity,
            "depth": depth,
            "total_nodes": result.graph_context.get("nodes_retrieved", 0),
            "total_relations": result.graph_context.get("relations_retrieved", 0),
            "clusters": [],  # Кластери пов'язаних сутностей
            "key_connectors": [],  # Ключові з'єднувачі (hub nodes)
            "anomalies": [],  # Аномальні патерни
        }

        return result


class TypeDBMCPClient:
    """TypeDB MCP Server Client — Інтеграція з TypeDB через MCP.

    Model Context Protocol для роботи з TypeDB.
    Дозволяє LLM безпосередньо взаємодіяти з графовою БД.
    """

    def __init__(self, mcp_server_url: str = "http://localhost:8080"):
        self.mcp_server_url = mcp_server_url

    async def define_schema(self, schema: str) -> dict[str, Any]:
        """Визначення схеми TypeDB."""
        # Симуляція
        return {
            "success": True,
            "schema_defined": True,
            "types_created": ["company", "person", "owns", "controls"],
        }

    async def insert_data(self, data: list[dict]) -> dict[str, Any]:
        """Вставка даних у TypeDB."""
        return {
            "success": True,
            "inserted_count": len(data),
        }

    async def query(self, typeql: str) -> dict[str, Any]:
        """Виконання TypeQL запиту."""
        return {
            "success": True,
            "results": [],
            "execution_time_ms": 50,
        }

    async def natural_language_query(self, question: str) -> RAGResult:
        """Запит природною мовою через MCP."""
        # MCP дозволяє LLM генерувати TypeQL запити

        # 1. LLM аналізує питання
        # 2. Генерує TypeQL
        # 3. Виконує запит
        # 4. Форматує відповідь

        return RAGResult(
            success=True,
            query=question,
            answer="Відповідь на основі TypeDB...",
            sources=[],
            graph_context={
                "typeql_generated": "match $c isa company; get $c;",
                "execution_time_ms": 50,
            },
            confidence=0.9,
        )
