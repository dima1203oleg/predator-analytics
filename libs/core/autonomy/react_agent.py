"""
ReAct Agent для PREDATOR Analytics v56.5-ELITE
Реалізація ReAct (Reasoning + Acting) Loop для агента аналітики графових даних.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

logger = logging.getLogger("predator_react_agent")


class ReActAgent:
    """
    ReAct Agent для PREDATOR Analytics.
    
    Агент працює за циклом: Отримати запит → Створити Cypher-запит → Виконати → 
    Побачити помилку або порожню відповідь → Самостійно виправити запит → Видати результат.
    """
    
    def __init__(
        self,
        neo4j_client: Any,
        llm_client: Any,
        max_iterations: int = 5
    ):
        """
        Ініціалізація ReAct агента.
        
        Args:
            neo4j_client: Клієнт для Neo4j
            llm_client: Клієнт для LLM (DeepSeek R1)
            max_iterations: Максимальна кількість ітерацій самокорекції
        """
        self.neo4j = neo4j_client
        self.llm = llm_client
        self.max_iterations = max_iterations
        
        # Онтологія графової бази
        self.available_entities = [
            "Company", "Person", "Declaration", "Product", 
            "CustomsPost", "Broker", "Address", "Country"
        ]
        
        self.available_relationships = [
            "DIRECTS", "OWNS", "REGISTERED_AT", "FILED", 
            "PROCESSED", "CLEARED_AT", "CONTAINS", 
            "ORIGINATES_FROM", "DISPATCHED_FROM"
        ]
    
    async def react_loop(self, query: str) -> Dict[str, Any]:
        """
        ReAct Loop для агента PREDATOR.
        
        Args:
            query: Запит користувача природною мовою
            
        Returns:
            dict: Результат аналізу з відповіддю та шляхом мислення
        """
        
        logger.info(f"ReAct Agent: Початок обробки запиту: {query}")
        
        # 1. Initial Thought
        thought = await self._generate_initial_thought(query)
        logger.info(f"ReAct Agent: Початковий план: {thought}")
        
        thought_process = [thought]
        cypher_queries = []
        
        for iteration in range(self.max_iterations):
            logger.info(f"ReAct Agent: Ітерація {iteration + 1}/{self.max_iterations}")
            
            # 2. Action: Генерація Cypher запиту
            cypher_query = await self._generate_cypher_query(thought, query)
            cypher_queries.append(cypher_query)
            logger.info(f"ReAct Agent: Згенерований Cypher запит: {cypher_query}")
            
            # 3. Observation: Виконання запиту
            try:
                result = await self._execute_cypher(cypher_query)
                logger.info(f"ReAct Agent: Результат виконання: {len(result) if result else 0} записів")
                
                if result and len(result) > 0:
                    # 4. Final Answer: Успішний результат
                    answer = await self._generate_final_answer(query, result)
                    
                    logger.info(f"ReAct Agent: Успішний результат за {iteration + 1} ітерацій")
                    
                    return {
                        "answer": answer,
                        "thought_process": thought_process,
                        "cypher_queries": cypher_queries,
                        "iterations": iteration + 1,
                        "status": "success",
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    # 5. Self-Correction: Порожня відповідь
                    logger.warning(f"ReAct Agent: Порожній результат на ітерації {iteration + 1}")
                    
                    thought = await self._self_correct_empty(query, cypher_query, thought)
                    thought_process.append(f"Self-correction (empty): {thought}")
                    
            except Exception as e:
                # 6. Self-Correction: Помилка виконання
                logger.error(f"ReAct Agent: Помилка виконання на ітерації {iteration + 1}: {e}")
                
                thought = await self._self_correct_error(query, cypher_query, str(e), thought)
                thought_process.append(f"Self-correction (error): {thought}")
        
        # 7. Max Iterations Exceeded
        logger.warning(f"ReAct Agent: Досягнуто максимум ітерацій ({self.max_iterations})")
        
        return {
            "answer": "Не вдалося знайти відповідь після {self.max_iterations} ітерацій.",
            "thought_process": thought_process,
            "cypher_queries": cypher_queries,
            "iterations": self.max_iterations,
            "status": "max_iterations_exceeded",
            "timestamp": datetime.now().isoformat()
        }
    
    async def _generate_initial_thought(self, query: str) -> str:
        """
        Генерація початкового плану аналізу.
        
        Args:
            query: Запит користувача
            
        Returns:
            str: Початковий план
        """
        
        prompt = f"""
Запит: {query}

Доступні сутності: {', '.join(self.available_entities)}
Доступні зв'язки: {', '.join(self.available_relationships)}

Сформуй початковий план аналізу. Опиши, які сутності та зв'язки треба використати.
"""
        
        thought = await self.llm.generate(prompt)
        return thought
    
    async def _generate_cypher_query(self, thought: str, query: str) -> str:
        """
        Генерація Cypher запиту на основі плану.
        
        Args:
            thought: План аналізу
            query: Оригінальний запит користувача
            
        Returns:
            str: Cypher запит
        """
        
        prompt = f"""
Запит користувача: {query}
План аналізу: {thought}

Сформуй Cypher запит для Neo4j.
Використовуй тільки визначені сутності та зв'язки.
Запит має бути валідним Cypher для Neo4j 5.
"""
        
        cypher_query = await self.llm.generate(prompt)
        return cypher_query
    
    async def _execute_cypher(self, cypher_query: str) -> List[Dict[str, Any]]:
        """
        Виконання Cypher запиту в Neo4j.
        
        Args:
            cypher_query: Cypher запит
            
        Returns:
            list: Результат виконання
        """
        
        try:
            result = await self.neo4j.execute(cypher_query)
            return result
        except Exception as e:
            logger.error(f"Помилка виконання Cypher запиту: {e}")
            raise
    
    async def _generate_final_answer(self, query: str, result: List[Dict[str, Any]]) -> str:
        """
        Генерація зрозумілої відповіді для користувача.
        
        Args:
            query: Запит користувача
            result: Результат виконання запиту
            
        Returns:
            str: Зрозуміла відповідь
        """
        
        prompt = f"""
Запит користувача: {query}
Результат запиту: {result}

Сформуй зрозумілу відповідь для користувача українською мовою.
Відповідь має бути структурованою та інформативною.
"""
        
        answer = await self.llm.generate(prompt)
        return answer
    
    async def _self_correct_empty(
        self, 
        query: str, 
        cypher_query: str, 
        previous_thought: str
    ) -> str:
        """
        Самокорекція при порожній відповіді.
        
        Args:
            query: Запит користувача
            cypher_query: Попередній Cypher запит
            previous_thought: Попередній план
            
        Returns:
            str: Новий план аналізу
        """
        
        prompt = f"""
Запит користувача: {query}
Попередній план: {previous_thought}
Попередній Cypher запит: {cypher_query}
Результат: Порожній

Проаналізуй, чому запит не повернув результатів.
Можливо, треба змінити стратегію пошуку або використати інші сутності/зв'язки.
Сформуй новий план аналізу.
"""
        
        new_thought = await self.llm.generate(prompt)
        return new_thought
    
    async def _self_correct_error(
        self, 
        query: str, 
        cypher_query: str, 
        error: str, 
        previous_thought: str
    ) -> str:
        """
        Самокорекція при помилці виконання.
        
        Args:
            query: Запит користувача
            cypher_query: Попередній Cypher запит
            error: Текст помилки
            previous_thought: Попередній план
            
        Returns:
            str: Новий план аналізу
        """
        
        prompt = f"""
Запит користувача: {query}
Попередній план: {previous_thought}
Попередній Cypher запит: {cypher_query}
Помилка: {error}

Проаналізуй помилку та сформуй новий Cypher запит.
Можливо, помилка в синтаксисі або логіці запиту.
Сформуй новий план аналізу.
"""
        
        new_thought = await self.llm.generate(prompt)
        return new_thought


class ReAgentConfig:
    """Конфігурація для ReAct агента."""
    
    def __init__(
        self,
        neo4j_uri: str,
        neo4j_user: str,
        neo4j_password: str,
        llm_model_path: str,
        max_iterations: int = 5
    ):
        """
        Ініціалізація конфігурації.
        
        Args:
            neo4j_uri: URI для Neo4j
            neo4j_user: Користувач Neo4j
            neo4j_password: Пароль Neo4j
            llm_model_path: Шлях до моделі LLM
            max_iterations: Максимальна кількість ітерацій
        """
        self.neo4j_uri = neo4j_uri
        self.neo4j_user = neo4j_user
        self.neo4j_password = neo4j_password
        self.llm_model_path = llm_model_path
        self.max_iterations = max_iterations


async def create_react_agent(config: ReAgentConfig) -> ReActAgent:
    """
    Фабрика для створення ReAct агента.
    
    Args:
        config: Конфігурація агента
        
    Returns:
        ReActAgent: Ініціалізований агент
    """
    
    # Ініціалізація Neo4j клієнта
    from neo4j import AsyncGraphDatabase
    
    neo4j = AsyncGraphDatabase.auth(
        config.neo4j_uri,
        (config.neo4j_user, config.neo4j_password)
    )
    
    # Ініціалізація LLM клієнта
    # Тут має бути реалізація для DeepSeek R1 через llama.cpp або інший інтерфейс
    llm_client = None  # Placeholder
    
    agent = ReActAgent(
        neo4j_client=neo4j,
        llm_client=llm_client,
        max_iterations=config.max_iterations
    )
    
    return agent
