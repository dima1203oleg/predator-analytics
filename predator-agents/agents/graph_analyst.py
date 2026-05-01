"""
Predator Agents OS — Graph Analyst
Агент для глибокого аналізу графа Neo4j.
"""

from typing import List, Dict, Any
from core.llm import coder_llm
from tools.graph import GraphTools
from langchain_core.messages import SystemMessage, HumanMessage
import json

class GraphAnalyst:
    def __init__(self):
        self.tools = GraphTools()
        self.llm = coder_llm

    async def analyze(self, task: str) -> Dict[str, Any]:
        """
        Аналізує завдання, генерує Cypher та виконує його.
        """
        prompt = f"""
        Ти — Graph Analyst у проекті PREDATOR. Твоє завдання — перетворити опис задачі на Cypher-запит.
        Схема графа: (Company {{name, ueid}}), (Person {{name}}). Зв'язки: [OWNER_OF], [DIRECTOR_OF], [RELATED_TO].
        
        Завдання: {task}
        
        Відповідай ТІЛЬКИ у форматі JSON:
        {{"cypher": "MATCH ... RETURN ...", "explanation": "що цей запит знайде"}}
        """
        
        messages = [SystemMessage(content=prompt)]
        response = await self.llm.ainvoke(messages)
        
        try:
            query_data = json.loads(response.content)
            cypher = query_data.get("cypher")
            results = self.tools.query(cypher)
            return {
                "agent": "Graph Analyst",
                "results": results,
                "explanation": query_data.get("explanation")
            }
        except Exception as e:
            return {"error": f"Помилка аналізу графа: {str(e)}"}
