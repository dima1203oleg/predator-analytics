import asyncio  # FIX: Import at module level to avoid NameError
import json
import os
import warnings
from typing import Any, Dict, Optional

import google.generativeai as genai
import httpx  # For Groq fallback API calls
from libs.core.logger import setup_logger

from bot.config import settings

# Suppress the deprecation warning for google-generativeai during R&D phase
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")

logger = setup_logger("predator.agents.gemini")

class GeminiAgent:
    def __init__(self):
        self.api_keys = [settings.GEMINI_API_KEY]
        if settings.GEMINI_API_KEYS:
            extra_keys = [k.strip() for k in settings.GEMINI_API_KEYS.split(",") if k.strip()]
            self.api_keys.extend(extra_keys)
        # Remove duplicates
        self.api_keys = list(set(self.api_keys))

        if not self.api_keys:
            logger.warning("No Gemini API keys found. GeminiAgent disabled.")
            return

        import random
        # Initialize with a random key
        genai.configure(api_key=random.choice(self.api_keys))

        self.model_name = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
        self.model = genai.GenerativeModel(self.model_name)

    def _rotate_key(self):
        """Змінити поточний API ключ"""
        import random
        new_key = random.choice(self.api_keys)
        genai.configure(api_key=new_key)
        self.model = genai.GenerativeModel(self.model_name)
        logger.info("Rotated to a new Gemini API key")

    async def _call_groq(self, prompt: str, api_key: str) -> Optional[str]:
        """
        Call Groq API as fallback - FREE with HIGH limits!
        Groq offers 14,400 tokens/min vs Gemini's 20 req/day free tier
        """
        url = "https://api.groq.com/openai/v1/chat/completions"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",  # Free, fast, powerful
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "max_tokens": 2000
                }
            )

            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                raise Exception(f"Groq API error: {response.status_code}")

    async def analyze_with_context(self, prompt: str) -> str:
        """
        Виконує глибокий аналіз запиту з урахуванням контексту.
        """
        try:
            # System prompt для задання ролі
            system_instruction = """
            Ти - провідний DevOps і System Architect системи Predator Analytics.
            Твоя задача - аналізувати технічні проблеми, логи та метрики.
            Будь лаконічним, точним і технічно грамотним.
            Відповідай українською мовою.
            Структура відповіді:
            1. Діагноз (що трапилось)
            2. Аналіз (чому трапилось)
            3. План дій (що робити)
            """

            # Gemini Python SDK наразі синхронний, обгортаємо його
            response = await asyncio.to_thread(
                self.model.generate_content,
                f"{system_instruction}\n\nUser Query: {prompt}"
            )

            return response.text
        except Exception as e:
            if "429" in str(e) or "ResourceExhausted" in str(e) or "quota" in str(e).lower():
                logger.warning("Gemini rate limit hit, trying Groq fallback first...")

                # TRY GROQ FIRST - it has MUCH higher free tier limits!
                groq_key = os.getenv("GROQ_API_KEY")
                if groq_key:
                    try:
                        groq_response = await self._call_groq(
                            f"{system_instruction}\n\nUser Query: {prompt}",
                            groq_key
                        )
                        if groq_response:
                            logger.info("✅ Groq fallback succeeded")
                            return groq_response
                    except Exception as groq_e:
                        logger.warning(f"Groq fallback failed: {groq_e}")

                # Then try Gemini key rotation
                self._rotate_key()
                try:
                    response = await asyncio.to_thread(
                        self.model.generate_content,
                        f"{system_instruction}\n\nUser Query: {prompt}"
                    )
                    return response.text
                except Exception:
                    return "❌ Усі LLM провайдери перевантажені. Спробуйте через хвилину."

            logger.error(f"Gemini analysis failed: {e}")
            return f"❌ Помилка аналізу: {str(e)}"

    async def classify_intent(self, text: str) -> Dict[str, Any]:
        """
        Advanced intent classification using Gemini.
        Returns JSON with intent and parameters.
        """
        try:
            system_prompt = """
            Ти - диспетчер системи Predator Analytics.
            Твоя задача - розпізнати намір (intent) користувача та виділити параметри.

            Доступні інтенти:
            - system_status: запит стану системи (бекенд, база, черги, ресурси).
            - diagnose: аналіз конкретної помилки або проблема ("чому не працює...", "подивись логи").
            - backup: створення бекапу даних/бази ("зроби бекап", "збережи дані").
            - sync: синхронізація (ArgoCD, GitOps).
            - task_list: список активних або чергових задач.
            - security_scan: перевірка безпеки (Bandit, Trivy).
            - quality_check: перевірка якості коду (Ruff, Mypy).
            - chat: просто розмова або запитання без конкретної дії.

            Відповідай ТІЛЬКИ у форматі JSON:
            {"intent": "intent_name", "params": {"key": "value"}, "confidence": 0.9}
            """

            response = await asyncio.to_thread(
                self.model.generate_content,
                f"{system_prompt}\n\nЗапит користувача: {text}"
            )

            # Clean response from possible markdown
            content = response.text.strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()

            return json.loads(content)
        except Exception as e:
            logger.error(f"Intent classification failed: {e}")
            return {"intent": "chat", "params": {}, "confidence": 0.5}

    async def classify_intent_fallback(self, text: str) -> str:
        """Збережено для сумісності"""
        res = await self.classify_intent(text)
        return res.get("intent", "chat")

    async def process_audio(self, audio_path: str, prompt: str) -> Dict[str, Any]:
        """
        Multimodal Audio Processing (v25 Neural Core).
        Uploads audio to Gemini and processes with prompt.
        """
        try:
            # 1. Upload file to Gemini service
            logger.info(f"Uploading audio file: {audio_path}")

            # Using thread-safe upload
            audio_file = await asyncio.to_thread(
                genai.upload_file, path=audio_path, display_name="VoiceCommand"
            )

            # 2. Generate content from audio
            response = await asyncio.to_thread(
                self.model.generate_content,
                [prompt, audio_file]
            )

            # 3. Cleanup Gemini storage (optional but good practice)
            # genai.delete_file(audio_file.name)

            content = response.text.strip()
            # Handle JSON wrapper
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            return json.loads(content)

        except Exception as e:
            logger.error(f"Audio processing failed: {e}")
            # Fallback text-only if possible or re-raise
            return {"text": "Помилка обробки аудіо", "intent": "chat", "error": str(e)}
