"""
Council Judge for Predator Autonomous Factory.
Implement "Three models generate, one judge decides" pattern (karpathy/llm-council style).
"""

import os
from typing import List, Dict, Any
from litellm import completion
from loguru import logger

class CouncilJudge:
    def __init__(self):
        # Моделі для генерації варіантів
        self.generators = [
            "ollama/qwen2.5-coder", 
            "groq/llama3-70b-8192", 
            "gemini/gemini-1.5-flash"
        ]
        # Модель-суддя
        self.judge_model = "gemini/gemini-1.5-pro"
        
    async def get_council_decision(self, prompt: str, context: str) -> str:
        logger.info("Council Judge: Convening the council...")
        
        proposals = []
        for model in self.generators:
            try:
                response = completion(
                    model=model,
                    messages=[
                        {"role": "system", "content": "Ти — Senior Engineer. Запропонуй найкраще технічне рішення для Predator Analytics."},
                        {"role": "user", "content": f"Контекст: {context}\nЗавдання: {prompt}"}
                    ]
                )
                content = response.choices[0].message.content
                proposals.append(f"Модель {model} пропонує:\n{content}")
            except Exception as e:
                logger.error(f"Council Judge: Model {model} failed: {e}")

        if not proposals:
            return "Council failed to generate proposals."

        # Суддівство
        logger.info("Council Judge: Asking the Judge to decide...")
        judge_prompt = f"Ти — Головний Архітектор Predator Analytics. Перед тобою {len(proposals)} пропозицій від ради інженерів. Оціни їх та вибери ОДНУ найкращу стратегію або синтезуй фінальне рішення, яке максимально посилює систему, використовуючи тільки безплатні компоненти.\n\n" + "\n\n".join(proposals)
        
        try:
            judge_response = completion(
                model=self.judge_model,
                messages=[{"role": "user", "content": judge_prompt}]
            )
            return judge_response.choices[0].message.content
        except Exception as e:
            logger.error(f"Council Judge: Judge model failed: {e}")
            return proposals[0] # Fallback to first proposal
