"""
Predator Agents OS — LLM Interface
Інтерфейс для взаємодії з Ollama (локально на NVIDIA Server).
"""

import os
from typing import List, Optional
from langchain_ollama import ChatOllama
from langchain_core.messages import BaseMessage

class LLMManager:
    def __init__(self, model_name: str = "qwen3:8b"):
        self.host = os.getenv("OLLAMA_HOST", "http://194.177.1.240:11434")
        self.model_name = model_name
        self.llm = ChatOllama(
            model=self.model_name,
            base_url=self.host,
            temperature=0.7
        )

    def get_llm(self):
        return self.llm

    def get_embeddings(self):
        """
        Повертає об'єкт для генерації embeddings.
        """
        from langchain_ollama import OllamaEmbeddings
        return OllamaEmbeddings(
            model=self.model_name,
            base_url=self.host
        )

    async def invoke(self, messages: List[BaseMessage]) -> BaseMessage:
        """
        Викликає модель з набором повідомлень.
        """
        return await self.llm.ainvoke(messages)

# Спеціалізовані екземпляри
planner_llm = LLMManager(model_name="deepseek-r1:7b").get_llm()
coder_llm = LLMManager(model_name="qwen3:8b").get_llm()
