"""LLM client для інтеграції з різними моделями через LiteLLM.

Модуль забезпечує уніфікований інтерфейс до:
- OpenAI GPT-4/3.5
- Ollama локальні моделі
- Claude (Anthropic)
- Gemini (Google)
"""
from __future__ import annotations

import asyncio
import json
from typing import Any, Optional

from mcp.ai_layer.prompt_templates import SYSTEM_PROMPTS, get_prompt


class LLMError(Exception):
    """Базова помилка для LLM операцій."""

    pass


class LLMClient:
    """Client для взаємодії з LLM моделями через LiteLLM."""

    def __init__(
        self,
        model: str = "ollama/mistral",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> None:
        """Ініціалізувати LLM client.

        Args:
            model: Назва моделі (ollama/mistral, gpt-4, claude-3-opus)
            api_key: API ключ для сервіса (якщо потрібно)
            base_url: Base URL для локальних моделей (Ollama)
            temperature: Температура для генерації (0.0-2.0)
            max_tokens: Максимальна довжина відповіді
        """
        self.model = model
        self.api_key = api_key
        self.base_url = base_url
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.conversation_history: list[dict[str, str]] = []

    async def complete(
        self,
        prompt: str,
        system: Optional[str] = None,
        context: Optional[dict[str, Any]] = None,
        stream: bool = False,
    ) -> str:
        """Отримати завершення від LLM.

        Args:
            prompt: Текст запиту
            system: Системна підказка (якщо None, використовується default)
            context: Додатковий контекст для підказки
            stream: Чи стримити відповідь

        Returns:
            Текст відповіді від моделі

        Raises:
            LLMError: Якщо виклик моделі неуспішний
        """
        try:
            import litellm

            if system is None:
                system = SYSTEM_PROMPTS.get("default")

            messages = [
                {"role": "system", "content": system},
                *self.conversation_history,
                {"role": "user", "content": prompt},
            ]

            response = await asyncio.to_thread(
                litellm.completion,
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                api_key=self.api_key,
                api_base=self.base_url,
            )

            content = response.choices[0].message.content
            self.conversation_history.append({"role": "user", "content": prompt})
            self.conversation_history.append({"role": "assistant", "content": content})

            return content

        except ImportError:
            raise LLMError("litellm не встановлено. Встановіть: pip install litellm")
        except Exception as e:
            raise LLMError(f"Помилка LLM: {str(e)}") from e

    async def analyze_code(
        self,
        code: str,
        language: str = "python",
        analysis_type: str = "security",
    ) -> dict[str, Any]:
        """Аналізувати код через LLM.

        Args:
            code: Код для аналізу
            language: Мова програмування
            analysis_type: Тип аналізу (security, performance, quality)

        Returns:
            Словник з результатами аналізу
        """
        prompt = get_prompt(
            "code_analysis",
            code=code,
            language=language,
            analysis_type=analysis_type,
        )

        response = await self.complete(
            prompt,
            system=SYSTEM_PROMPTS.get("code_analysis"),
        )

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"analysis": response, "raw": True}

    async def generate_documentation(
        self,
        code: str,
        language: str = "python",
        style: str = "docstring",
    ) -> str:
        """Генерувати документацію для коду.

        Args:
            code: Код для документування
            language: Мова програмування
            style: Стиль документації (docstring, markdown, javadoc)

        Returns:
            Згенерована документація
        """
        prompt = get_prompt(
            "generate_docs",
            code=code,
            language=language,
            style=style,
        )

        return await self.complete(
            prompt,
            system=SYSTEM_PROMPTS.get("documentation"),
        )

    async def refactor_code(
        self,
        code: str,
        language: str = "python",
        objectives: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        """Запропонувати рефакторинг коду.

        Args:
            code: Код для рефакторингу
            language: Мова програмування
            objectives: Цілі рефакторингу (performance, readability, testing)

        Returns:
            Словник з вихідним та рекомендованим кодом
        """
        objectives_str = ", ".join(objectives or ["readability", "performance"])
        prompt = get_prompt(
            "refactor_code",
            code=code,
            language=language,
            objectives=objectives_str,
        )

        response = await self.complete(
            prompt,
            system=SYSTEM_PROMPTS.get("code_refactoring"),
        )

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"refactored_code": response, "raw": True}

    async def explain(self, topic: str, level: str = "intermediate") -> str:
        """Пояснити технічну концепцію.

        Args:
            topic: Тема для пояснення
            level: Рівень складності (beginner, intermediate, advanced)

        Returns:
            Пояснення теми
        """
        prompt = f"""Поясни концепцію: {topic}
Рівень: {level}
Формат: структурований текст з прикладами"""

        return await self.complete(
            prompt,
            system=SYSTEM_PROMPTS.get("education"),
        )

    async def brainstorm(
        self,
        problem: str,
        num_ideas: int = 5,
    ) -> list[str]:
        """Генерувати ідеї для розв'язання проблеми.

        Args:
            problem: Опис проблеми
            num_ideas: Кількість ідей

        Returns:
            Список ідей
        """
        prompt = f"""Проблема: {problem}
Генеруй {num_ideas} інноваційних ідей для розв'язання.
Формат: пронумерований список"""

        response = await self.complete(
            prompt,
            system=SYSTEM_PROMPTS.get("brainstorming"),
        )

        lines = [line.strip() for line in response.split("\n") if line.strip()]
        return lines[:num_ideas]

    def clear_history(self) -> None:
        """Очистити історію розмови."""
        self.conversation_history = []

    async def get_model_info(self) -> dict[str, Any]:
        """Отримати інформацію про модель."""
        return {
            "model": self.model,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "has_api_key": self.api_key is not None,
            "base_url": self.base_url,
            "history_length": len(self.conversation_history),
        }
