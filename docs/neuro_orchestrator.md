# PREDATOR Analytics v56.5-ELITE — Нейро-оркестратор (LLM Agentic Reasoning Layer)

## Опис

Нейро-оркестратор — це інтелектуальний прошарок між AI та базами даних, який перетворює природну мову на складні графи та забезпечує автономний аналіз даних. Він є "нервовою системою" PREDATOR Analytics, що дозволяє системі працювати як автономна зброя фінансової розвідки.

## Архітектура

### 1. ReAct (Reasoning + Acting) Loop

Агент працює за циклом: Отримати запит → Створити Cypher-запит → Виконати → Побачити помилку або порожню відповідь → Самостійно виправити запит → Видати результат.

**Алгоритм:**

```python
async def react_loop(query: str, max_iterations: int = 5) -> dict:
    """
    ReAct Loop для агента PREDATOR.
    
    Args:
        query: Запит користувача природною мовою
        max_iterations: Максимальна кількість ітерацій самокорекції
        
    Returns:
        dict: Результат аналізу з відповіддю та шляхом мислення
    """
    
    # 1. Initial Thought
    thought = await llm.generate(f"""
    Запит: {query}
    
    Доступні сутності: Company, Person, Declaration, Product, CustomsPost, Broker, Address, Country
    Доступні зв'язки: DIRECTS, OWNS, REGISTERED_AT, FILED, PROCESSED, CLEARED_AT, CONTAINS, ORIGINATES_FROM, DISPATCHED_FROM
    
    Сформуй початковий план аналізу.
    """)
    
    for iteration in range(max_iterations):
        # 2. Action: Генерація Cypher запиту
        cypher_query = await llm.generate(f"""
        План: {thought}
    
        Сформуй Cypher запит для Neo4j.
        Використовуй тільки визначені сутності та зв'язки.
        """)
        
        # 3. Observation: Виконання запиту
        try:
            result = await neo4j.execute(cypher_query)
            
            if result and len(result) > 0:
                # 4. Final Answer: Успішний результат
                return {
                    "answer": await llm.generate(f"""
                    Результат запиту: {result}
                    
            Сформуй зрозумілу відповідь для користувача.
            """),
                    "thought_process": thought,
                    "cypher_query": cypher_query,
                    "iterations": iteration + 1
                }
            else:
                # 5. Self-Correction: Порожня відповідь
                thought = await llm.generate(f"""
                Запит: {query}
                Попередній Cypher запит: {cypher_query}
                Результат: Порожній
                
                Проаналізуй, чому запит не повернув результатів.
                Сформуй новий план аналізу.
                """)
                
        except Exception as e:
            # 6. Self-Correction: Помилка виконання
            thought = await llm.generate(f"""
            Запит: {query}
            Попередній Cypher запит: {cypher_query}
            Помилка: {str(e)}
            
            Проаналізуй помилку та сформуй новий Cypher запит.
            """)
    
    # 7. Max Iterations Exceeded
    return {
        "answer": "Не вдалося знайти відповідь після {max_iterations} ітерацій.",
        "thought_process": thought,
        "cypher_query": cypher_query,
        "iterations": max_iterations
    }
```

**Переваги ReAct Loop:**
- **Автономна самокорекція** — Агент самостійно виправляє помилки в запитах
- **Прозорість мислення** — Кожен крок логується для аудиту
- **Адаптивність** — Агент адаптується під різні типи запитів

### 2. Tool Calling API (Функціональні виклики)

Набір жорстко зашитих функцій (Tools), які агент може викликати для виконання специфічних завдань.

**Доступні інструменти:**

```python
from typing import Dict, Any, List
from pydantic import BaseModel, Field

class ToolCall(BaseModel):
    """Базовий клас для інструментів агента."""
    name: str
    description: str
    parameters: Dict[str, Any]

class SearchGraphAnomalyTool(ToolCall):
    """Пошук аномалій в графі."""
    
    name = "search_graph_anomaly"
    description = "Пошук аномалій в графі за заданим патерном"
    
    async def execute(self, pattern: str, parameters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Виконання пошуку аномалії."""
        
        # Мапінг патернів на Cypher запити
        pattern_queries = {
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
            """
        }
        
        cypher_query = pattern_queries.get(pattern)
        if not cypher_query:
            raise ValueError(f"Невідомий патерн: {pattern}")
        
        # Підстановка параметрів
        formatted_query = cypher_query.format(**parameters)
        
        # Виконання запиту
        result = await neo4j.execute(formatted_query)
        
        return result

class GetEntityDetailsTool(ToolCall):
    """Отримання деталей сутності."""
    
    name = "get_entity_details"
    description = "Отримання детальної інформації про сутність (компанію, особу, декларацію)"
    
    async def execute(self, entity_type: str, entity_id: str) -> Dict[str, Any]:
        """Виконання отримання деталей."""
        
        queries = {
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
        
        cypher_query = queries.get(entity_type)
        if not cypher_query:
            raise ValueError(f"Невідомий тип сутності: {entity_type}")
        
        result = await neo4j.execute(cypher_query, {"entity_id": entity_id})
        
        return result

# Реєстр інструментів
TOOL_REGISTRY = {
    "search_graph_anomaly": SearchGraphAnomalyTool,
    "get_entity_details": GetEntityDetailsTool
}

async def call_tool(tool_name: str, parameters: Dict[str, Any]) -> Any:
    """Виклик інструмента агента."""
    
    tool_class = TOOL_REGISTRY.get(tool_name)
    if not tool_class:
        raise ValueError(f"Невідомий інструмент: {tool_name}")
    
    tool = tool_class()
    result = await tool.execute(**parameters)
    
    return result
```

**Переваги Tool Calling API:**
- **Модульність** — Кожен інструмент може бути розроблений та тестований ізольовано
- **Безпека** — Інструменти обмежені конкретними операціями
- **Масштабованість** — Легко додавати нові інструменти

### 3. Vector Semantic Router

Перед тим як генерувати запит, система через Qdrant шукає в базі "схожі минулі розслідування", щоб зрозуміти контекст і використати вже перевірені алгоритми пошуку.

**Алгоритм:**

```python
async def vector_semantic_router(query: str) -> Dict[str, Any]:
    """
    Vector Semantic Router для пошуку схожих розслідувань.
    
    Args:
        query: Запит користувача
        
    Returns:
        dict: Контекст з найбільш схожими розслідуваннями
    """
    
    # 1. Генерація embedding для запиту
    query_embedding = await embedding_model.embed(query)
    
    # 2. Пошук схожих розслідувань в Qdrant
    similar_investigations = await qdrant.search(
        collection_name="investigations",
        query_vector=query_embedding,
        limit=5,
        score_threshold=0.7
    )
    
    if similar_investigations:
        # 3. Використання контексту з схожих розслідувань
        context = {
            "similar_queries": [inv.payload["query"] for inv in similar_investigations],
            "successful_patterns": [inv.payload["pattern"] for inv in similar_investigations],
            "cypher_queries": [inv.payload["cypher_query"] for inv in similar_investigations]
        }
        
        # 4. Генерація запиту з контекстом
        enhanced_query = await llm.generate(f"""
        Запит користувача: {query}
        
        Контекст з схожих розслідувань:
        {context}
        
        Використай цей контекст для формування більш точного Cypher запиту.
        """)
        
        return {
            "query": enhanced_query,
            "context": context,
            "confidence": max([inv.score for inv in similar_investigations])
        }
    else:
        # 5. Нове розслідування без контексту
        return {
            "query": query,
            "context": None,
            "confidence": 0.0
        }
```

**Переваги Vector Semantic Router:**
- **Контекстна обізнаність** — Агент використовує досвід попередніх розслідувань
- **Прискорення** — Схожі запити обробляються швидше
- **Навчання** — Система покращується з кожним розслідуванням

## Інтеграція з DeepSeek R1

Нейро-оркестратор використовує DeepSeek R1 як основну LLM модель для генерації запитів та аналізу результатів.

## Наступні кроки

1. Реалізувати ReAct Loop для агента
2. Створити Tool Calling API для функцій агента
3. Інтегрувати Vector Semantic Router через Qdrant
4. Додати Нейро-оркестратор в PREDATOR_ELITE_SPEC_v56.5.md
