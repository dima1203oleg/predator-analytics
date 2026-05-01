"""
SysAdmin Agent — Система моніторингу та діагностики
Цей агент відповідає за перевірку стану інструментів (MCP), доступності БД та ресурсів сервера.
"""

from typing import List, Dict, Any
import os
import socket
import psutil
from core.llm import coder_llm
from langchain_core.messages import HumanMessage

class SysAdminAgent:
    def __init__(self):
        self.llm = coder_llm

    async def check_health(self) -> Dict[str, Any]:
        """Перевірка основних параметрів системи."""
        health = {
            "status": "healthy",
            "cpu_usage": psutil.cpu_percent(),
            "memory_usage": psutil.virtual_memory().percent,
            "mcp_status": {},
            "connectivity": {}
        }

        # Перевірка Neo4j (Port 7687)
        health["connectivity"]["neo4j"] = self._check_port("localhost", 7687)
        
        # Перевірка Qdrant (Port 6333)
        health["connectivity"]["qdrant"] = self._check_port("localhost", 6333)

        return health

    def _check_port(self, host: str, port: int) -> bool:
        try:
            with socket.create_connection((host, port), timeout=1):
                return True
        except:
            return False

    async def execute(self, task: str) -> str:
        """Аналіз системної проблеми або звітування про стан."""
        health_data = await self.check_health()
        
        prompt = f"""
        Ти — SysAdmin Agent у системі PREDATOR Analytics.
        Твоє завдання: Проаналізувати стан системи та відповісти на запит користувача.
        
        Поточний стан:
        - CPU: {health_data['cpu_usage']}%
        - RAM: {health_data['memory_usage']}%
        - Neo4j: {'ONLINE' if health_data['connectivity']['neo4j'] else 'OFFLINE'}
        - Qdrant: {'ONLINE' if health_data['connectivity']['qdrant'] else 'OFFLINE'}
        
        Запит користувача: {task}
        
        Надай коротку технічну відповідь українською мовою. Якщо є проблеми з лімітами MCP (якщо вони згадані в запиті), порадь, що відключити.
        Наприклад, якщо ліміт інструментів перевищено (100), порадь відключити важкі сервери як GCE або Kafka.
        """
        
        response = await self.llm.ainvoke([HumanMessage(content=prompt)])
        return response.content
