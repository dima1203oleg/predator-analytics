from __future__ import annotations

import asyncio
import os

from libs.core.logger import setup_logger

logger = setup_logger("predator.agents.mistral")

class MistralAgent:
    def __init__(self):
        self.client = None
        # Lazy Import to prevent crash loop if package is missing/incompatible
        try:
            from mistralai import Mistral
            # Отримуємо ключ з env або використовуємо заглушку якщо це RND
            api_key = os.getenv("MISTRAL_API_KEY")
            if not api_key:
                 logger.warning("MISTRAL_API_KEY not set. MistralAgent will run in MOCK mode.")
            else:
                 self.client = Mistral(api_key=api_key)
        except ImportError as e:
            logger.exception(f"Failed to import mistralai: {e}. MistralAgent disabled.")
        except Exception as e:
            logger.exception(f"MistralAgent init error: {e}")

    async def generate_code(self, prompt: str) -> str:
        """Генерує код на основі промта."""
        if not self.client:
            return self._mock_generation(prompt)

        try:
            messages = [
                {"role": "system", "content": "You are a senior DevOps engineer and Python expert. Generate production-ready, secure code based on the user request. Output only the code block without markdown wrappers if possible, or standard markdown."},
                {"role": "user", "content": prompt}
            ]

            # Використовуємо codestral якщо доступний, або mistral-medium
            response = await asyncio.to_thread(
                self.client.chat.complete,
                model="codestral-latest",
                messages=messages
            )

            return response.choices[0].message.content
        except Exception as e:
            logger.exception(f"Mistral generation failed: {e}")
            return f"# Error generating code: {e!s}"

    def _mock_generation(self, prompt: str) -> str:
        """Заглушка для тестів без API ключа."""
        return f"""
# MOCK CODE GENERATION (Mistral Key missing)
# Request: {prompt}
import logging

def fix_issue():
    logging.info("Fixing issue via mock script...")
    print("System patched successfully.")

if __name__ == "__main__":
    fix_issue()
"""
